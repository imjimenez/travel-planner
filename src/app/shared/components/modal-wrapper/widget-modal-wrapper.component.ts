// shared/components/modal-wrapper/modal-wrapper.component.ts
import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetModalService } from '@core/dialog/widget-modal.service';

@Component({
  selector: 'app-widget-modal-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Backdrop (solo desktop) -->
    <div
      class="hidden lg:block fixed inset-0 z-10 bg-black/50"
      (click)="widgetModalService.close()"
    ></div>

    <!-- Modal Container -->
    <div class="fixed inset-0 z-20 flex items-center justify-center lg:p-4 pointer-events-none">
      <div
        class="pointer-events-auto bg-white lg:rounded-2xl lg:shadow-2xl lg:border border-gray-200
               w-screen h-screen lg:w-[85vw] lg:h-[85vh] lg:max-w-5xl lg:max-h-[90vh]
               flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>

          <button
            type="button"
            (click)="widgetModalService.close()"
            class="w-8 h-8 flex bg-white hover:bg-gray-100 shadow-sm border border-gray-100 rounded-lg items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-200 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <i class="pi pi-times" style="color: black; font-size: 1rem"></i>
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
  widgetModalService = inject(WidgetModalService);
}
