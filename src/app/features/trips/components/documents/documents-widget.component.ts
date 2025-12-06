import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '@core/modal/modal.service';
import { TripDocumentService } from '@core/trips/services/trip-document.service';
import { NotificationService } from '@core/notifications/notification.service';
import type { TripDocumentWithUrl } from '@core/trips/models/trip-document.model';

/**
 * Widget de documentos para mostrar en el dashboard del viaje
 *
 * Funcionalidades:
 * - Muestra los 4 documentos más recientes con vista previa
 * - Permite subir documentos mediante click o drag & drop
 * - Muestra estado de carga durante la subida
 * - Abre el modal de documentos para ver todos los documentos
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
          <p class="text-sm text-gray-500">{{ documents().length }} documento(s)</p>
        </div>

        <!-- Menu button -->
        <button
          type="button"
          (click)="openDocumentsModal()"
          class="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          [title]="'Ver todos'"
        >
          <i class="pi pi-pen-to-square" style="font-size: 1rem"></i>
        </button>
      </div>

      <!-- Loading state -->
      @if (isLoading()) {
      <div class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      }

      <!-- Content -->
      @if (!isLoading()) {
      <div class="flex-1 overflow-y-auto">
        <!-- Empty state con drag & drop -->
        @if (documents().length === 0) {
        <div
          class="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors cursor-pointer"
          [class.border-gray-300]="!isDragging()"
          [class.bg-gray-50]="!isDragging()"
          [class.border-green-500]="isDragging()"
          [class.bg-green-50]="isDragging()"
          (click)="fileInput.click()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          <i
            class="pi pi-cloud-upload mb-2"
            [class.text-gray-400]="!isDragging()"
            [class.text-green-600]="isDragging()"
            style="font-size: 2rem"
          ></i>
          <p class="text-sm text-gray-600 text-center px-4">
            {{ isDragging() ? 'Suelta aquí el archivo' : 'Arrastra documentos o haz click' }}
          </p>
        </div>
        }

        <!-- Lista de documentos -->
        @if (documents().length > 0) {
        <div class="space-y-2">
          @for (doc of displayedDocuments(); track doc.id) {
          <div
            class="group flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            (click)="viewDocument(doc)"
          >
            <!-- Thumbnail / Icono -->
            <div
              class="shrink-0 w-10 h-10 rounded overflow-hidden flex items-center justify-center"
            >
              <i class="pi pi-file text-gray-400" style="font-size: 1.25rem"></i>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ doc.name }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(doc.uploaded_at) }}</p>
            </div>

            <!-- Icono de acción -->
            <i
              class="pi pi-external-link text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity pr-3"
              style="font-size: 0.875rem"
            ></i>
          </div>
          }

          <!-- Uploading indicator -->
          @if (isUploading()) {
          <div class="mt-3 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span class="text-sm text-gray-900">Subiendo documento...</span>
          </div>
          } @else {
          <!-- Botón para agregar más -->
          <div
            class="flex items-center gap-3 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors cursor-pointer"
            (click)="fileInput.click()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.border-green-500]="isDragging()"
            [class.bg-green-50]="isDragging()"
          >
            <div class="shrink-0 w-10 h-10 rounded flex items-center justify-center">
              <i class="pi pi-plus text-gray-400" style="font-size: 1.25rem"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-600">
                {{ isDragging() ? 'Suelta aquí el archivo' : 'Subir documento' }}
              </p>
            </div>
          </div>
          }
        </div>
        }
      </div>
      }

      <!-- Input oculto para seleccionar archivos -->
      <input
        #fileInput
        type="file"
        class="hidden"
        (change)="onFileSelected($event)"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
      />
    </div>
  `,
})
export class DocumentWidgetComponent implements OnInit {
  @Input() tripId!: string;

  private modalService = inject(ModalService);
  documentService = inject(TripDocumentService);
  private notificationService = inject(NotificationService);

  documents = signal<TripDocumentWithUrl[]>([]);
  isLoading = signal(true);
  isUploading = signal(false);
  isDragging = signal(false);

  /**
   * Computed: Primeros 2 documentos para mostrar en la lista
   */
  displayedDocuments = signal<TripDocumentWithUrl[]>([]);

  async ngOnInit() {
    await this.loadDocuments();
  }

  /**
   * Carga los documentos del viaje
   */
  private async loadDocuments(): Promise<void> {
    try {
      this.isLoading.set(true);
      const docs = await this.documentService.getTripDocumentsWithUrl(this.tripId);
      this.documents.set(docs);
      this.displayedDocuments.set(docs.slice(0, 2));
    } catch (error: any) {
      console.error('Error loading documents:', error);
      this.notificationService.error(error.message || 'No se pudieron cargar los documentos');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Maneja la selección de archivos desde el input
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      await this.uploadFiles(Array.from(files));
      input.value = ''; // Reset input
    }
  }

  /**
   * Maneja el evento dragover
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  /**
   * Maneja el evento dragleave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  /**
   * Maneja el drop de archivos
   */
  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.uploadFiles(Array.from(files));
    }
  }

  /**
   * Sube uno o más archivos
   */
  private async uploadFiles(files: File[]): Promise<void> {
    this.isUploading.set(true);

    try {
      for (const file of files) {
        await this.documentService.uploadDocument({
          tripId: this.tripId,
          file,
        });
      }

      this.notificationService.success(
        files.length === 1
          ? 'Documento subido correctamente'
          : `${files.length} documentos subidos correctamente`
      );

      await this.loadDocuments();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      this.notificationService.error(error.message || 'Error al subir los documentos');
    } finally {
      this.isUploading.set(false);
    }
  }

  /**
   * Visualiza un documento (abre en nueva pestaña)
   */
  viewDocument(doc: TripDocumentWithUrl): void {
    window.open(doc.publicUrl, '_blank');
  }

  /**
   * Formatea la fecha de subida
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'fecha desconocida';

    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'hoy';
    if (diffInDays === 1) return 'ayer';
    if (diffInDays < 7) return `hace ${diffInDays} días`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  /**
   * Abre el modal con todos los documentos
   */
  openDocumentsModal(): void {
    this.modalService.openDocumentsModal(this.tripId);
  }
}
