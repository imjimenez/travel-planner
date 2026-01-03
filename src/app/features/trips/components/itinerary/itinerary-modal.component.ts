// src/core/trips/components/itinerary-modal/itinerary-modal.component.ts
import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItineraryModalService } from '@core/dialog/itinerary-modal.service';
import { ItineraryService } from '@core/trips';
import { LeafletService } from '@shared/components/map/services/leaflet.service';
import { MapComponent } from '@shared/components/map/map.component';
import { NotificationService } from '@core/notifications/notification.service';
import type { ItineraryItem, ItineraryItemInsert } from '@core/trips';
import type { MapCoordinates, GeocodingResult } from '@shared/components/map/models';
import { Subscription } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmModalService } from '@core/dialog/confirm-modal.service';
import { TripDocumentService } from '@core/trips/services/trip-document.service';
import type { TripDocumentWithUrl } from '@core/trips/models/trip-document.model';

/**
 * Formulario de datos para crear/editar parada
 */
interface ItineraryFormData {
  name: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  end_date: string;
  description: string;
  web: string;
}

/**
 * Componente del modal de itinerario
 *
 * Maneja tres modos:
 * - create: Crear nueva parada (con documentos temporales)
 * - view: Ver detalles de una parada
 * - edit: Editar parada existente
 *
 * Incluye:
 * - Formulario con validación
 * - Mapa interactivo para selección de ubicación
 * - Buscador de ubicaciones
 * - Gestión de fechas con datepickers
 * - Gestión de documentos asociados (en todos los modos)
 */
