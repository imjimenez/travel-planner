// src/app/features/trips/components/itinerary/itinerary-empty-state.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Estado vacío del itinerario
 * Se muestra cuando no hay paradas añadidas
 */
@Component({
  selector: 'app-itinerary-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full text-center">
      <div class="max-w-md">
        <i class="pi pi-map" style="font-size: 3.5rem; padding: 1.5rem"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Planifica tu itinerario</h3>
        <p class="text-sm text-gray-500 mb-6">
          Crea paradas, actividades y organiza cada día de tu viaje
        </p>
        <button
          type="button"
          (click)="addStopClicked.emit()"
          class="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium cursor-pointer"
        >
          Añadir primera parada
        </button>
      </div>
    </div>
  `,
})
export class ItineraryEmptyStateComponent {
  @Output() addStopClicked = new EventEmitter<void>();
}
