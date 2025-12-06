// src/app/features/trips/components/participants/components/participant-widget.component.ts

import { Component, Input, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripParticipantService } from '@core/trips/services/trip-participant.service';
import { AuthService } from '@core/authentication';
import { NotificationService } from '@core/notifications/notification.service';
import { ModalService } from '@core/modal/modal.service';

/**
 * Widget de participantes para mostrar en el detalle del viaje
 * Muestra la lista de participantes con avatar, nombre y rol
 */
@Component({
  selector: 'app-participant-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-62 flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-md font-medium text-gray-900 uppercase tracking-wide">Participantes</h3>
          <p class="text-sm text-gray-500">
            {{ participantService.participants().length }} acompañante(s)
          </p>
        </div>

        <!-- Menu button -->
        <button
          type="button"
          (click)="openParticipantsModal()"
          class="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          [title]="'Opciones'"
        >
          <i class="pi pi-pen-to-square" style="font-size: 1rem"></i>
        </button>
      </div>

      <!-- Loading state -->
      @if (isLoading()) {
      <div class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      }

      <!-- Participants list -->
      @if (!participantService.isLoading()) {
      <div class="space-y-3 mb-2 overflow-y-auto flex-1">
        @for (participant of displayedParticipants(); track participant.id) {
        <div class="group flex items-center gap-3 bg-gray-50 rounded-lg transition-colors">
          <!-- Avatar -->
          <div class="shrink-0 p-1">
            @if (participant.avatarUrl) {
            <!-- Avatar con imagen -->
            <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
              <img
                [src]="participant.avatarUrl"
                [alt]="participant.fullName"
                class="w-full h-full object-cover"
              />
            </div>
            } @else {
            <!-- Avatar por defecto -->
            <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <i class="pi pi-user" style="font-size: 1.1rem"></i>
            </div>
            }
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ getDisplayName(participant) }}
            </p>
            <p class="text-xs text-gray-500">
              {{ participant.isOwner ? 'Propietario' : 'Acompañante' }}
            </p>
          </div>

          <!-- Botón para eliminar (visible en hover, solo para el propietario) -->
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
        </div>
        }
      </div>
      }
    </div>
  `,
})
export class ParticipantWidgetComponent implements OnInit {
  @Input() tripId!: string;

  participantService = inject(TripParticipantService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private modalService = inject(ModalService);

  private currentUserId: string | null = null;
  private tripOwnerId: string | null = null;
  isLoading = signal(true);

  /**
   * Computed signal que devuelve los participantes a mostrar
   * - Máximo 3 participantes
   * - El owner siempre primero
   */
  displayedParticipants = computed(() => {
    const participants = this.participantService.participants();

    // Separar owner del resto
    const owner = participants.find((p) => p.isOwner);
    const others = participants.filter((p) => !p.isOwner);

    // Si hay owner, ponerlo primero y luego hasta 2 más
    if (owner) {
      return [owner, ...others.slice(0, 2)];
    }

    // Si no hay owner (caso raro), mostrar los primeros 3
    return participants.slice(0, 3);
  });

  async ngOnInit() {
    this.isLoading.set(true);
    if (this.tripId) {
      // Obtener el usuario actual
      const user = await this.authService.getAuthUser();
      this.currentUserId = user?.id || null;

      // Cargar participantes
      await this.participantService.loadParticipants(this.tripId);

      // Identificar quién es el owner del viaje
      const owner = this.participantService.participants().find((p) => p.isOwner);
      this.tripOwnerId = owner?.user_id || null;
      this.isLoading.set(false);
    }
  }

  /**
   * Determina si el usuario actual puede eliminar a este participante
   *
   * Solo el owner puede eliminar participantes, y no puede eliminarse a sí mismo
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
    if (isSelf) {
      return false;
    }

    return true;
  }

  /**
   * Elimina un participante del viaje
   */
  async removeParticipant(participant: any): Promise<void> {
    const confirmMessage = `¿Estás seguro de que quieres eliminar a ${this.getDisplayName(
      participant
    )} del viaje?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await this.participantService.removeParticipant(this.tripId, participant.user_id);

      // Recargar la lista de participantes
      this.isLoading.set(true);
      await this.participantService.loadParticipants(this.tripId);
      this.notificationService.success('Participante eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar participante:', error);
      this.notificationService.error(
        'No se pudo eliminar el participante. Por favor, inténtalo de nuevo.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Abre el modal con todos los participantes
   */
  openParticipantsModal(): void {
    this.modalService.openParticipantsModal(this.tripId);
  }

  /**
   * Maneja el clic en el botón de menú (tres puntos)
   *
   * TODO: Implementar funcionalidad (ver todos los participantes, configuración, etc)
   */
  onMenuClick(): void {
    console.log('Menu clicked - TODO: Implementar funcionalidad');
    // Aquí irá la lógica para mostrar un menú desplegable o modal
  }

  /**
   * Obtiene el nombre a mostrar del participante
   * Prioriza fullName, si no tiene muestra el email
   */
  getDisplayName(participant: any): string {
    if (participant.fullName && participant.fullName !== 'Usuario') {
      return participant.fullName;
    }
    return participant.email;
  }
}
