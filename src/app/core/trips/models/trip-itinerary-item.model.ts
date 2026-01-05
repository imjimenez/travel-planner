import type { Tables, TablesInsert, TablesUpdate } from '@core/supabase/supabase.types';

/**
 * Modelo de parada del itinerario (lectura desde BD)
 */
export type ItineraryItem = Tables<'itinerary_item'>;

/**
 * Modelo para crear una nueva parada
 */
export type ItineraryItemInsert = TablesInsert<'itinerary_item'>;

/**
 * Modelo para actualizar una parada
 */
export type ItineraryItemUpdate = TablesUpdate<'itinerary_item'>;

/**
 * Parada con información adicional calculada
 */
export interface ItineraryItemWithDetails extends ItineraryItem {
  duration_days: number;
  /** Hora de inicio extraída de start_date */
  startTime?: string;
}
