import type { Tables, TablesInsert, TablesUpdate } from '../../supabase/supabase.types';

/**
 * Modelo de Trip (lectura desde BD)
 */
export type Trip = Tables<'trip'>;

/**
 * Modelo para crear un nuevo Trip
 */
export type TripInsert = TablesInsert<'trip'>;

/**
 * Modelo para actualizar un Trip
 */
export type TripUpdate = TablesUpdate<'trip'>;

/**
 * Trip con información adicional calculada
 */
export interface TripWithDetails extends Trip {
  duration?: number; // días de duración
  isOwner?: boolean; // si el usuario actual es el dueño
}