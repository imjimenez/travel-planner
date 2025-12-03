// src/app/features/trips/components/participants/components

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Widget de participantes para mostrar en el dashboard del viaje
 * Muestra el contador de participantes y un resumen
 */
@Component({
  selector: 'app-participant-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-42 bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold text-gray-900 uppercase tracking-wide">Participantes</h3>
        <span class="text-xs text-gray-500">{{ participantCount }}</span>
      </div>
      <p class="text-sm text-gray-500">
        {{
          participantCount === 0
            ? 'Invita a personas para compartir este viaje'
            : participantCount + ' personas confirmadas'
        }}
      </p>
    </div>
  `,
})
export class ParticipantWidgetComponent {
  @Input() tripId!: string;
  @Input() participantCount: number = 0;
}
