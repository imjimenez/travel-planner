// src/app/features/trips/components/checklist/checklist-widget.component.ts
import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '@core/modal/modal.service';

/**
 * TODO:
 * Widget de checklist para mostrar en el dashboard del viaje
 * Muestra el progreso de tareas completadas
 */
@Component({
  selector: 'app-checklist-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-62 flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-md font-medium text-gray-900 uppercase tracking-wide">Checklist</h3>
          <p class="text-sm text-gray-500">{{ completedCount / totalCount }}</p>
        </div>

        <!-- Menu button -->
        <button
          type="button"
          (click)="openCheckListModal()"
          class="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          [title]="'Opciones'"
        >
          <i class="pi pi-pen-to-square" style="font-size: 1rem"></i>
        </button>
      </div>

      <p class="text-sm text-gray-500">
        {{
          totalCount === 0 ? 'Organiza las tareas pendientes' : progressPercentage + '% completado'
        }}
      </p>
    </div>
  `,
})
export class ChecklistWidgetComponent {
  @Input() tripId!: string;
  @Input() completedCount: number = 0;
  @Input() totalCount: number = 0;
  private modalService = inject(ModalService);

  get progressPercentage(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  /**
   * Abre el modal con todos los participantes
   */
  openCheckListModal(): void {
    this.modalService.openChecklistModal(this.tripId);
  }
}
