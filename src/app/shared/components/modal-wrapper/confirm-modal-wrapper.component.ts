import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmModalService } from '@core/modal/confirm-modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="confirmModal.isOpen()"
      class="fixed inset-0 z-8999 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" (click)="confirmModal.close()"></div>

      <!-- Modal -->
      <div
        class="relative z-50 pointer-events-auto bg-white rounded-lg shadow-2xl border border-gray-200 w-[500px] max-w-full p-6 flex flex-col"
        (click)="$event.stopPropagation()"
      >
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ confirmModal.title() }}</h2>
        <p class="text-gray-700 mb-6">{{ confirmModal.body() }}</p>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            (click)="confirmModal.close()"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            (click)="confirmModal.confirm()"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            {{ confirmModal.confirmText() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  confirmModal = inject(ConfirmModalService);
}
