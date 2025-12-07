// src/app/features/trips/components/participants/participants-modal.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetModalService } from '@core/modal/widget-modal.service';
import { TripInviteService, TripParticipantService } from '@core/trips';
import { NotificationService } from '@core/notifications/notification.service';
import { AuthService } from '@core/authentication';
import { ConfirmModalService } from '@core/modal/confirm-modal.service';

@Component({
  selector: 'app-participants-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Contenido scrolleable -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Participantes activos -->
        <div class="mb-6">
          @if (participantService.isLoading()) {
          <div class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
          } @else {
          <div class="space-y-2">
            @for (participant of participantService.participants(); track participant.id) {
            <div class="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-colors">
              <!-- Avatar -->
              <div class="shrink-0">
                @if (participant.avatarUrl) {
                <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <img
                    [src]="participant.avatarUrl"
                    [alt]="participant.fullName"
                    class="w-full h-full object-cover"
                  />
                </div>
                } @else {
                <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <i class="pi pi-user" style="font-size: 1.1rem"></i>
                </div>
                }
              </div>

              <!-- Info -->
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{{ getDisplayName(participant) }}</p>
                <p class="text-xs text-gray-500">{{ participant.email }}</p>
              </div>

              <!-- Botón eliminar (solo visible para owner y no puede eliminarse a sí mismo) -->
              @if (canRemoveParticipant(participant)) {
              <button
                type="button"
                (click)="removeParticipant(participant)"
                class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-100 rounded-lg mr-1.5 cursor-pointer"
                [title]="'Eliminar participante'"
              >
                <i class="pi pi-trash" style="font-size: 0.875rem"></i>
              </button>
              }

              <!-- Badge -->
              <span
                class="text-xs px-2 py-1 rounded"
                [class]="
                  participant.isOwner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                "
              >
                {{ participant.isOwner ? 'Propietario' : 'Acompañante' }}
              </span>
            </div>
            } @empty {
            <p class="text-gray-500 text-center py-4 text-sm">No hay participantes</p>
            }
          </div>
          }
        </div>

        <!-- Invitaciones pendientes -->
        @if (pendingInvites().length > 0) {
        <div class="mb-6 pb-6 pt-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">
            Invitaciones pendientes ({{ pendingInvites().length }})
          </h3>
          <div class="space-y-2">
            @for (invite of pendingInvites(); track invite.id) {
            <div class="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-colors">
              <!-- Avatar -->
              <div
                class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0"
              >
                <i class="pi pi-envelope" style="font-size: 0.875rem"></i>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ invite.email }}</p>
                <p class="text-xs text-gray-500">Invitado {{ formatDate(invite.created_at) }}</p>
              </div>

              <!-- Botones de acción -->
              <div
                class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <!-- Copiar link -->
                <button
                  type="button"
                  (click)="copyInviteLink(invite.id)"
                  class="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                  title="Copiar link"
                >
                  <i class="pi pi-clipboard" style="font-size: 0.85rem"></i>
                </button>

                <!-- Reenviar -->
                <button
                  type="button"
                  (click)="resendInvite(invite.id)"
                  class="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-100 rounded transition-colors cursor-pointer"
                  title="Reenviar invitación"
                >
                  @if (isResending()) {
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  } @else {
                  <i class="pi pi-sync" style="font-size: 0.85rem"></i>
                  }
                </button>

                <!-- Cancelar -->
                <button
                  type="button"
                  (click)="cancelInvite(invite.id)"
                  class="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                  title="Cancelar invitación"
                >
                  <i class="pi pi-times" style="font-size: 0.85rem"></i>
                </button>
              </div>

              <!-- Badge -->
              <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded shrink-0"
                >Pendiente</span
              >
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Formulario fijo abajo -->
      <div class="shrink-0 border-t border-gray-200 p-6 bg-white">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Invitar nuevo participante</h3>

        <form (submit)="sendInvite($event)" class="space-y-3">
          <div class="flex gap-2">
            <input
              type="email"
              [(ngModel)]="inviteEmail"
              name="inviteEmail"
              placeholder="correo@ejemplo.com"
              required
              [disabled]="isSendingInvite()"
              class="flex-1 px-3 py-2 border bg-white border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 placeholder-gray-400 rounded-lg text-sm disabled:bg-gray-100"
            />
            <button
              type="submit"
              [disabled]="isSendingInvite() || !inviteEmail"
              class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center gap-2"
            >
              @if (isSendingInvite()) {
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Enviando...</span>
              } @else {
              <span>Enviar</span>
              }
            </button>
          </div>

          @if (inviteError()) {
          <p class="text-sm text-red-600">{{ inviteError() }}</p>
          }
        </form>
      </div>
    </div>
  `,
})
export class ParticipantsModalComponent implements OnInit {
  participantService = inject(TripParticipantService);
  private inviteService = inject(TripInviteService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private widgetModalService = inject(WidgetModalService);
  private confirmModalService = inject(ConfirmModalService);

  pendingInvites = signal<Array<{ id: string; email: string; created_at: string | null }>>([]);
  inviteEmail = '';
  isSendingInvite = signal(false);
  isResending = signal(false);
  inviteError = signal<string | null>(null);

  private currentUserId: string | null = null;
  private tripOwnerId: string | null = null;

  async ngOnInit() {
    const tripId = this.widgetModalService.tripId();
    if (tripId) {
      // Obtener usuario actual
      const user = await this.authService.getAuthUser();
      this.currentUserId = user?.id || null;

      // Identificar owner del viaje
      const owner = this.participantService.participants().find((p) => p.isOwner);
      this.tripOwnerId = owner?.user_id || null;

      await this.loadPendingInvites(tripId);
    }
  }

  private async loadPendingInvites(tripId: string) {
    try {
      const invites = await this.inviteService.getPendingInvites(tripId);
      this.pendingInvites.set(invites);
    } catch (error) {
      console.error('Error loading pending invites:', error);
    }
  }

  /**
   * Determina si el usuario actual puede eliminar a este participante
   */
  canRemoveParticipant(participant: any): boolean {
    if (!this.currentUserId || !this.tripOwnerId) {
      return false;
    }

    // Solo el owner puede eliminar
    const isOwner = this.currentUserId === this.tripOwnerId;
    if (!isOwner) {
      return false;
    }

    // El owner no puede eliminarse a sí mismo
    const isSelf = participant.user_id === this.currentUserId;
    return !isSelf;
  }

  /**
   * Elimina un participante del viaje
   */
  async removeParticipant(participant: any) {
    this.confirmModalService.open(
      'Eliminar participante',
      `¿Estás seguro de que quieres eliminar a ${this.getDisplayName(participant)} del viaje?`,
      async () => {
        try {
          const tripId = this.widgetModalService.tripId();
          if (!tripId) return;

          await this.participantService.removeParticipant(tripId, participant.user_id);
          await this.participantService.loadParticipants(tripId);
          this.notificationService.success('Participante eliminado correctamente');
        } catch (error: any) {
          console.error('Error removing participant:', error);
          this.notificationService.error(error.message || 'No se pudo eliminar el participante');
        }
      },
      'Eliminar'
    );
  }

  /**
   * Copia el enlace de invitación al portapapeles
   */
  async copyInviteLink(inviteId: string) {
    try {
      const link = await this.inviteService.getInviteLink(inviteId);
      await navigator.clipboard.writeText(link);
      this.notificationService.success('Enlace copiado al portapapeles');
    } catch (error: any) {
      console.error('Error copying invite link:', error);
      this.notificationService.error(error.message || 'No se pudo copiar el enlace');
    }
  }

  /**
   * Reenvía una invitación
   */
  async resendInvite(inviteId: string) {
    this.confirmModalService.open(
      'Reenviar email',
      '¿Estás seguro de que quieres reenviar el email de invitación?',
      async () => {
        this.isResending.set(true);

        try {
          await this.inviteService.resendInvite(inviteId);
          this.notificationService.success('Invitación reenviada correctamente');

          const tripId = this.widgetModalService.tripId();
          if (tripId) {
            await this.loadPendingInvites(tripId);
          }
        } catch (error: any) {
          console.error('Error resending invite:', error);
          this.notificationService.error(error.message || 'No se pudo reenviar la invitación');
        } finally {
          this.isResending.set(false);
        }
      },
      'Reenviar'
    );
  }

  async sendInvite(event: Event) {
    event.preventDefault();
    const tripId = this.widgetModalService.tripId();
    if (!this.inviteEmail || this.isSendingInvite() || !tripId) return;

    this.isSendingInvite.set(true);
    this.inviteError.set(null);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.inviteEmail)) {
        throw new Error('Por favor, introduce un email válido');
      }

      await this.inviteService.inviteUser({
        tripId,
        email: this.inviteEmail.trim().toLowerCase(),
      });

      this.notificationService.success('Invitación enviada correctamente');
      this.inviteEmail = '';
      await this.loadPendingInvites(tripId);
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error al enviar la invitación');
      console.error('Error sending invite:', error);
    } finally {
      this.isSendingInvite.set(false);
    }
  }

  async cancelInvite(inviteId: string) {
    this.confirmModalService.open(
      'Cancelar invitación',
      '¿Estás seguro de que quieres cancelar esta invitación?',
      async () => {
        try {
          await this.inviteService.cancelInvite(inviteId);
          this.notificationService.success('Invitación cancelada');

          const tripId = this.widgetModalService.tripId();
          if (tripId) {
            await this.loadPendingInvites(tripId);
          }
        } catch (error: any) {
          console.error('Error canceling invite:', error);
          this.notificationService.error(error.message || 'Error al cancelar la invitación');
        }
      },
      'Cancelar invitación'
    );
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'fecha desconocida';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'hoy';
    if (diffInDays === 1) return 'ayer';
    if (diffInDays < 7) return `hace ${diffInDays} días`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getDisplayName(participant: any): string {
    if (participant.fullName && participant.fullName !== 'Usuario') {
      return participant.fullName;
    }
    return participant.email;
  }
}
