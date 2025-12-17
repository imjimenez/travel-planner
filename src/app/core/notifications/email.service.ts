import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@core/supabase/supabase.service';

/**
 * Servicio para envío de emails mediante Edge Functions de Supabase
 *
 * Utiliza Resend API de forma segura desde el backend (Edge Function)
 * para enviar invitaciones y notificaciones relacionadas con viajes.
 */
@Injectable({
  providedIn: 'root',
})
export class EmailService {
  private supabase: SupabaseClient = inject(SupabaseService).client;

  /**
   * Envía email de invitación a viaje
   *
   * @param to Email del destinatario
   * @param inviteLink URL de la invitación
   * @param tripName Nombre del viaje
   * @param inviterName Nombre de quien invita
   * @throws Error si el envío falla
   */
  async sendTripInvite(
    to: string,
    inviteLink: string,
    tripName: string,
    inviterName: string
  ): Promise<void> {
    try {
      const { data, error } = await this.supabase.functions.invoke('resend-email', {
        body: {
          to,
          inviteLink,
          tripName,
          inviterName,
        },
      });

      if (error) {
        console.error('Error invocando Edge Function:', error);
        throw new Error('No se pudo enviar el email de invitación');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Error desconocido al enviar email');
      }
    } catch (error) {
      console.error('Error enviando email de invitación:', error);
      throw error;
    }
  }
}
