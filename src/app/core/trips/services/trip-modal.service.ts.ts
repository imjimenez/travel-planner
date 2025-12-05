// src/app/core/ui/modal.service.ts
import { Injectable, signal } from '@angular/core';
import { Trip } from '../models';

/**
 * Servicio para gestionar modales globales de la aplicación
 *
 * Permite abrir/cerrar modales desde cualquier componente
 * del dashboard sin necesidad de prop drilling o inyección de padres
 */
@Injectable({
  providedIn: 'root',
})
export class TripModalService {
  // Signal para controlar el modal de crear viaje
  private createTripModalSignal = signal(false);
  private editTripModalSignal = signal(false);
  private tripToEditSignal = signal<Trip | null>(null);

  createTripModal = this.createTripModalSignal.asReadonly();
  editTripModal = this.editTripModalSignal.asReadonly();
  tripToEdit = this.tripToEditSignal.asReadonly();

  /**
   * Abre el modal de crear viaje
   */
  openCreateTripModal(): void {
    this.createTripModalSignal.set(true);
  }

  /**
   * Cierra el modal de crear viaje
   */
  closeCreateTripModal(): void {
    this.createTripModalSignal.set(false);
  }

  /**
   * Abre el modal de editar viaje
   */
  openEditTripModal(trip: Trip) {
    this.tripToEditSignal.set(trip);
    this.editTripModalSignal.set(true);
  }

  /**
   * Cierra el modal de editar viaje
   */
  closeEditTripModal() {
    this.editTripModalSignal.set(false);
    this.tripToEditSignal.set(null);
  }
}
