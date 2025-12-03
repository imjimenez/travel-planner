// src/core/trips/components/trip-detail/trip-detail.component.ts
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TripService } from '@core/trips/services/trip.service';
import { Trip } from '@core/trips/models/trip.model';
import { NotificationService } from '@core/notifications/notification.service';
import { Subscription } from 'rxjs';

// Componentes de la vista
import { ParticipantWidgetComponent } from '@features/trips/components/participants/participants.component';
import { DocumentWidgetComponent } from '@features/trips/components/documents/documents-widget.component';
import { ChecklistWidgetComponent } from '@features/trips/components/checklist/checklist-widget.component';
import { ItineraryEmptyStateComponent } from '@features/trips/components/itinerary/itinerary-emptystate.component';
import { ExpenseEmptyStateComponent } from '@features/trips/components/expenses/expenses-emptystate.component';

/**
 * Componente para mostrar el detalle de un viaje
 *
 * Se suscribe a los cambios de parámetros de la ruta para actualizar
 * el viaje cuando el usuario navega entre diferentes viajes
 */
@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    ParticipantWidgetComponent,
    DocumentWidgetComponent,
    ChecklistWidgetComponent,
    ItineraryEmptyStateComponent,
    ExpenseEmptyStateComponent,
  ],
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
    if (this.paramsSubscription) {
      this.paramsSubscription.unsubscribe();
    }
  }

  private async loadTrip(tripId: string): Promise<void> {
    this.trip.set(null);
    this.isLoading.set(true);

    try {
      if (!this.tripService.trips().length) {
        await this.tripService.loadUserTrips();
      }

      const tripFromMemory = this.tripService
        .trips()
        .find((t) => String(t.id).trim() === String(tripId).trim());

      if (tripFromMemory) {
        this.trip.set(tripFromMemory);
      } else {
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

  calculateDuration(): number {
    const currentTrip = this.trip();
    if (!currentTrip?.start_date || !currentTrip?.end_date) {
      return 0;
    }

    const start = new Date(currentTrip.start_date);
    const end = new Date(currentTrip.end_date);

    // Calcular diferencia en días
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Sumar 1 para incluir ambos días (inicio y fin)
    return diffDays + 1;
  }

  editTrip(): void {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    this.notificationService.info('Funcionalidad de edición próximamente');
    console.log('Editar viaje:', currentTrip);
  }

  async deleteTrip(): Promise<void> {
    const currentTrip = this.trip();
    if (!currentTrip) return;

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

  /**
   * Maneja el evento de añadir parada al itinerario
   */
  handleAddStop(): void {
    this.notificationService.info('Funcionalidad de itinerario próximamente');
    console.log('Añadir parada al itinerario');
  }

  /**
   * Maneja el evento de añadir gasto
   */
  handleAddExpense(): void {
    this.notificationService.info('Funcionalidad de gastos próximamente');
    console.log('Añadir gasto');
  }
}
