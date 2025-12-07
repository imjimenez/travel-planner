import { Injectable, signal, computed } from '@angular/core';

/**
 * Tipos de modales disponibles en la aplicación
 */
export type ModalType = 'participants' | 'documents' | 'checklist' | null;

/**
 * Servicio de gestión de modales
 *
 * Controla qué modal está abierto y mantiene el estado necesario
 * para cada modal (ej: tripId).
 *
 * Patrón:
 * - Un solo modal abierto a la vez
 * - Cada modal tiene acceso al tripId a través de este servicio
 * - Estado reactivo con signals
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetModalService {
  // Modal actualmente abierto
  private activeModal = signal<ModalType>(null);

  // ID del viaje para el modal actual
  private currentTripId = signal<string | null>(null);

  // Computed: ¿Hay algún modal abierto?
  isOpen = computed(() => this.activeModal() !== null);

  // Computed: Tipo de modal activo
  type = computed(() => this.activeModal());

  // Computed: Trip ID del modal actual
  tripId = computed(() => this.currentTripId());

  // Señal que emite el tipo de modal que se acaba de cerrar
  private lastClosedModal = signal<ModalType>(null);
  closedModal = computed(() => this.lastClosedModal());

  /**
   * Abre el modal de participantes
   *
   * @param tripId - ID del viaje
   */
  openParticipantsModal(tripId: string): void {
    this.currentTripId.set(tripId);
    this.activeModal.set('participants');
  }

  /**
   * Abre el modal de documentos
   *
   * @param tripId - ID del viaje
   */
  openDocumentsModal(tripId: string): void {
    this.currentTripId.set(tripId);
    this.activeModal.set('documents');
  }

  /**
   * Abre el modal de checklist
   *
   * @param tripId - ID del viaje
   */
  openChecklistModal(tripId: string): void {
    this.currentTripId.set(tripId);
    this.activeModal.set('checklist');
  }

  /**
   * Cierra el modal actual
   *
   * Resetea tanto el tipo de modal como el tripId
   */
  close(): void {
    const closed = this.activeModal(); // guardar cuál modal estaba abierto
    this.lastClosedModal.set(closed); // emitir evento de cierre

    this.activeModal.set(null);
    this.currentTripId.set(null);

    // limpiar después de notificar para evitar emisiones infinitas
    setTimeout(() => this.lastClosedModal.set(null), 0);
  }
}
