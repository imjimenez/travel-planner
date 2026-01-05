import { Injectable, inject, signal } from "@angular/core";
import { AuthService } from "@core/authentication/services/auth.service";
import { SupabaseService } from "@core/supabase/supabase.service";
import { TripService } from "@core/trips/services/trip.service";
import type {
	ParticipantWithUser,
	TripParticipant,
} from "../models/trip-participant.model";

/**
 * Servicio para gestión de participantes de viajes
 *
 * Permite:
 * - Listar participantes de un viaje
 * - Ver detalles de participantes (email, nombre, avatar, etc)
 * - Eliminar participantes (owner puede eliminar cualquiera, usuarios se remueven a sí mismos)
 *
 */
@Injectable({
	providedIn: "root",
})
export class TripParticipantService {
	private supabaseService = inject(SupabaseService);
	private authService = inject(AuthService);
	private tripService = inject(TripService);

	// Signal que guarda la lista de participantes de un viaje
	private participantsSignal = signal<ParticipantWithUser[]>([]);
	participants = this.participantsSignal.asReadonly();

	private currentTripIdSignal = signal<string | null>(null);
	currentTripId = this.currentTripIdSignal.asReadonly();

	// Signal de estado de carga
	private loadingSignal = signal(false);
	isLoading = this.loadingSignal.asReadonly();

