// src/app/features/trips/components/documents/document-widget.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * TODO:
 * Widget de documentos para mostrar en el dashboard del viaje
 * Muestra el contador de documentos subidos
 */
@Component({
  selector: 'app-document-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-42 bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold text-gray-900 uppercase tracking-wide">Documentos</h3>
        <span class="text-xs text-gray-500">{{ documentCount }}</span>
      </div>
      <p class="text-sm text-gray-500">
        {{
          documentCount === 0
            ? 'Sube documentos importantes para el viaje'
            : documentCount + ' documentos almacenados'
        }}
      </p>
    </div>
  `,
})
export class DocumentWidgetComponent {
  @Input() tripId!: string;
  @Input() documentCount: number = 0;
}
