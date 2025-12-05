// shared/components/modal-wrapper/modal-wrapper.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '@core/modal/modal.service';

@Component({
  selector: 'app-modal-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      (click)="modalService.close()"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div
        class="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200
               w-[85vw] h-[85vw] sm:w-[60vw] sm:h-[60vw] md:w-[50vw] md:h-[40vw]
               max-w-5xl max-h-[90vh] min-w-[300] min-h-[300] flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>

          <button
            type="button"
            (click)="modalService.close()"
            class="w-8 h-8 flex bg-white hover:bg-gray-50 shadow-sm border border-gray-100 rounded-full items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <i class="pi pi-times" style="color: black; font-size: 0.8rem"></i>
          </button>
        </div>

        <!-- Content con scroll -->
        <div class="flex-1 overflow-y-auto">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class ModalWrapperComponent {
  @Input() title: string = '';
  modalService = inject(ModalService);
}
