import { Injectable, inject, signal } from "@angular/core";
import { AuthService } from "@core/authentication/services/auth.service";
import { SupabaseService } from "@core/supabase/supabase.service";
import type {
	ItineraryItem,
	ItineraryItemInsert,
	ItineraryItemUpdate,
	ItineraryItemWithDetails,
} from "../models";

/**
 * Servicio para gestión de paradas del itinerario
 *
 * Proporciona operaciones CRUD sobre la tabla 'itinerary_item' de Supabase:
 * - Crear paradas
 * - Obtener paradas de un viaje
 * - Actualizar paradas
 * - Eliminar paradas
 *
 * Todos los participantes del viaje pueden crear, modificar y eliminar paradas.
 */
@Injectable({
	providedIn: "root",
})
export class ItineraryService {
	private supabase = inject(SupabaseService);
	private authService = inject(AuthService);


	/**
	 * Carga todas las paradas de un viaje y actualiza el signal
	 *
	 * @param tripId - ID del viaje
	 */
	async loadItineraryItems(
		tripId: string,
	): Promise<ItineraryItemWithDetails[]> {
		try {
			const user = this.authService.currentUser;
			if (!user) throw new Error("Usuario no autenticado");

			// Verificar acceso al viaje
			await this.verifyTripAccess(tripId, user.id);

			const { data, error } = await this.supabase.client.rpc(
				"get_itinerary_items_with_duration",
				{ trip_id_param: tripId },
			);
			if (error) throw new Error(`Error al obtener paradas: ${error.message}`);

			return data ?? [];
		} catch (error) {
			console.error("Error cargando paradas del itinerario:", error);
			throw error;
		}
	}

	/**
	 * Crea una nueva parada en el itinerario
	 *
	 * @param item - Datos de la parada a crear
	 * @returns La parada creada con su ID generado
	 * @throws Error si falla la creación
	 */
	async createItineraryItem(
		item: ItineraryItemInsert,
	): Promise<ItineraryItemWithDetails> {
		const user = await this.authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		// Verificar acceso al viaje
		if (item.trip_id) {
			await this.verifyTripAccess(item.trip_id, user.id);
		}

		const { data, error } = await this.supabase.client
			.from("itinerary_item")
			.insert(item)
			.select()
			.single();

		if (error) {
			throw new Error(`Error al crear parada: ${error.message}`);
		}

		return {
			...data,
			duration_days: this.calculateDuration(data.start_date, data.end_date),
		};
	}

	/**
	 * Actualiza una parada del itinerario
	 *
	 * Cualquier participante del viaje puede actualizar paradas.
	 *
	 * @param itemId - ID de la parada a actualizar
	 * @param updates - Campos a actualizar
	 * @returns La parada actualizada
	 * @throws Error si el usuario no tiene acceso o falla la actualización
	 */
	async updateItineraryItem(
		itemId: string,
		updates: ItineraryItemUpdate,
	): Promise<ItineraryItemWithDetails> {
		const user = await this.authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		const { data, error } = await this.supabase.client
			.from("itinerary_item")
			.update(updates)
			.eq("id", itemId)
			.select()
			.single();

		if (error) {
			throw new Error(`Error al actualizar parada: ${error.message}`);
		}

		return {
			...data,
			duration_days: this.calculateDuration(data.start_date, data.end_date),
		};
	}

	/**
	 * Elimina una parada del itinerario
	 *
	 * Cualquier participante del viaje puede eliminar paradas.
	 * La eliminación es en cascada (elimina también documentos asociados).
	 *
	 * @param itemId - ID de la parada a eliminar
	 * @throws Error si el usuario no tiene acceso o falla la eliminación
	 */
	async deleteItineraryItem(itemId: string): Promise<void> {
		const user = await this.authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		const { error } = await this.supabase.client
			.from("itinerary_item")
			.delete()
			.eq("id", itemId);

		if (error) {
			throw new Error(`Error al eliminar parada: ${error.message}`);
		}
	}

	/**
	 * Obtiene el número de paradas de un viaje
	 *
	 * @param tripId - ID del viaje
	 * @returns Número de paradas
	 */
	async getItineraryItemCount(tripId: string): Promise<number> {
		const user = await this.authService.getAuthUser();

		if (!user) {
			throw new Error("Usuario no autenticado");
		}

		await this.verifyTripAccess(tripId, user.id);

		const { count, error } = await this.supabase.client
			.from("itinerary_item")
			.select("*", { count: "exact", head: true })
			.eq("trip_id", tripId);

		if (error) {
			throw new Error(`Error al contar paradas: ${error.message}`);
		}

		return count || 0;
	}

	/**
	 * Calcula la duración en días de una parada
	 *
	 * @param startDate - Fecha de inicio
	 * @param endDate - Fecha de fin
	 * @returns Número de días
	 */
	calculateDuration(startDate: string, endDate: string): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	/**
	 * Verifica que el usuario tiene acceso al viaje
	 *
	 * @private
	 * @throws Error si el usuario no tiene acceso
	 */
	private async verifyTripAccess(
		tripId: string,
		userId: string,
	): Promise<void> {
		const { data, error } = await this.supabase.client
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
