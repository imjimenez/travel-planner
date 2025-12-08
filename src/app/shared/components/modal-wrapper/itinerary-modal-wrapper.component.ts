// src/core/trips/components/itinerary-modal-wrapper/itinerary-modal-wrapper.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItineraryModalService } from '@core/modal/itinerary-modal.service';
import { ItineraryModalComponent } from '@features/trips/components/itinerary/itinerary-modal.component';

/**
 * Wrapper del modal de itinerario
 *
 * Proporciona:
 * - Backdrop con blur
 * - Animación de deslizamiento desde la derecha
 * - Ancho fijo de 700px
 * - Padding y diseño de card
 * - Cierre al hacer clic en el backdrop
 */
@Component({
  selector: 'app-itinerary-modal-wrapper',
  standalone: true,
  imports: [CommonModule, ItineraryModalComponent],
  template: `
    @if (modalService.isOpen()) {
    <div class="fixed inset-0 z-299 flex items-center justify-end">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        (click)="modalService.close()"
      ></div>

      <!-- Modal container deslizante desde la derecha -->
      <div
        class="relative h-full w-[700px] transform animate-slide-in-right"
        (click)="$event.stopPropagation()"
      >
        <!-- Padding interno para crear efecto de card -->
        <div class="h-full p-6">
          <!-- Card interna con bordes redondeados -->
          <div
            class="h-full bg-gray-50 rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden"
          >
            <!-- Componente del modal -->
            <app-itinerary-modal class="flex-1 flex flex-col overflow-hidden"></app-itinerary-modal>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .animate-slide-in-right {
        animation: slideInRight 0.3s ease-out forwards;
      }

      .animate-fade-in {
        animation: fadeIn 0.2s ease-out forwards;
      }
    `,
  ],
})
export class ItineraryModalWrapperComponent {
  modalService = inject(ItineraryModalService);
}
