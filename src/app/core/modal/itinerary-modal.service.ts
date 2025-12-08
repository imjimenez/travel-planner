import { Injectable, signal, computed, EventEmitter } from '@angular/core';
import type { ItineraryItem, Trip } from '@core/trips';

/**
 * Modos del modal de itinerario
 */
export type ItineraryModalMode = 'create' | 'view' | 'edit';

/**
 * Servicio de gestión del modal de itinerario
 *
 * Controla el estado del modal de paradas del itinerario:
 * - create: Crear nueva parada
 * - view: Ver detalles de una parada existente
 * - edit: Editar una parada existente
 *
 * Patrón:
 * - Estado reactivo con signals
 * - Transiciones de modo (view → edit)
 * - EventEmitter para notificar cambios
 */
@Injectable({
  providedIn: 'root',
})
export class ItineraryModalService {
  // Estado del modal
  private isOpenSignal = signal<boolean>(false);
  private modeSignal = signal<ItineraryModalMode>('create');
  private tripIdSignal = signal<string | null>(null);
  private tripSignal = signal<Trip | null>(null); // Trip completo para centrar mapa
  private itemSignal = signal<ItineraryItem | null>(null);

  // Computed signals
  isOpen = computed(() => this.isOpenSignal());
  mode = computed(() => this.modeSignal());
  tripId = computed(() => this.tripIdSignal());
  trip = computed(() => this.tripSignal());
  item = computed(() => this.itemSignal());

  // Event emitters para notificar cambios
  itemCreated = new EventEmitter<ItineraryItem>();
  itemUpdated = new EventEmitter<ItineraryItem>();
  itemDeleted = new EventEmitter<string>(); // emite el ID de la parada eliminada

  /**
   * Abre el modal en modo creación
   *
   * @param trip - Trip completo (para centrar mapa en la ciudad del viaje)
   */
  openCreate(trip: Trip): void {
    this.tripIdSignal.set(trip.id);
    this.tripSignal.set(trip);
    this.itemSignal.set(null);
    this.modeSignal.set('create');
    this.isOpenSignal.set(true);
  }

  /**
   * Abre el modal en modo vista
   *
   * @param item - Parada a visualizar
   */
  openView(item: ItineraryItem): void {
    this.tripIdSignal.set(item.trip_id);
    this.tripSignal.set(null); // No necesitamos el trip en modo view
    this.itemSignal.set(item);
    this.modeSignal.set('view');
    this.isOpenSignal.set(true);
  }

  /**
   * Cambia del modo vista al modo edición
   *
   * Solo funciona si el modal está abierto en modo 'view'
   */
  switchToEdit(): void {
    if (this.mode() === 'view' && this.item()) {
      this.modeSignal.set('edit');
    }
  }

  /**
   * Vuelve del modo edición al modo vista
   *
   * Solo funciona si el modal está abierto en modo 'edit'
   */
  switchToView(): void {
    if (this.mode() === 'edit' && this.item()) {
      this.modeSignal.set('view');
    }
  }

  /**
   * Cierra el modal
   *
   * Resetea todo el estado
   */
  close(): void {
    this.isOpenSignal.set(false);
    this.modeSignal.set('create');
    this.tripIdSignal.set(null);
    this.tripSignal.set(null);
    this.itemSignal.set(null);
  }

  /**
   * Notifica que se ha creado una parada
   *
   * @param item - Parada creada
   */
  notifyItemCreated(item: ItineraryItem): void {
    this.itemCreated.emit(item);
  }

  /**
   * Notifica que se ha actualizado una parada
   *
   * @param item - Parada actualizada
   */
  notifyItemUpdated(item: ItineraryItem): void {
    this.itemUpdated.emit(item);
  }

  /**
   * Notifica que se ha eliminado una parada
   *
   * @param itemId - ID de la parada eliminada
   */
  notifyItemDeleted(itemId: string): void {
    this.itemDeleted.emit(itemId);
  }
}