@Component({
  selector: 'app-itinerary-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent, DatePickerModule],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-8 pb-6 shrink-0 relative">
        <div class="flex items-center gap-4">
          <!-- Icono según modo -->
          <div
            class="min-w-12 min-h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-200"
          >
            <i class="pi pi-map-marker" style="font-size: 1.25rem"></i>
          </div>

          <!-- Título según modo -->
          <div>
            <h2 class="text-xl md:text-2xl font-semibold text-gray-900">
              @if (modalService.mode() === 'create') { Nueva parada } @if (modalService.mode() ===
              'view') { Detalles de la parada } @if (modalService.mode() === 'edit') { Editar parada
              }
            </h2>
            <p class="text-sm w-4/5 md:w-full text-gray-500 mt-0.5">
              @if (modalService.mode() === 'create') { Añade un nuevo destino a tu itinerario } @if
              (modalService.mode() === 'view') { Información completa de la parada } @if
              (modalService.mode() === 'edit') { Modifica los detalles de la parada }
            </p>
          </div>
        </div>

        <!-- Botón cerrar -->
        <button
          type="button"
          (click)="close()"
          class="min-w-10 min-h-10 absolute right-3 top-3 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <i class="pi pi-times text-gray-600" style="font-size: 1rem"></i>
        </button>
      </div>

      <!-- MODO: VIEW -->
      @if (modalService.mode() === 'view' && currentItem()) {
      <div class="flex-1 overflow-y-auto px-8 pb-6">
        <!-- Nombre -->
        <div class="mb-8">
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Nombre
          </label>
          <p class="text-lg font-medium text-gray-900">{{ currentItem()!.name }}</p>
        </div>

        <!-- Ubicación -->
        <div class="mb-8">
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Ubicación
          </label>
          @if (currentItem()!.city && currentItem()!.country) {
          <p class="text-base text-gray-900">
            {{ currentItem()!.city }}, {{ currentItem()!.country }}
          </p>
          } @else {
          <p class="text-base text-gray-500 italic">No especificada</p>
          }
        </div>

        <!-- Fechas -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Inicio
            </label>
            <p class="text-base text-gray-900">{{ formatDate(currentItem()!.start_date) }}</p>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Fin
            </label>
            <p class="text-base text-gray-900">{{ formatDate(currentItem()!.end_date) }}</p>
          </div>
        </div>

        @if (calculateDuration(currentItem()!.start_date, currentItem()!.end_date) > 1) {
        <!-- Duración -->
        <div class="mb-8">
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Duración
          </label>
          <p class="text-base text-gray-900">
            {{ calculateDuration(currentItem()!.start_date, currentItem()!.end_date) }} días
          </p>
        </div>
        }

        <!-- Descripción -->
        @if (currentItem()!.description) {
        <div class="mb-8">
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Descripción
          </label>
          <p class="text-base text-gray-900 whitespace-pre-wrap">
            {{ currentItem()!.description }}
          </p>
        </div>
        }

        <!-- Web -->
        @if (currentItem()!.web) {
        <div class="mb-8">
          <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Sitio web
          </label>
          <a
            [href]="currentItem()!.web"
            target="_blank"
            rel="noopener noreferrer"
            class="text-green-600 hover:text-green-800 hover:underline break-all"
          >
            {{ currentItem()!.web }}
          </a>
        </div>
        }

        <!-- Mapa en modo VIEW-ONLY -->
        @if (currentItem()!.latitude && currentItem()!.longitude) {
        <div class="mb-8">
          <label class="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Ubicación en el mapa
          </label>
          <div class="rounded-xl overflow-hidden border border-gray-300">
            <app-map
              #mapViewRef
              [config]="{
                mode: 'view-only',
                height: '300px',
                zoom: 12,
                center: { lat: currentItem()!.latitude!, lng: currentItem()!.longitude! }
              }"
            >
            </app-map>
          </div>
        </div>
        }

        <!-- Documentos asociados (VIEW) -->
        @if (itemDocuments().length > 0) {
        <div class="mb-6">
          <label class="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Documentos asociados
          </label>

          <!-- Grid de documentos -->
          <div class="grid grid-cols-2 gap-4">
            @for (doc of itemDocuments(); track doc.id) {
            <div>
              <!-- Card del documento -->
              <div
                class="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md cursor-pointer"
                (click)="viewItemDocument(doc)"
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
                    (click)="downloadItemDocument(doc, $event)"
                    class="w-10 h-10 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    title="Descargar"
                  >
                    <i class="pi pi-download text-gray-700" style="font-size: 1rem"></i>
                  </button>

                  <!-- Eliminar -->
                  <button
                    type="button"
                    (click)="deleteItemDocument(doc, $event)"
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
                <p class="text-xs text-gray-500">{{ formatDocDate(doc.uploaded_at) }}</p>
              </div>
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Footer con botones en modo view -->
      <div class="flex justify-between items-center px-8 py-6 border-t border-gray-200 shrink-0">
        <button
          type="button"
          (click)="confirmDelete()"
          [disabled]="isDeleting()"
          class="px-5 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium border border-red-200 cursor-pointer"
        >
          @if (!isDeleting()) {
          <span>Eliminar parada</span>
          } @else {
          <span>Eliminando...</span>
          }
        </button>

        <button
          type="button"
          (click)="switchToEdit()"
          class="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium cursor-pointer"
        >
          Editar parada
        </button>
      </div>
      }

      <!-- MODO: CREATE o EDIT -->
      @if (modalService.mode() === 'create' || modalService.mode() === 'edit') {
      <div class="flex-1 overflow-y-auto px-8 pb-6">
        <!-- Nombre -->
        <div class="mb-6">
          <label
            for="item-name"
            class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide"
          >
            Nombre de la parada
          </label>
          <input
            type="text"
            id="item-name"
            [(ngModel)]="formData.name"
            placeholder="Ej: Torre Eiffel, Hotel Marítimo..."
            maxlength="200"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
        </div>

        <!-- Ubicación con buscador y mapa -->
        <div class="mb-6">
          <div class="flex gap-3 items-center">
            <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Ubicación
            </label>

            @if (tripCity() && tripCountry()) {
            <p class="text-sm text-gray-600 mb-2">{{ tripCity() }}, {{ tripCountry() }}</p>
            }
          </div>

          <div class="flex flex-col md:flex-row gap-3 mb-4">
            <input
              type="text"
              [(ngModel)]="locationSearch"
              (keyup.enter)="searchLocation()"
              placeholder="Buscar ciudad o lugar..."
              class="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
            <button
              type="button"
              (click)="searchLocation()"
              [disabled]="!locationSearch"
              class="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              Buscar
            </button>
          </div>

          <div class="rounded-xl overflow-hidden border border-gray-300">
            <app-map
              #mapRef
              [config]="{
                mode: 'select-location',
                height: '280px',
                zoom: tripLatitude() && tripLongitude() ? 12 : 6,
                center:
                  tripLatitude() && tripLongitude()
                    ? { lat: tripLatitude()!, lng: tripLongitude()! }
                    : modalService.trip() &&
                      modalService.trip()!.latitude &&
                      modalService.trip()!.longitude
                    ? { lat: modalService.trip()!.latitude!, lng: modalService.trip()!.longitude! }
                    : { lat: 42.847, lng: -2.673 }
              }"
              (locationSelected)="onMapLocationSelected($event)"
            >
            </app-map>
          </div>
        </div>

        <!-- Fechas CON HORA -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Fecha y hora inicio
            </label>
            <div class="card flex justify-center">
              <p-datepicker
                class="w-full"
                [showIcon]="true"
                [showTime]="true"
                [showSeconds]="false"
                [(ngModel)]="startDate"
                dateFormat="dd/mm/yy"
                placeholder="Seleccionar fecha y hora"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Fecha y hora fin
            </label>
            <div class="card flex justify-center">
              <p-datepicker
                class="w-full"
                [showIcon]="true"
                [showTime]="true"
                [showSeconds]="false"
                [(ngModel)]="endDate"
                dateFormat="dd/mm/yy"
                placeholder="Seleccionar fecha y hora"
              />
            </div>
          </div>
        </div>

        <!-- Descripción -->
        <div class="mb-6">
          <label
            for="item-description"
            class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide"
          >
            Descripción
          </label>
          <textarea
            id="item-description"
            [(ngModel)]="formData.description"
            placeholder="Añade notas, precio, recomendaciones... (opcional)"
            rows="4"
            maxlength="1000"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-none"
          ></textarea>
        </div>

        <!-- Web -->
        <div class="mb-6">
          <label
            for="item-web"
            class="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide"
          >
            Sitio web
          </label>
          <input
            type="url"
            id="item-web"
            [(ngModel)]="formData.web"
            placeholder="https://ejemplo.com"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
          />
        </div>

        <!-- Documentos (CREATE/EDIT) -->
        <div class="mb-6">
          <label class="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Documentos asociados @if (modalService.mode() === 'create') {
            <span class="text-xs font-normal text-gray-500 ml-2">(opcional)</span>
            }
          </label>

          <!-- Lista de documentos -->
          @if (itemDocuments().length > 0) {
          <div class="space-y-3 mb-4">
            @for (doc of itemDocuments(); track doc.id) {
            <div
              class="group flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer p-3"
              (click)="viewItemDocument(doc)"
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
                <p class="text-xs text-gray-500">{{ formatDocDate(doc.uploaded_at) }}</p>
              </div>

              <!-- Acciones -->
              <button
                type="button"
                (click)="deleteItemDocument(doc, $event)"
                class="w-8 h-8 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                title="Eliminar"
              >
                <i class="pi pi-trash text-red-600" style="font-size: 0.875rem"></i>
              </button>
            </div>
            }
          </div>
          }

          <!-- Drag & drop zone -->
          <div
            class="border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer"
            [class.border-gray-300]="!isDraggingDoc()"
            [class.bg-gray-50]="!isDraggingDoc()"
            [class.border-green-500]="isDraggingDoc()"
            [class.bg-green-50]="isDraggingDoc()"
            (click)="docFileInput.click()"
            (dragover)="onDocDragOver($event)"
            (dragleave)="onDocDragLeave($event)"
            (drop)="onDocDrop($event)"
          >
            @if (!isUploadingDoc()) {
            <i
              class="pi pi-cloud-upload mb-2"
              [class.text-gray-400]="!isDraggingDoc()"
              [class.text-green-600]="isDraggingDoc()"
              style="font-size: 1.5rem"
            ></i>
            <p class="text-sm text-gray-600">
              {{
                isDraggingDoc()
                  ? 'Suelta aquí el archivo'
                  : 'Arrastra documentos o haz click para adjuntar'
              }}
            </p>
            <p class="text-xs text-gray-500 mt-1">PDF, imágenes, etc.</p>
            } @else {
            <div class="flex flex-col items-center gap-2">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <p class="text-sm text-green-900">Subiendo...</p>
            </div>
            }
          </div>

          <!-- Input oculto -->
          <input
            #docFileInput
            type="file"
            class="hidden"
            (change)="onDocFileSelected($event)"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
          />
        </div>
      </div>

      <!-- Footer con botones en modo create/edit -->
      <div class="flex justify-between items-center px-8 py-6 border-t border-gray-200 shrink-0">
        @if (modalService.mode() === 'edit') {
        <button
          type="button"
          (click)="cancelEdit()"
          class="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
        >
          Cancelar
        </button>
        } @else {
        <div></div>
        }

        <button
          type="button"
          (click)="save()"
          [disabled]="isSaving()"
          class="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
        >
          @if (!isSaving()) { @if (modalService.mode() === 'create') {
          <span>Crear parada</span>
          } @else {
          <span>Guardar cambios</span>
          } } @else { @if (modalService.mode() === 'create') {
          <span>Creando...</span>
          } @else {
          <span>Guardando...</span>
          } }
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      ::ng-deep .p-component {
        color-scheme: light;
      }
    `,
  ],
})
export class ItineraryModalComponent implements OnInit, AfterViewInit, OnDestroy {
  modalService = inject(ItineraryModalService);
  private itineraryService = inject(ItineraryService);
  private leafletService = inject(LeafletService);
  private notificationService = inject(NotificationService);
  private confirmModalService = inject(ConfirmModalService);
  documentService = inject(TripDocumentService);

  @ViewChild('mapRef') mapComponent?: MapComponent;
  @ViewChild('mapViewRef') mapViewComponent?: MapComponent;

  // Estados
  isSaving = signal(false);
  isDeleting = signal(false);
  isUploadingDoc = signal(false);
  isDraggingDoc = signal(false);

  // Parada actual (en modo view/edit)
  currentItem = computed(() => this.modalService.item());

  // Datos del formulario
  formData: ItineraryFormData = {
    name: '',
    city: '',
    country: '',
    latitude: null,
    longitude: null,
    start_date: '',
    end_date: '',
    description: '',
    web: '',
  };

  // Signals para ubicación (patrón del wizard)
  tripCity = signal('');
  tripCountry = signal('');
  tripLatitude = signal<number | null>(null);
  tripLongitude = signal<number | null>(null);

  // Datepickers
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  // Búsqueda de ubicación
  locationSearch = '';
  private searchSubscription?: Subscription;

  // Documentos asociados a la parada
  itemDocuments = signal<TripDocumentWithUrl[]>([]);

  // IDs de documentos temporales subidos en modo CREATE (sin itinerary_item_id aún)
  private tempDocumentIds: string[] = [];

  constructor() {
    // Effect para sincronizar startDate con formData.start_date
    effect(() => {
      const date = this.startDate();
      if (date) {
        this.formData.start_date = date.toISOString();

        // Siempre actualizar fecha fin
        const endDateTime = new Date(date);
        endDateTime.setHours(endDateTime.getHours() + 1);
        this.endDate.set(endDateTime);
      }
    });

    // Effect para sincronizar endDate con formData.end_date
    effect(() => {
      const date = this.endDate();
      if (date) {
        this.formData.end_date = date.toISOString();
      }
    });

    // Effect para sincronizar ubicación
    effect(() => {
      this.formData.city = this.tripCity();
      this.formData.country = this.tripCountry();
      this.formData.latitude = this.tripLatitude();
      this.formData.longitude = this.tripLongitude();
    });
  }

  ngOnInit(): void {
    if (
      (this.modalService.mode() === 'edit' || this.modalService.mode() === 'view') &&
      this.currentItem()
    ) {
      this.loadItemData(this.currentItem()!);
      this.loadItemDocuments(this.currentItem()!.id);
    }
  }

  ngAfterViewInit(): void {
    if (this.modalService.mode() === 'create') {
      const trip = this.modalService.trip();
      if (trip && trip.latitude && trip.longitude && this.mapComponent) {
        setTimeout(() => {
          if (this.mapComponent) {
            this.mapComponent.centerMap({ lat: trip.latitude!, lng: trip.longitude! }, 10);
          }
        }, 150);
      }
    } else if (this.modalService.mode() === 'edit' && this.currentItem() && this.mapComponent) {
      const item = this.currentItem()!;
      if (item.latitude && item.longitude) {
        setTimeout(() => {
          if (this.mapComponent) {
            this.mapComponent.centerMap({ lat: item.latitude!, lng: item.longitude! }, 12);
            this.mapComponent.addSimpleMarker({ lat: item.latitude!, lng: item.longitude! });
          }
        }, 150);
      }
    } else if (this.modalService.mode() === 'view' && this.currentItem() && this.mapViewComponent) {
      const item = this.currentItem()!;
      if (item.latitude && item.longitude) {
        setTimeout(() => {
          if (this.mapViewComponent) {
            this.mapViewComponent.centerMap({ lat: item.latitude!, lng: item.longitude! }, 12);
            this.mapViewComponent.addSimpleMarker({ lat: item.latitude!, lng: item.longitude! });
          }
        }, 150);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  /**
   * Carga los documentos asociados a un item del itinerario
   */
  private async loadItemDocuments(itemId: string): Promise<void> {
    try {
      const tripId = this.modalService.tripId();
      if (!tripId) return;

      const docs = await this.documentService.getDocumentsByItineraryItem(tripId, itemId);

      const docsWithUrl = docs.map((doc) => ({
        ...doc,
        publicUrl: this.documentService.getPublicUrl(doc.file_path),
      }));

      this.itemDocuments.set(docsWithUrl);
    } catch (error) {
      console.error('Error loading item documents:', error);
    }
  }

  private loadItemData(item: ItineraryItem): void {
    this.formData = {
      name: item.name,
      city: item.city || '',
      country: item.country || '',
      latitude: item.latitude,
      longitude: item.longitude,
      start_date: item.start_date,
      end_date: item.end_date,
      description: item.description || '',
      web: item.web || '',
    };

    this.tripCity.set(item.city || '');
    this.tripCountry.set(item.country || '');
    this.tripLatitude.set(item.latitude);
    this.tripLongitude.set(item.longitude);

    this.startDate.set(new Date(item.start_date));
    this.endDate.set(new Date(item.end_date));
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      city: '',
      country: '',
      latitude: null,
      longitude: null,
      start_date: '',
      end_date: '',
      description: '',
      web: '',
    };

    this.tripCity.set('');
    this.tripCountry.set('');
    this.tripLatitude.set(null);
    this.tripLongitude.set(null);

    this.startDate.set(null);
    this.endDate.set(null);
    this.locationSearch = '';
    this.itemDocuments.set([]);
    this.tempDocumentIds = [];
  }

  searchLocation(): void {
    const query = this.locationSearch.trim();
    if (!query) return;

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.searchSubscription = this.leafletService.searchLocation(query).subscribe({
      next: (results) => {
        if (results.length > 0) {
          const firstResult = results[0];
          this.tripLatitude.set(firstResult.coordinates.lat);
          this.tripLongitude.set(firstResult.coordinates.lng);
          this.extractCityAndCountry(firstResult);

          if (this.mapComponent) {
            this.mapComponent.centerMap(firstResult.coordinates, 12);
            this.mapComponent.addSimpleMarker(firstResult.coordinates);
          }

          this.locationSearch = '';
        } else {
          this.notificationService.error('No se encontraron resultados para esa ubicación');
        }
      },
      error: (error) => {
        console.error('Error buscando ubicación:', error);
        this.notificationService.error('Error al buscar la ubicación');
      },
    });
  }

  onMapLocationSelected(coordinates: MapCoordinates): void {
    this.tripLatitude.set(coordinates.lat);
    this.tripLongitude.set(coordinates.lng);

    this.leafletService.reverseGeocode(coordinates).subscribe({
      next: (result) => {
        if (result) {
          this.extractCityAndCountry(result);
        } else {
          this.tripCity.set(`Lat: ${coordinates.lat.toFixed(4)}`);
          this.tripCountry.set(`Lng: ${coordinates.lng.toFixed(4)}`);
        }
      },
      error: (error) => {
        console.error('Error en geocoding inverso:', error);
        this.tripCity.set(`Lat: ${coordinates.lat.toFixed(4)}`);
        this.tripCountry.set(`Lng: ${coordinates.lng.toFixed(4)}`);
      },
    });
  }

  private extractCityAndCountry(result: GeocodingResult): void {
    const raw = result.raw;

    if (raw && raw.address) {
      const addr = raw.address;
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        addr.state ||
        'Ubicación desconocida';
      const country = addr.country || 'País desconocido';

      this.tripCity.set(city);
      this.tripCountry.set(country);
    } else {
      const parts = result.displayName.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        this.tripCity.set(parts[0]);
        this.tripCountry.set(parts[parts.length - 1]);
      } else {
        this.tripCity.set(parts[0]);
        this.tripCountry.set(parts[0]);
      }
    }
  }

  private validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.notificationService.warning('Por favor, introduce un nombre para la parada');
      return false;
    }

    if (!this.formData.start_date) {
      this.notificationService.warning('Por favor, selecciona la fecha y hora de inicio');
      return false;
    }

    if (!this.formData.end_date) {
      this.notificationService.warning('Por favor, selecciona la fecha y hora de fin');
      return false;
    }

    if (new Date(this.formData.end_date) < new Date(this.formData.start_date)) {
      this.notificationService.warning(
        'La fecha/hora de fin debe ser igual o posterior a la de inicio'
      );
      return false;
    }

    return true;
  }

  async save(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving.set(true);

    try {
      if (this.modalService.mode() === 'create') {
        await this.createItem();
      } else if (this.modalService.mode() === 'edit') {
        await this.updateItem();
      }
    } catch (error) {
      console.error('Error guardando parada:', error);
      this.notificationService.error('Error al guardar la parada');
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Crea una nueva parada y actualiza los documentos temporales
   */
  private async createItem(): Promise<void> {
    const tripId = this.modalService.tripId();
    if (!tripId) throw new Error('No hay trip ID');

    const itemData: ItineraryItemInsert = {
      trip_id: tripId,
      name: this.formData.name.trim(),
      city: this.formData.city || null,
      country: this.formData.country || null,
      latitude: this.formData.latitude,
      longitude: this.formData.longitude,
      start_date: this.formData.start_date,
      end_date: this.formData.end_date,
      description: this.formData.description.trim() || null,
      web: this.formData.web.trim() || null,
    };

    const createdItem = await this.itineraryService.createItineraryItem(itemData);

    // ✅ Actualizar documentos temporales con el ID del item creado
    if (this.tempDocumentIds.length > 0) {
      await this.linkDocumentsToItem(createdItem.id);
    }

    this.notificationService.success('Parada creada correctamente');
    this.modalService.notifyItemCreated(createdItem);
    this.resetForm();
    this.modalService.close();
  }

  /**
   * Vincula los documentos temporales al item recién creado
   */
  private async linkDocumentsToItem(itemId: string): Promise<void> {
    try {
      // Usar el método del servicio para actualizar cada documento
      for (const docId of this.tempDocumentIds) {
        // Llamar directamente a Supabase para actualizar el itinerary_item_id
        const { error } = await this.documentService['supabaseService'].client
          .from('document')
          .update({ itinerary_item_id: itemId })
          .eq('id', docId);

        if (error) {
          console.error(`Error vinculando documento ${docId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error vinculando documentos al item:', error);
      // No lanzar error para que no falle toda la operación
    }
  }

  private async updateItem(): Promise<void> {
    const item = this.currentItem();
    if (!item) throw new Error('No hay parada para actualizar');

    const updatedItem = await this.itineraryService.updateItineraryItem(item.id, {
      name: this.formData.name.trim(),
      city: this.formData.city || null,
      country: this.formData.country || null,
      latitude: this.formData.latitude,
      longitude: this.formData.longitude,
      start_date: this.formData.start_date,
      end_date: this.formData.end_date,
      description: this.formData.description.trim() || null,
      web: this.formData.web.trim() || null,
    });

    this.notificationService.success('Parada actualizada correctamente');
    this.modalService.notifyItemUpdated(updatedItem);
    this.modalService.switchToView();
  }

  switchToEdit(): void {
    this.modalService.switchToEdit();
    if (this.currentItem()) {
      this.loadItemData(this.currentItem()!);
    }
  }

  cancelEdit(): void {
    this.modalService.switchToView();
  }

  async confirmDelete(): Promise<void> {
    const item = this.currentItem();
    if (!item) return;

    this.confirmModalService.open(
      'Eliminar parada',
      '¿Estás seguro de que quieres eliminar esta parada?',
      async () => {
        this.isDeleting.set(true);

        try {
          await this.itineraryService.deleteItineraryItem(item.id);
          this.notificationService.success('Parada eliminada correctamente');
          this.modalService.notifyItemDeleted(item.id);
          this.modalService.close();
        } catch (error) {
          console.error('Error eliminando parada:', error);
          this.notificationService.error('Error al eliminar la parada');
        } finally {
          this.isDeleting.set(false);
        }
      },
      'Eliminar'
    );
  }

  close(): void {
    this.resetForm();
    this.modalService.close();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  calculateDuration(startDate: string, endDate: string): number {
    return this.itineraryService.calculateDuration(startDate, endDate);
  }

  // ========== GESTIÓN DE DOCUMENTOS ==========

  async onDocFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      await this.uploadDocFiles(Array.from(files));
      input.value = '';
    }
  }

  onDocDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingDoc.set(true);
  }

  onDocDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingDoc.set(false);
  }

  async onDocDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingDoc.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.uploadDocFiles(Array.from(files));
    }
  }

  /**
   * Sube archivos asociados al item
   * En modo CREATE: sube sin itinerary_item_id (se vincula después)
   * En modo EDIT: sube con itinerary_item_id directamente
   */
  private async uploadDocFiles(files: File[]): Promise<void> {
    const tripId = this.modalService.tripId();
    if (!tripId) {
      this.notificationService.error('No se puede subir el documento en este momento');
      return;
    }

    this.isUploadingDoc.set(true);

    try {
      for (const file of files) {
        const uploadData = {
          tripId,
          file,
          // En modo EDIT: incluir itinerary_item_id
          // En modo CREATE: NO incluir (se vinculará después)
          ...(this.modalService.mode() === 'edit' && this.currentItem()
            ? { itineraryItemId: this.currentItem()!.id }
            : {}),
        };

        const uploadedDoc = await this.documentService.uploadDocument(uploadData);

        // En modo CREATE: guardar el ID para vincularlo después
        if (this.modalService.mode() === 'create') {
          this.tempDocumentIds.push(uploadedDoc.id);
        }
      }

      this.notificationService.success(
        files.length === 1
          ? 'Documento subido correctamente'
          : `${files.length} documentos subidos correctamente`
      );

      // Recargar documentos
      if (this.modalService.mode() === 'edit' && this.currentItem()) {
        await this.loadItemDocuments(this.currentItem()!.id);
      } else {
        // En modo CREATE: cargar todos los documentos temporales del viaje sin item asociado
        await this.loadTempDocuments(tripId);
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      this.notificationService.error(error.message || 'Error al subir los documentos');
    } finally {
      this.isUploadingDoc.set(false);
    }
  }

  /**
   * Carga documentos temporales (sin itinerary_item_id) del viaje
   * SOLO muestra los documentos que se han subido en esta sesión (tempDocumentIds)
   */
  private async loadTempDocuments(tripId: string): Promise<void> {
    try {
      // Si no hay documentos temporales en esta sesión, no mostrar nada
      if (this.tempDocumentIds.length === 0) {
        this.itemDocuments.set([]);
        return;
      }

      const allDocs = await this.documentService.getTripDocuments(tripId);

      // Filtrar SOLO los documentos que se subieron en esta sesión
      const tempDocs = allDocs.filter((doc) => this.tempDocumentIds.includes(doc.id));

      const docsWithUrl = tempDocs.map((doc) => ({
        ...doc,
        publicUrl: this.documentService.getPublicUrl(doc.file_path),
      }));

      this.itemDocuments.set(docsWithUrl);
    } catch (error) {
      console.error('Error loading temp documents:', error);
    }
  }

  viewItemDocument(doc: TripDocumentWithUrl): void {
    window.open(doc.publicUrl, '_blank');
  }

  downloadItemDocument(doc: TripDocumentWithUrl, event: Event): void {
    event.stopPropagation();

    const link = document.createElement('a');
    link.href = doc.publicUrl;
    link.download = doc.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success('Descargando documento...');
  }

  async deleteItemDocument(doc: TripDocumentWithUrl, event: Event): Promise<void> {
    event.stopPropagation();

    this.confirmModalService.open(
      'Eliminar documento',
      `¿Estás seguro de que quieres eliminar "${doc.name}"?`,
      async () => {
        try {
          await this.documentService.deleteDocument(doc.id);
          this.notificationService.success('Documento eliminado correctamente');

          // Remover de IDs temporales si existe
          this.tempDocumentIds = this.tempDocumentIds.filter((id) => id !== doc.id);

          // Recargar documentos
          if (this.modalService.mode() === 'edit' && this.currentItem()) {
            await this.loadItemDocuments(this.currentItem()!.id);
          } else {
            const tripId = this.modalService.tripId();
            if (tripId) {
              await this.loadTempDocuments(tripId);
            }
          }
        } catch (error: any) {
          console.error('Error deleting document:', error);
          this.notificationService.error(error.message || 'No se pudo eliminar el documento');
        }
      },
      'Eliminar'
    );
  }

  formatDocDate(dateString: string | null): string {
    if (!dateString) return 'fecha desconocida';

    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'hoy';
    if (diffInDays === 1) return 'ayer';
    if (diffInDays < 7) return `hace ${diffInDays} días`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  }
}
