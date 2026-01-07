// src/app/features/trips/components/participants/components/participant-widget.component.ts

import { SlicePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DialogService } from '@core/dialog/services/dialog.service';
import { NotificationService } from '@core/notifications/notification.service';
import type { ParticipantWithUser } from '@core/trips';
import { TripParticipantStore } from '@core/trips/store/trip-participant.store';
import { ConfirmationService } from 'primeng/api';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ParticipantsModalComponent } from './participants-modal-component';

/**
 * Widget de participantes para mostrar en el detalle del viaje
 * Muestra la lista de participantes con avatar, nombre y rol
 */
@Component({
  selector: 'app-participant-widget',
  imports: [SlicePipe, ConfirmPopupModule],
  template: `
    <div
      class="md:h-62 flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-2 md:mb-4">
        <div>
          <h3 class="text-sm md:text-base font-medium text-gray-900 uppercase tracking-wide">
            Participantes
          </h3>
          <p class="text-xs md:text-sm text-gray-500">
            {{ isLoading() ? '?' : participants().length }} acompañante(s)
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
      }@else {
      <!-- Participants list -->
      <div class="space-y-3 mb-2 overflow-y-auto flex-1">
        @for (participant of participants() | slice:0:3; track participant.id) {
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
                (error)="onImageError($event)"
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
              {{ participant.fullName !== 'Usuario' ? participant.fullName : participant.email }}
            </p>
            <p class="text-xs text-gray-500">
              {{ participant.isOwner ? 'Propietario' : 'Acompañante' }}
            </p>
          </div>

          <!-- Botón para eliminar (visible en hover, solo para el propietario) -->
          @if (participant.isRemovable) {
          <button
            type="button"
            (click)="removeParticipant($event, participant)"
            class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-100 rounded-lg mr-1.5 cursor-pointer"
            [title]="'Eliminar participante'"
          >
            <i class="pi pi-trash" style="font-size: 0.875rem"></i>
          </button>
          <p-confirmpopup />
          }
        </div>
        }
      </div>
      }
    </div>
  `,
  providers: [ConfirmationService],
})
export class ParticipantWidgetComponent {
  readonly #tripParticipantStore = inject(TripParticipantStore);
  readonly #notificationService = inject(NotificationService);
  readonly #confirmationService = inject(ConfirmationService);
  readonly #dialogService = inject(DialogService);

  participants = this.#tripParticipantStore.participants;

  isLoading = this.#tripParticipantStore.isLoading;

  /**
   * Maneja el error de carga de imagen
   * Oculta la imagen y muestra el ícono por defecto
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Oculta la imagen que falló
    img.style.display = 'none';
    // Muestra el ícono por defecto en su lugar
    const parent = img.parentElement;
    if (parent) {
      parent.innerHTML = '<i class="pi pi-user text-gray-600" style="font-size: 1.1rem"></i>';
    }
  }

  /**
   * Elimina un participante del viaje
   */
  async removeParticipant(event: Event, participant: ParticipantWithUser): Promise<void> {
    this.#confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      header: 'Eliminar participante',
      message: `¿Estás seguro de que quieres eliminar a ${
        participant.fullName !== 'Usuario' ? participant.fullName : participant.email
      } del viaje?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await this.#tripParticipantStore.removeParticipantFromSelectedTrip(participant.user_id);
          this.#notificationService.success('Participante eliminado correctamente');
        } catch (error) {
          console.error('Error al eliminar participante:', error);
          this.#notificationService.error(
            error instanceof Error ? error.message : 'No se pudo eliminar el participante.'
          );
        }
      },
    });
  }

  /**
   * Abre el modal con todos los participantes
   */
  openParticipantsModal(): void {
    this.#dialogService.openCustomDialog(ParticipantsModalComponent, {
      header: 'Participantes',
      styleClass:
        'w-screen min-h-screen lg:min-h-auto lg:w-[85vw] lg:h-[85vh] min-h-[85vh] lg:max-w-5xl lg:max-h-[90vh]',
      contentStyle: {
        height: '100%',
      },
      closable: true,
      draggable: false,
      dismissableMask: true,
    });
  }
}
