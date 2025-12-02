import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase.service';
import { AuthService } from '@core/authentication/services/auth.service';
import { TripParticipantService } from './trip-participant.service';
import { TripService } from './trip.service';
import { EmailService } from '@core/notifications/email.service';
import type {
  TripInvite,
  CreateInviteData,
  InviteCreatedResponse,
} from '../models/trip-invite.model';
import { firstValueFrom } from 'rxjs';

/**
 * Servicio para gestión de invitaciones a viajes
 *
 * Permite a los miembros de un viaje:
 * - Invitar nuevos usuarios
 * - Reenviar invitaciones expiradas
 * - Ver invitaciones pendientes
 * - Cancelar invitaciones
 * - Aceptar invitaciones recibidas
 *
 * Nota: Cualquier miembro del viaje puede invitar, no solo el owner.
 *
 */
@Injectable({
  providedIn: 'root',
})
export class TripInviteService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private tripParticipantService = inject(TripParticipantService);
  private tripService = inject(TripService);
  private emailService = inject(EmailService);

  /**
   * Invita a un usuario a un viaje
   *
   * Crea una invitación con token único que expira en 7 días.
   * Verifica que el usuario actual es miembro y que el email
   * no está ya invitado ni es miembro.
   *
   * @param data - tripId y email del invitado
   * @returns Invitación creada y link para compartir
   * @throws Error si falla la creación o el envío del email
   */
  async inviteUser(data: CreateInviteData): Promise<InviteCreatedResponse> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que el usuario es miembro del viaje
    await this.verifyMembership(data.tripId, user.id);

    // Verificar que el email NO es ya miembro
    const alreadyMember = await this.isEmailAlreadyMember(data.tripId, data.email);
    if (alreadyMember) throw new Error('Este usuario ya es miembro del viaje');

    // Verificar que NO tiene invitación pendiente
    const hasPendingInvite = await this.hasPendingInvite(data.tripId, data.email);
    if (hasPendingInvite) throw new Error('Este usuario ya tiene una invitación pendiente');

    // Crear invitación
    const result = await this.createInvite(data.tripId, data.email, user.id);

    // Envía email de invitación
    await this.sendInvitationEmail(
      data.tripId,
      data.email,
      result.inviteLink,
      user.email || 'Un usuario'
    );

    return result;
  }

  /**
   * Reenvía una invitación
   *
   * Elimina la invitación antigua y crea una nueva con token fresco.
   * Útil cuando una invitación expiró o se perdió el link.
   */
  async resendInvite(inviteId: string): Promise<InviteCreatedResponse> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener invitación original
    const { data: oldInvite, error } = await this.supabaseService.client
      .from('trip_invite')
      .select('trip_id, email')
      .eq('id', inviteId)
      .single();

    if (error || !oldInvite || !oldInvite.trip_id) {
      throw new Error('Invitación no encontrada');
    }

    // Verificar que el usuario es miembro del viaje
    await this.verifyMembership(oldInvite.trip_id, user.id);

    // Eliminar invitación antigua
    await this.supabaseService.client.from('trip_invite').delete().eq('id', inviteId);

    // Crear nueva invitación
    const result = await this.createInvite(oldInvite.trip_id!, oldInvite.email, user.id);

    // Reenviar email
    await this.sendInvitationEmail(
      oldInvite.trip_id!,
      oldInvite.email,
      result.inviteLink,
      user.email || 'Un usuario'
    );

    return result;
  }

  /**
   * Obtiene el link de una invitación existente
   *
   * Para volver a compartir el link sin recrear la invitación.
   */
  async getInviteLink(inviteId: string): Promise<string> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: invite, error } = await this.supabaseService.client
      .from('trip_invite')
      .select('token, trip_id, status, expires_at')
      .eq('id', inviteId)
      .single();

    if (error || !invite || !invite.trip_id) {
      throw new Error('Invitación no encontrada');
    }

    // Verificar que el usuario es miembro del viaje
    await this.verifyMembership(invite.trip_id, user.id);

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Esta invitación expiró. Usa resendInvite() para crear una nueva');
    }

    return this.generateInviteLink(invite.token);
  }

  /**
   * Obtiene las invitaciones pendientes de un viaje
   *
   * @param tripId - ID del viaje
   * @returns Lista de invitaciones pendientes
   */
  async getPendingInvites(tripId: string): Promise<TripInvite[]> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Verificar que el usuario es miembro del viaje
    await this.verifyMembership(tripId, user.id);

    const { data, error } = await this.supabaseService.client
      .from('trip_invite')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error al obtener invitaciones: ${error.message}`);

    return data || [];
  }

  /**
   * Cancela una invitación pendiente
   *
   * Permisos:
   * El owner del viaje puede cancelar cualquier invitación
   * Quien creó la invitación puede cancelarla
   *
   * @param inviteId - ID de la invitación a cancelar
   */
  async cancelInvite(inviteId: string): Promise<void> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener invitación con información del viaje
    const { data: invite, error: getError } = await this.supabaseService.client
      .from('trip_invite')
      .select('id, trip_id, invited_by')
      .eq('id', inviteId)
      .single();

    if (getError || !invite || !invite.trip_id) {
      throw new Error('Invitación no encontrada');
    }

    // Verificar permisos
    const isOwner = await this.tripService.isOwner(invite.trip_id);
    const isInviter = user.id === invite.invited_by;

    if (!isOwner && !isInviter) {
      throw new Error('No tienes permisos');
    }

    // Eliminar invitación
    const { error } = await this.supabaseService.client
      .from('trip_invite')
      .delete()
      .eq('id', inviteId);

    if (error) throw new Error(`Error al cancelar invitación: ${error.message}`);
  }

  /**
   * Acepta una invitación usando el token
   *
   * Utiliza la función RPC accept_trip_invite de Supabase que:
   * 1. Verifica que el token es válido y no ha expirado
   * 2. Verifica que el email coincide con el usuario actual
   * 3. Añade al usuario a trip_user
   * 4. Marca la invitación como accepted
   *
   * @param token - Token único de la invitación
   * @returns Resultado de la aceptación
   * @throws Error si el token es inválido o ha expirado
   *
   * @example
   * // En el componente que recibe el token por URL
   * const token = route.params.token;
   * await tripInviteService.acceptInvite(token);
   * router.navigate(['/trips', tripId]);
   */
  async acceptInvite(token: string): Promise<{ tripId: string }> {
    const user = await this.authService.getAuthUser();

    if (!user) {
      throw new Error('Debes iniciar sesión para aceptar la invitación');
    }

    // Llamar a la función RPC que maneja todo el proceso
    const { data, error } = await this.supabaseService.client.rpc('accept_trip_invite', {
      invite_token: token,
    });

    if (error) {
      throw new Error(`Error al aceptar invitación: ${error.message}`);
    }

    // Verificar la respuesta
    // data es de tipo Json, necesitamos hacer type assertion
    const response = data as { success?: boolean; error?: string; trip_id?: string };

    if (!response.success || !response.trip_id) {
      throw new Error(response.error || 'Invitación inválida o expirada');
    }

    return { tripId: response.trip_id };
  }

  /**
   * Obtiene las invitaciones recibidas por el usuario actual
   *
   * Muestra invitaciones pendientes enviadas al email del usuario.
   *
   * @returns Lista de invitaciones pendientes para el usuario
   */
  async getMyInvites(): Promise<TripInvite[]> {
    const user = await this.authService.getAuthUser();

    if (!user || !user.email) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await this.supabaseService.client
      .from('trip_invite')
      .select('*, trip:trip_id(name, city, country)')
      .eq('email', user.email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener invitaciones: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================
  // MÉTODOS PÚBLICOS DE VERIFICACIÓN
  // (útiles para UI: deshabilitar botones, mostrar mensajes, etc.)
  // ==========================================

  /**
   * Verifica si un email ya es miembro del viaje
   *
   * Útil para validar antes de mostrar el formulario de invitación.
   *
   * @public
   */
  async isEmailAlreadyMember(tripId: string, email: string): Promise<boolean> {
    return this.tripParticipantService.hasParticipantWithEmail(tripId, email);
  }

  /**
   * Verifica si un email tiene invitación pendiente
   */
  async hasPendingInvite(tripId: string, email: string): Promise<boolean> {
    const { data } = await this.supabaseService.client
      .from('trip_invite')
      .select('id')
      .eq('trip_id', tripId)
      .eq('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    return !!data;
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Crea una invitación (lógica común para inviteUser y resendInvite)
   *
   * @private
   */
  private async createInvite(
    tripId: string,
    email: string,
    invitedBy: string
  ): Promise<InviteCreatedResponse> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error } = await this.supabaseService.client.rpc(
      'create_trip_invitation',
      {
        p_trip_id: tripId,
        p_email: email,
        p_token: token,
        p_invited_by: invitedBy,
        p_expires_at: expiresAt.toISOString(),
      }
    );

    if (error) throw new Error(`Error al crear invitación: ${error.message}`);

    return {
      invite,
      inviteLink: this.generateInviteLink(token),
    };
  }

  /**
   * Envía el email de invitación
   *
   * Método privado reutilizable para inviteUser y resendInvite.
   * Si falla el envío, lanza un error para que el componente lo maneje.
   *
   * @private
   * @param tripId - ID del viaje
   * @param recipientEmail - Email del destinatario
   * @param inviteLink - Link de la invitación
   * @param inviterEmail - Email de quien invita
   * @throws Error si no se puede enviar el email
   */
  private async sendInvitationEmail(
    tripId: string,
    recipientEmail: string,
    inviteLink: string,
    inviterEmail: string
  ): Promise<void> {
    try {
      const trip = await this.tripService.getTripById(tripId);

      await this.emailService.sendTripInvite(recipientEmail, inviteLink, trip.name, inviterEmail);
    } catch (error) {
      // Log para debugging pero lanzamos el error
      console.error('Error al enviar email de invitación:', error);
      throw new Error('La invitación se creó pero no se pudo enviar el email');
    }
  }

  /**
   * Verifica si el usuario es miembro del viaje
   */
  private async verifyMembership(tripId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('trip_user')
      .select('trip_id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Solo los miembros del viaje pueden realizar esta acción');
    }
  }

  /**
   * Genera un token único para la invitación
   */
  private generateToken(): string {
    // Genera un token aleatorio de 32 caracteres
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Genera el link completo de invitación
   */
  private generateInviteLink(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite/${token}`;
  }
}
