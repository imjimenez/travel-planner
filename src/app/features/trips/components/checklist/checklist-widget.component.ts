// src/app/features/trips/components/checklist/checklist-widget.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
      class="h-42 bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold text-gray-900 uppercase tracking-wide">Checklist</h3>
        <span class="text-xs text-gray-500">{{ completedCount }}/{{ totalCount }}</span>
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

  get progressPercentage(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }
}
