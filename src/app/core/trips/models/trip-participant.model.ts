import type { Tables } from '@core/supabase/supabase.types';

/**
 * Modelo de TripUser (participante)
 */
export type TripParticipant = Tables<'trip_user'>;

/**
 * Participante con información del usuario
 */
export interface ParticipantWithUser extends TripParticipant {
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  isOwner: boolean;
}
