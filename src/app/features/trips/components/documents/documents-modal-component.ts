// src/app/features/trips/components/participants/participants-modal.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '@core/modal/modal.service';
import { NotificationService } from '@core/notifications/notification.service';
import { AuthService } from '@core/authentication';

@Component({
  selector: 'app-documents-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Contenido scrolleable -->
      <div class="flex-1 overflow-y-auto p-6"></div>

      <!-- Formulario fijo abajo -->
      <div class="shrink-0 border-t border-gray-200 p-6 bg-white"></div>
    </div>
  `,
})
export class DocumentsModalComponent {
  modalService = inject(ModalService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
}
