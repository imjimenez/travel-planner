// src/app/features/trips/components/documents/document-widget.component.ts
import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '@core/modal/modal.service';

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
      class="h-62 flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-md font-medium text-gray-900 uppercase tracking-wide">Documentos</h3>
          <p class="text-sm text-gray-500">{{ documentCount }} documento(s)</p>
        </div>

        <!-- Menu button -->
        <button
          type="button"
          (click)="openDocumentsModal()"
          class="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          [title]="'Opciones'"
        >
          <i class="pi pi-pen-to-square" style="font-size: 1rem"></i>
        </button>
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
  private modalService = inject(ModalService);

  /**
   * Abre el modal con todos los documentos
   */
  openDocumentsModal(): void {
    this.modalService.openDocumentsModal(this.tripId);
  }
}
