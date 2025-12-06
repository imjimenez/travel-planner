import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '@core/modal/modal.service';
import { NotificationService } from '@core/notifications/notification.service';
import { TripDocumentService } from '@core/trips/services/trip-document.service';
import type { TripDocumentWithUrl } from '@core/trips/models/trip-document.model';

/**
 * Modal de gestión de documentos
 *
 * Funcionalidades:
 * - Grid de vista previa de todos los documentos
 * - Click para visualizar documento en nueva pestaña
 * - Opción para descargar documento
 * - Opción para eliminar documento (con permisos)
 * - Subir nuevos documentos desde el formulario
 * - Soporte para drag & drop en la zona de subida
 */
@Component({
  selector: 'app-documents-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Contenido scrolleable -->
      <div
        class="flex-1 overflow-y-auto p-6"
        [class.flex]="!isLoading() && documents().length === 0"
        [class.items-center]="!isLoading() && documents().length === 0"
        [class.justify-center]="!isLoading() && documents().length === 0"
      >
        <!-- Loading state -->
        @if (isLoading()) {
        <div class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        }

        <!-- Empty state -->
        @if (!isLoading() && documents().length === 0) {
        <div class="flex flex-col items-center justify-center">
          <i class="pi pi-file text-gray-300" style="font-size: 4rem"></i>
          <h3 class="mt-4 text-lg font-medium text-gray-900">No hay documentos</h3>
          <p class="mt-2 text-sm text-gray-500 text-center max-w-sm">
            Sube documentos importantes para tu viaje como reservas, tickets, itinerarios, etc.
          </p>
        </div>
        }

        <!-- Grid de documentos -->
        @if (!isLoading() && documents().length > 0) {
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @for (doc of documents(); track doc.id) {
          <div>
            <!-- Card del documento -->
            <div
              class="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md cursor-pointer"
              (click)="viewDocument(doc)"
            >
              <!-- Vista previa -->
              @if (documentService.isImage(doc.name)) {
              <img [src]="doc.publicUrl" [alt]="doc.name" class="w-full h-full object-cover" />
              } @else {
              <div
                class="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-4"
              >
                <i class="pi pi-file text-gray-400 mb-2" style="font-size: 2.5rem"></i>
                <p class="text-xs text-gray-600 text-center font-medium">
                  {{ getFileExtension(doc.name) }}
                </p>
              </div>
              }

              <!-- Overlay con acciones -->
              <div
                class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
              >
                <!-- Descargar -->
                <button
                  type="button"
                  (click)="downloadDocument(doc, $event)"
                  class="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  title="Descargar"
                >
                  <i class="pi pi-download text-gray-700" style="font-size: 1rem"></i>
                </button>

                <!-- Eliminar -->
                <button
                  type="button"
                  (click)="deleteDocument(doc, $event)"
                  class="w-10 h-10 bg-white hover:bg-red-50 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <i class="pi pi-trash text-red-600" style="font-size: 1rem"></i>
                </button>
              </div>
            </div>

            <!-- Nombre del documento -->
            <div class="mt-2 px-1">
              <p class="text-sm text-gray-900 font-medium truncate" [title]="doc.name">
                {{ doc.name }}
              </p>
              <p class="text-xs text-gray-500">{{ formatDate(doc.uploaded_at) }}</p>
            </div>
          </div>
          }
        </div>
        }
      </div>

      <!-- Formulario fijo abajo -->
      <div class="shrink-0 border-t border-gray-200 p-6 bg-white">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Subir nuevo documento</h3>

        <!-- Drag & drop zone -->
        <div
          class="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer"
          [class.border-gray-300]="!isDragging()"
          [class.bg-gray-50]="!isDragging()"
          [class.border-green-500]="isDragging()"
          [class.bg-green-50]="isDragging()"
          (click)="fileInput.click()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          @if (!isUploading()) {
          <i
            class="pi pi-cloud-upload mb-2"
            [class.text-gray-400]="!isDragging()"
            [class.text-green-600]="isDragging()"
            style="font-size: 2rem"
          ></i>
          <p class="text-sm text-gray-600">
            {{
              isDragging()
                ? 'Suelta aquí los archivos'
                : 'Arrastra archivos o haz click para seleccionar'
            }}
          </p>
          <p class="text-xs text-gray-500 mt-1">PDF, DOC, XLS, imágenes, etc.</p>
          } @else {
          <div class="flex flex-col items-center gap-2">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p class="text-sm text-green-900">Subiendo documentos...</p>
          </div>
          }
        </div>

        <!-- Input oculto -->
        <input
          #fileInput
          type="file"
          class="hidden"
          (change)="onFileSelected($event)"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
        />
      </div>
    </div>
  `,
})
export class DocumentsModalComponent implements OnInit {
  modalService = inject(ModalService);
  documentService = inject(TripDocumentService);
  private notificationService = inject(NotificationService);

  documents = signal<TripDocumentWithUrl[]>([]);
  isLoading = signal(false);
  isUploading = signal(false);
  isDragging = signal(false);

  async ngOnInit() {
    const tripId = this.modalService.tripId();
    if (tripId) {
      await this.loadDocuments(tripId);
    }
  }

  /**
   * Carga los documentos del viaje
   */
  private async loadDocuments(tripId: string): Promise<void> {
    try {
      this.isLoading.set(true);
      const docs = await this.documentService.getTripDocumentsWithUrl(tripId);
      this.documents.set(docs);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      this.notificationService.error(error.message || 'No se pudieron cargar los documentos');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Visualiza un documento (abre en nueva pestaña)
   */
  viewDocument(doc: TripDocumentWithUrl): void {
    window.open(doc.publicUrl, '_blank');
  }

  /**
   * Descarga un documento
   */
  downloadDocument(doc: TripDocumentWithUrl, event: Event): void {
    event.stopPropagation();

    // Crear un link temporal para forzar la descarga
    const link = document.createElement('a');
    link.href = doc.publicUrl;
    link.download = doc.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Descargando documento...');
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(doc: TripDocumentWithUrl, event: Event): Promise<void> {
    event.stopPropagation();

    const confirmMessage = `¿Estás seguro de que quieres eliminar "${doc.name}"?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await this.documentService.deleteDocument(doc.id);
      this.notificationService.success('Documento eliminado correctamente');

      const tripId = this.modalService.tripId();
      if (tripId) {
        await this.loadDocuments(tripId);
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      this.notificationService.error(error.message || 'No se pudo eliminar el documento');
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
    const tripId = this.modalService.tripId();
    if (!tripId) return;

    this.isUploading.set(true);

    try {
      for (const file of files) {
        await this.documentService.uploadDocument({
          tripId,
          file,
        });
      }

      this.notificationService.success(
        files.length === 1
          ? 'Documento subido correctamente'
          : `${files.length} documentos subidos correctamente`
      );

      await this.loadDocuments(tripId);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      this.notificationService.error(error.message || 'Error al subir los documentos');
    } finally {
      this.isUploading.set(false);
    }
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

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Obtiene la extensión del archivo para mostrar
   */
  getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  }
}
