// src/core/trips/services/trip.service.ts
import { Injectable, inject } from "@angular/core";
import { AuthService } from "@core/authentication/services/auth.service";
import { SupabaseService } from "@core/supabase/supabase.service";
import type { Trip, TripInsert, TripUpdate } from "@core/trips/models";

/**
 * Servicio para gestión de viajes (trips)
 *
 * Proporciona operaciones CRUD sobre la tabla 'trip' de Supabase:
 * - Crear viajes
 * - Obtener viajes del usuario
 * - Actualizar viajes
 * - Eliminar viajes
 *
 * Nota: La asignación del usuario actual a la tabla trip_user se maneja
 * automáticamente mediante trigger de base de datos.
 */
@Injectable({
	providedIn: "root",
})
export class TripService {
	readonly #supabase = inject(SupabaseService);
	readonly #authService = inject(AuthService);

	async loadUserTrips(): Promise<Trip[]> {
		const user = this.#authService.currentUser;
		if (!user) {
			return [];
		}
		const { data, error } = await this.#supabase.client
			.from("trip")
			.select(`
        *,
        trip_user!inner(user_id)
        `)
			.eq("trip_user.user_id", user.id);

		if (error) throw error;
		return data;
	}

	/**
	 * Obtiene un viaje específico por su ID
	 *
	 * @param tripId - ID del viaje a obtener
	 * @returns El viaje encontrado
	 * @throws Error si el viaje no existe o el usuario no tiene acceso
	 */
	async getTripById(tripId: string): Promise<Trip> {
		const user = await this.#authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		// Verificar que el usuario tiene acceso al trip
		const { data: tripUser, error: accessError } = await this.#supabase.client
			.from("trip_user")
			.select("trip_id")
			.eq("trip_id", tripId)
			.eq("user_id", user.id)
			.maybeSingle(); // Usar maybeSingle() en lugar de single()

		if (accessError || !tripUser) {
			throw new Error("No tienes acceso a este viaje");
		}

		const { data, error } = await this.#supabase.client
			.from("trip")
			.select("*")
			.eq("id", tripId)
			.maybeSingle();

		if (error) {
			throw new Error(`Error al obtener viaje: ${error.message}`);
		}

		if (!data) {
			throw new Error("Viaje no encontrado");
		}

		return data;
	}

	/**
	 * Crea un nuevo viaje
	 *
	 * @param trip - Datos del viaje a crear
	 * @returns El viaje creado con su ID generado
	 * @throws Error si falla la creación
	 *
	 */
	async createTrip(trip: TripInsert): Promise<Trip> {
		const user = await this.#authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		const { data, error } = await this.#supabase.client
			.from("trip")
			.insert({
				...trip,
				owner_user_id: user.id,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Error al crear viaje: ${error.message}`);
		}

		return data;
	}

	/**
	 * Actualiza un viaje existente
	 *
	 * Solo el propietario del viaje puede actualizarlo.
	 *
	 * @param tripId - ID del viaje a actualizar
	 * @param updates - Campos a actualizar
	 * @returns El viaje actualizado
	 * @throws Error si el usuario no es propietario o falla la actualización
	 */
	async updateTrip(tripId: string, updates: TripUpdate): Promise<Trip> {
		const user = await this.#authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		// Verificar que el usuario es el propietario
		const { data: trip, error: tripError } = await this.#supabase.client
			.from("trip")
			.select("owner_user_id")
			.eq("id", tripId)
			.maybeSingle(); // Usar maybeSingle() en lugar de single()

		if (tripError || !trip) {
			throw new Error("Viaje no encontrado");
		}

		if (trip.owner_user_id !== user.id) {
			throw new Error("Solo el propietario puede actualizar el viaje");
		}

		const { data, error } = await this.#supabase.client
			.from("trip")
			.update(updates)
			.eq("id", tripId)
			.select()
			.single();

		if (error) {
			throw new Error(`Error al actualizar viaje: ${error.message}`);
		}

		return data;
	}

	/**
	 * Elimina un viaje
	 *
	 * Solo el propietario del viaje puede eliminarlo.
	 * La eliminación es en cascada (elimina también trip_users, invitaciones, etc.)
	 *
	 * @param tripId - ID del viaje a eliminar
	 * @throws Error si el usuario no es propietario o falla la eliminación
	 */
	async deleteTrip(tripId: string): Promise<void> {
		const user = await this.#authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		// Verificar que el usuario es el propietario
		const { data: trip, error: tripError } = await this.#supabase.client
			.from("trip")
			.select("owner_user_id")
			.eq("id", tripId)
			.maybeSingle(); // ⚠️ CAMBIO CLAVE: usar maybeSingle() en lugar de single()

		if (tripError) {
			throw new Error(`Error al verificar el viaje: ${tripError.message}`);
		}

		if (!trip) {
			throw new Error("Viaje no encontrado");
		}

		if (trip.owner_user_id !== user.id) {
			throw new Error("Solo el propietario puede eliminar el viaje");
		}

		const { error } = await this.#supabase.client
			.from("trip")
			.delete()
			.eq("id", tripId);

		if (error) {
			throw new Error(`Error al eliminar viaje: ${error.message}`);
		}

	}

	/**
	 * Verifica si el usuario actual es propietario de un viaje
	 *
	 * @param tripId - ID del viaje a verificar
	 * @returns true si el usuario es propietario, false en caso contrario
	 */
	async isOwner(tripId: string): Promise<boolean> {
		const user = await this.#authService.getAuthUser();

		if (!user) {
			return false;
		}

		const { data, error } = await this.#supabase.client
			.from("trip")
			.select("owner_user_id")
			.eq("id", tripId)
			.maybeSingle(); // Usar maybeSingle() en lugar de single()

		if (error || !data) {
			return false;
		}

		return data.owner_user_id === user.id;
	}
}
