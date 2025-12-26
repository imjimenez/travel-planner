import type {
	Tables,
	TablesInsert,
	TablesUpdate,
} from "@core/supabase/supabase.types";

/**
 * Modelo de Trip (lectura desde BD)
 */
export type Trip = Tables<"trip">;

/**
 * Modelo para crear un nuevo Trip
 */
export type TripInsert = TablesInsert<"trip">;

/**
 * Modelo para actualizar un Trip
 */
export type TripUpdate = TablesUpdate<"trip">;

/**
 * Trip con información adicional calculada
 */
export interface TripWithDetails extends Trip {
	duration?: number; // días de duración
	isOwner?: boolean; // si el usuario actual es el dueño
}

export const INVALID_COORDINATE = 999;
export const DEFAULT_COORDINATES = { lat: 42.847, lng: -2.673 };
