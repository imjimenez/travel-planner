import type { Tables, TablesInsert, TablesUpdate } from '@core/supabase/supabase.types';

/**
 * Modelo de TripInvite (lectura desde BD)
 */
export type TripInvite = Tables<'trip_invite'>;

/**
 * Modelo para crear una invitación
 */
export type TripInviteInsert = TablesInsert<'trip_invite'>;

/**
 * Modelo para actualizar una invitación
 */
export type TripInviteUpdate = TablesUpdate<'trip_invite'>;

/**
 * Estados posibles de una invitación
 */
export type InviteStatus = 'pending' | 'accepted' | 'expired';

/**
 * Datos para crear una invitación
 */
export interface CreateInviteData {
  tripId: string;
  email: string;
}

/**
 * Respuesta al crear una invitación
 */
export interface InviteCreatedResponse {
  invite: TripInvite;
  inviteLink: string; // Link completo para compartir
}