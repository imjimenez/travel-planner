// src/app/core/ui/modal.service.ts
import { Injectable, signal } from '@angular/core';

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
  createTripModal = this.createTripModalSignal.asReadonly();

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
}
