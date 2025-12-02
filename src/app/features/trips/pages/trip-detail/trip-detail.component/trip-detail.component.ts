// src/core/trips/components/trip-detail/trip-detail.component.ts
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TripService } from '@core/trips/services/trip.service';
import { Trip } from '@core/trips/models/trip.model';
import { NotificationService } from '@core/notifications/notification.service';
import { Subscription } from 'rxjs';

/**
 * Componente para mostrar el detalle de un viaje
 *
 * Se suscribe a los cambios de parámetros de la ruta para actualizar
 * el viaje cuando el usuario navega entre diferentes viajes
 */
@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-detail.component.html',
})
export class TripDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);
  private notificationService = inject(NotificationService);

  // Signals
  trip = signal<Trip | null>(null);
  isLoading = signal(true);
  activeTab = signal<'itinerary' | 'expenses'>('itinerary');

  // Suscripción a cambios de parámetros de la URL
  private paramsSubscription?: Subscription;

  ngOnInit(): void {
    // Escuchar cambios en los parámetros de la ruta
    // Esto se ejecutará cada vez que cambie el ID en la URL
    this.paramsSubscription = this.route.params.subscribe(async (params) => {
      const tripId = params['id'];

      if (!tripId) {
        console.error('No se encontró el ID del viaje');
        this.notificationService.error('ID de viaje no válido');
        this.router.navigate(['/overview']);
        return;
      }

      await this.loadTrip(tripId);
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripción para evitar memory leaks
    if (this.paramsSubscription) {
      this.paramsSubscription.unsubscribe();
    }
  }

  /**
   * Carga un viaje por su ID
   * Primero intenta encontrarlo en la lista cargada en memoria,
   * si no lo encuentra, hace una petición directa a la API
   */
  private async loadTrip(tripId: string): Promise<void> {
    // Resetear estado
    this.trip.set(null);
    this.isLoading.set(true);

    try {
      // Esperar a que los trips estén cargados si es necesario
      if (!this.tripService.trips().length) {
        await this.tripService.loadUserTrips();
      }

      // Buscar el trip en memoria (más rápido)
      const tripFromMemory = this.tripService
        .trips()
        .find((t) => String(t.id).trim() === String(tripId).trim());

      if (tripFromMemory) {
        this.trip.set(tripFromMemory);
      } else {
        // Si no lo encuentra en memoria, pedirlo directamente a la API
        const fetchedTrip = await this.tripService.getTripById(tripId);
        this.trip.set(fetchedTrip);
      }
    } catch (error) {
      console.error('Error al cargar el viaje:', error);
      this.notificationService.error('Error al cargar el viaje');
      this.router.navigate(['/overview']);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Calcula la duración del viaje en días
   */
  calculateDuration(): number {
    const currentTrip = this.trip();
    if (!currentTrip?.start_date || !currentTrip?.end_date) {
      return 0;
    }

    const start = new Date(currentTrip.start_date);
    const end = new Date(currentTrip.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Abre el modal o página de edición del viaje
   */
  editTrip(): void {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    // TODO: Implementar modal/página de edición
    this.notificationService.info('Funcionalidad de edición próximamente');
    console.log('Editar viaje:', currentTrip);
  }

  /**
   * Elimina el viaje actual con confirmación
   */
  async deleteTrip(): Promise<void> {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    // Confirmación del usuario
    const confirmed = confirm(
      `¿Estás seguro de que deseas eliminar el viaje "${currentTrip.name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await this.tripService.deleteTrip(currentTrip.id);
      this.notificationService.success('Viaje eliminado correctamente');
      this.router.navigate(['/overview']);
    } catch (error) {
      console.error('Error al eliminar el viaje:', error);
      this.notificationService.error('Error al eliminar el viaje');
    }
  }
}
