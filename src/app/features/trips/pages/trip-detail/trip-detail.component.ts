// src/core/trips/components/trip-detail/trip-detail.component.ts
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TripService } from '@core/trips/services/trip.service';
import { TripParticipantService } from '@core/trips/services/trip-participant.service';
import { Trip } from '@core/trips/models/trip.model';
import { NotificationService } from '@core/notifications/notification.service';
import { AuthService } from '@core/authentication/services/auth.service';
import { Subscription } from 'rxjs';

// Componentes de la vista
import { ParticipantWidgetComponent } from '@features/trips/components/participants/participants-widget.component';
import { DocumentWidgetComponent } from '@features/trips/components/documents/documents-widget.component';
import { ChecklistWidgetComponent } from '@features/trips/components/checklist/checklist-widget.component';
import { ItineraryEmptyStateComponent } from '@features/trips/components/itinerary/itinerary-emptystate.component';
import { TripModalService } from '@core/trips/services/trip-modal.service.ts';
import { ExpensesComponent } from '@features/trips/components/expenses/expenses.component';
import { ConfirmModalService } from '@core/modal/confirm-modal.service';

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
    ParticipantWidgetComponent,
    ExpensesComponent,
  ],
  templateUrl: './trip-detail.component.html',
})
export class TripDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);
  private participantService = inject(TripParticipantService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private tripModalService = inject(TripModalService);
  private confirmModalService = inject(ConfirmModalService);
  private updateSubscription?: Subscription;

  // Signals
  trip = signal<Trip | null>(null);
  isLoading = signal(true);
  activeTab = signal<'itinerary' | 'expenses'>('itinerary');
  isOwner = signal(false);

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

    // Cuando el wizard emite "viaje actualizado"
    this.updateSubscription = this.tripModalService.tripUpdated.subscribe(async (tripId) => {
      if (String(tripId) === String(this.trip()?.id)) {
        await this.loadTrip(tripId);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.paramsSubscription) {
      this.paramsSubscription.unsubscribe();
    }
    if (this.updateSubscription) {
      this.updateSubscription?.unsubscribe();
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

      // Verificar si el usuario actual es owner
      const user = await this.authService.getAuthUser();
      const currentTrip = this.trip();
      if (user && currentTrip) {
        this.isOwner.set(user.id === currentTrip.owner_user_id);
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

    this.tripModalService.openEditTripModal(currentTrip);
  }

  async deleteTrip(): Promise<void> {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    this.confirmModalService.open(
      'Eliminar viaje',
      `¿Estás seguro de que deseas eliminar el viaje "${currentTrip.name}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await this.tripService.deleteTrip(currentTrip.id);
          this.notificationService.success('Viaje eliminado correctamente');
          this.router.navigate(['/overview']);
        } catch (error) {
          console.error('Error al eliminar el viaje:', error);
          this.notificationService.error('Error al eliminar el viaje');
        }
      },
      'Eliminar'
    );
  }

  /**
   * Permite al participante salir del viaje
   * Usa el servicio de participantes para remover al usuario actual
   */
  async leaveTrip(): Promise<void> {
    const currentTrip = this.trip();
    if (!currentTrip) return;

    const user = await this.authService.getAuthUser();
    if (!user) {
      this.notificationService.error('Usuario no autenticado');
      return;
    }

    this.confirmModalService.open(
      'Salir del viaje',
      `¿Estás seguro de que deseas salir del viaje "${currentTrip.name}"?`,
      async () => {
        try {
          await this.participantService.removeParticipant(currentTrip.id, user.id);
          this.notificationService.success('Has salido del viaje correctamente');
          this.tripService.loadUserTrips();
          this.router.navigate(['/overview']);
        } catch (error: any) {
          console.error('Error al salir del viaje:', error);
          this.notificationService.error(error.message || 'Error al salir del viaje');
        }
      },
      'Salir'
    );
  }

  /**
   * Maneja el evento de añadir parada al itinerario
   */
  handleAddStop(): void {
    this.notificationService.info('Funcionalidad de itinerario próximamente');
    console.log('Añadir parada al itinerario');
  }
}