	/**
	 * Carga todos los participantes de un viaje y actualiza el signal
	 */
	async loadParticipantsByTripId(
		tripId: string,
	): Promise<ParticipantWithUser[]> {
		try {
			const user = this.authService.currentUser;
			if (!user) throw new Error("Usuario no autenticado");

			const { data: participants, error } =
				await this.supabaseService.client.rpc("get_trip_participants", {
					p_trip_id: tripId,
				});

			if (error)
				throw new Error(`Error al obtener participantes: ${error.message}`);

			// Mapear a ParticipantWithUser
			return participants.map((p) => ({
				id: p.trip_user_id,
				user_id: p.user_id,
				trip_id: p.trip_id,
				added_at: p.added_at,
				email: p.email || "Email no disponible",
				fullName: p.full_name || "Usuario",
				avatarUrl: p.avatar_url || undefined,
				isOwner: p.is_owner || false,
				isRemovable: p.is_removable || false,
			}));
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	/**
	 * Carga todos los participantes de un viaje y actualiza el signal
	 */
	async loadParticipants(tripId: string): Promise<void> {
		this.currentTripIdSignal.set(tripId);
		this.loadingSignal.set(true);
		this.participantsSignal.set([]);

		try {
			const user = await this.authService.getAuthUser();
			if (!user) throw new Error("Usuario no autenticado");

			// Verifica membresía
			await this.verifyMembership(tripId, user.id);

			const trip = await this.tripService.getTripById(tripId);

			const { data: participants, error } =
				await this.supabaseService.client.rpc("get_trip_participants", {
					p_trip_id: tripId,
				});

			if (error)
				throw new Error(`Error al obtener participantes: ${error.message}`);
			if (!participants) {
				this.participantsSignal.set([]);
				return;
			}

			// Mapear a ParticipantWithUser
			const mapped = participants.map((p): ParticipantWithUser => {
				return {
					id: p.trip_user_id,
					user_id: p.user_id,
					trip_id: p.trip_id,
					added_at: p.added_at,
					email: p.email || "Email no disponible",
					fullName: p.full_name || "Usuario",
					avatarUrl: p.avatar_url || undefined,
					isOwner: p.user_id === trip.owner_user_id,
				};
			});

			this.participantsSignal.set(mapped);
		} catch (error) {
			console.error(error);
			this.participantsSignal.set([]);
		} finally {
			this.loadingSignal.set(false);
		}
	}

	/**
	 * Obtiene todos los participantes de un viaje con información completa
	 *
	 * Incluye email, nombre completo y avatar de cada participante.
	 * Utiliza una función RPC optimizada que hace join con auth.users
	 * para obtener toda la información en una sola consulta.
	 *
	 * @param tripId - ID del viaje
	 * @returns Lista de participantes con información del usuario
	 * @throws Error si el usuario no está autenticado
	 *
	 */
	async getParticipants(tripId: string): Promise<ParticipantWithUser[]> {
		const user = await this.authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		// Verifica membresía
		await this.verifyMembership(tripId, user.id);

		// Obtiene el viaje para saber quién es el owner
		const trip = await this.tripService.getTripById(tripId);

		// Obtener participantes con información de usuario
		const { data: participants, error } = await this.supabaseService.client.rpc(
			"get_trip_participants",
			{ p_trip_id: tripId },
		);

		if (error) {
			throw new Error(`Error al obtener participantes: ${error.message}`);
		}

		if (!participants) {
			return [];
		}

		// Mapear a ParticipantWithUser
		return participants.map((p): ParticipantWithUser => {
			const tripParticipant: TripParticipant = {
				id: p.trip_user_id,
				user_id: p.user_id,
				trip_id: p.trip_id,
				added_at: p.added_at,
			};

			// Extender con información adicional del usuario
			return {
				...tripParticipant,
				email: p.email || "Email no disponible",
				fullName: p.full_name || "Usuario",
				avatarUrl: p.avatar_url || undefined,
				isOwner: p.user_id === trip.owner_user_id,
			};
		});
	}

	/**
	 * Remueve un participante del viaje
	 *
	 * Permisos:
	 * - El owner puede remover a cualquier participante
	 * - Los participantes pueden removerse a sí mismos (salir del viaje)
	 * - El owner NO puede removerse a sí mismo (debe transferir ownership primero)
	 *
	 * @param tripId - ID del viaje
	 * @param userId - ID del usuario a remover
	 * @throws Error si no tiene permisos o falla la operación
	 *
	 * @example
	 * // Owner remueve a alguien
	 * await participantService.removeParticipant('trip-123', 'user-456');
	 *
	 * // Usuario sale del viaje
	 * const currentUser = await authService.getAuthUser();
	 * await participantService.removeParticipant('trip-123', currentUser.id);
	 */
	async removeParticipantFromTrip(
		tripId: string,
		userId: string,
	): Promise<void> {
		// Remover participante
		const { error, count } = await this.supabaseService.client
			.from("trip_user")
			.delete({ count: "exact" })
			.eq("user_id", userId)
			.eq("trip_id", tripId);

		if (error || count === 0) {
			if (count === 0) {
				console.error("No se pudo eliminar. Verifica las políticas RLS.");
			} else {
				console.error(error);
			}
			throw new Error(`Error al remover participante`);
		}
	}

	/**
	 * Verifica si ya existe un participante con el email indicado.
	 *
	 * Se usa para evitar mandar invitaciones duplicadas.
	 */
	async hasParticipantWithEmail(
		tripId: string,
		email: string,
	): Promise<boolean> {
		const normalizedEmail = email.trim().toLowerCase();

		if (!normalizedEmail) {
			return false;
		}

		const { data: participants, error } = await this.supabaseService.client.rpc(
			"get_trip_participants",
			{ p_trip_id: tripId },
		);

		if (error) {
			throw new Error(`Error al verificar participantes: ${error.message}`);
		}

		if (!participants) {
			return false;
		}

		return participants.some(
			(participant) =>
				participant.email?.trim().toLowerCase() === normalizedEmail,
		);
	}

	/**
	 * Verifica que el usuario es miembro del viaje
	 *
	 * @private
	 * @throws Error si el usuario no es miembro
	 */
	private async verifyMembership(
		tripId: string,
		userId: string,
	): Promise<void> {
		const { data, error } = await this.supabaseService.client
			.from("trip_user")
			.select("trip_id")
			.eq("trip_id", tripId)
			.eq("user_id", userId)
			.maybeSingle();

		if (error || !data) {
			throw new Error("No tienes acceso a este viaje");
		}
	}
}
