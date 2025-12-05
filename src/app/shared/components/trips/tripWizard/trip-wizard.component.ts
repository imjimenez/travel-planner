// src/core/trips/components/trip-wizard/trip-wizard.component.ts
import {
  Component,
  inject,
  OnDestroy,
  signal,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TripService } from '@core/trips/services/trip.service';
import { TripInviteService } from '@core/trips/services/trip-invite.service';
import { LeafletService } from '@shared/components/map/services/leaflet.service';
import { MapComponent } from '@shared/components/map/map.component';
import { MapCoordinates, GeocodingResult } from '@shared/components/map/models';
import { NotificationService } from '@core/notifications/notification.service';
import { Subscription } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { Trip } from '@core/trips';

/**
 * Datos del viaje durante el wizard con signals para reactividad
 */
interface WizardTripData {
  name: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  end_date: string;
  invites: string[];
}

type WizardStep = 0 | 1 | 2 | 3;

/**
 * Componente reutilizable para crear viajes
 *
 * Puede usarse en tres modos:
 * 1. Onboarding (isModal=false, showWelcome=true): Página completa con bienvenida
 * 2. Modal (isModal=true, showWelcome=false): Modal flotante sin bienvenida
 * 3. Página crear (isModal=false, showWelcome=false): Página sin bienvenida
 */
@Component({
  selector: 'app-trip-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent, DatePickerModule],
  templateUrl: './trip-wizard.component.html',
  styles: [
    `
      ::ng-deep .p-component {
        color-scheme: light; /* fuerza colores claros */
      }
    `,
  ],
})
export class TripWizardComponent implements OnInit, OnDestroy {
  // Configuración del componente
  @Input() showWelcome = true;
  @Input() redirectAfterCreate = '/trips';
  @Input() backgroundStyle: 'dark' | 'onboarding' = 'dark';
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() tripToEdit: Trip | null = null;

  @Output() closed = new EventEmitter<void>();

  private tripService = inject(TripService);
  private tripInviteService = inject(TripInviteService);
  private leafletService = inject(LeafletService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  @ViewChild('mapRef') mapComponent?: MapComponent;

  rangeDates: Date[] = [];

  currentStep = signal<WizardStep>(0);
  isLoading = signal(false);

  // Convertir tripData a signals para mejor reactividad
  tripName = signal('');
  tripCity = signal('');
  tripCountry = signal('');
  tripLatitude = signal<number | null>(null);
  tripLongitude = signal<number | null>(null);
  tripStartDate = signal('');
  tripEndDate = signal('');
  tripInvites = signal<string[]>([]);

  // Computed signal para verificar si hay ubicación seleccionada
  hasLocationSelected = computed(() => {
    return (
      this.tripLatitude() !== null &&
      this.tripLongitude() !== null &&
      this.tripCity() !== '' &&
      this.tripCountry() !== ''
    );
  });

  // Computed signal para las coordenadas actuales
  currentCoordinates = computed<MapCoordinates | null>(() => {
    const lat = this.tripLatitude();
    const lng = this.tripLongitude();
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
    return null;
  });

  locationSearch = '';
  searchResults: GeocodingResult[] = [];
  private searchSubscription?: Subscription;
  tempEmail = '';

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Mantener compatibilidad con el código existente mediante getters
  get tripData(): WizardTripData {
    return {
      name: this.tripName(),
      city: this.tripCity(),
      country: this.tripCountry(),
      latitude: this.tripLatitude(),
      longitude: this.tripLongitude(),
      start_date: this.tripStartDate(),
      end_date: this.tripEndDate(),
      invites: this.tripInvites(),
    };
  }

  constructor() {
    // Establecer paso inicial según configuración
    this.currentStep.set(this.showWelcome ? 0 : 1);
  }

  ngOnInit(): void {
    this.currentStep.set(this.showWelcome ? 0 : 1);

    // Cargar datos del viaje si estamos en modo edit
    if (this.mode === 'edit' && this.tripToEdit) {
      this.loadTripData(this.tripToEdit);
    }
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  // Método para cargar datos del viaje
  private loadTripData(trip: Trip): void {
    this.tripName.set(trip.name);
    this.tripCity.set(trip.city!);
    this.tripCountry.set(trip.country!);
    this.tripLatitude.set(trip.latitude);
    this.tripLongitude.set(trip.longitude);
    this.tripStartDate.set(trip.start_date);
    this.tripEndDate.set(trip.end_date);

    // Centrar el mapa en la ubicación del viaje
    if (this.mapComponent && trip.latitude && trip.longitude) {
      setTimeout(() => {
        this.mapComponent?.centerMap({ lat: trip.latitude!, lng: trip.longitude! }, 10);
        this.mapComponent?.addSimpleMarker({ lat: trip.latitude!, lng: trip.longitude! });
      }, 100);
    }
  }

  get minStep(): WizardStep {
    return this.showWelcome ? 0 : 1;
  }

  get maxStep(): WizardStep {
    return this.mode === 'edit' ? 2 : 3;
  }

  get startDate(): Date | null {
    return this.rangeDates[0] || null;
  }

  get endDate(): Date | null {
    return this.rangeDates[0] || null;
  }

  nextStep(): void {
    if (!this.validateCurrentStep()) {
      return;
    }

    const next = (this.currentStep() + 1) as WizardStep;
    if (next <= this.maxStep) {
      this.currentStep.set(next);
    }
  }

  previousStep(): void {
    const prev = (this.currentStep() - 1) as WizardStep;
    if (prev >= this.minStep) {
      this.currentStep.set(prev);
      if (prev === 1) {
        this.searchResults = [];
      }
    }
  }

  private validateCurrentStep(): boolean {
    const step = this.currentStep();

    switch (step) {
      case 0:
        return true;

      case 1:
        if (!this.tripName().trim()) {
          this.notificationService.error('Por favor, introduce un nombre para el viaje');
          return false;
        }
        if (!this.tripLatitude() || !this.tripLongitude()) {
          this.notificationService.error('Por favor, selecciona un destino en el mapa');
          return false;
        }
        if (!this.tripCity() || !this.tripCountry()) {
          this.notificationService.error(
            'Por favor, espera a que se complete la información del destino'
          );
          return false;
        }
        return true;

      case 2:
        if (!this.tripStartDate()) {
          this.notificationService.error('Por favor, selecciona la fecha de inicio');
          return false;
        }
        if (!this.tripEndDate()) {
          this.notificationService.error('Por favor, selecciona la fecha de fin');
          return false;
        }
        if (new Date(this.tripEndDate()) < new Date(this.tripStartDate())) {
          this.notificationService.error('La fecha de fin debe ser posterior a la fecha de inicio');
          return false;
        }
        return true;

      case 3:
        return true;

      default:
        return true;
    }
  }

  /**
   * Busca una ubicación y actualiza el mapa con marker
   */
  searchLocation(): void {
    const query = this.locationSearch.trim();

    if (!query) {
      this.searchResults = [];
      return;
    }

    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    this.searchSubscription = this.leafletService.searchLocation(query).subscribe({
      next: (results) => {
        if (results.length > 0) {
          const firstResult = results[0];

          // Actualizar coordenadas usando signals
          this.tripLatitude.set(firstResult.coordinates.lat);
          this.tripLongitude.set(firstResult.coordinates.lng);

          // Extraer ciudad y país
          this.extractCityAndCountry(firstResult);

          // Centrar el mapa en las nuevas coordenadas
          if (this.mapComponent) {
            this.mapComponent.centerMap(firstResult.coordinates, 10);

            // Añadir marker simple programáticamente en el mapa
            // Usar addSimpleMarker en lugar de addMarker
            this.mapComponent.addSimpleMarker(firstResult.coordinates);
          }

          this.locationSearch = '';
        } else {
          this.notificationService.error('No se encontraron resultados para esa ubicación');
        }

        this.searchResults = [];
      },
      error: (error) => {
        console.error('Error buscando ubicación:', error);
        this.notificationService.error(
          'Error al buscar la ubicación. Por favor, inténtalo de nuevo.'
        );
        this.searchResults = [];
      },
    });
  }

  /**
   * Maneja la selección de ubicación directamente en el mapa
   */
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
        this.notificationService.error('Error en geocoding inverso');
        this.tripCity.set(`Lat: ${coordinates.lat.toFixed(4)}`);
        this.tripCountry.set(`Lng: ${coordinates.lng.toFixed(4)}`);
      },
    });
  }

  /**
   * Extrae ciudad y país del resultado de geocoding
   */
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

  calculateDuration(): number {
    if (!this.tripStartDate() || !this.tripEndDate()) {
      return 0;
    }

    const start = new Date(this.tripStartDate());
    const end = new Date(this.tripEndDate());
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  addInvite(): void {
    const email = this.tempEmail.trim().toLowerCase();

    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.notificationService.error('Por favor, introduce un email válido');
      return;
    }

    if (this.tripInvites().includes(email)) {
      this.notificationService.error('Este email ya está en la lista');
      return;
    }

    this.tripInvites.update((invites) => [...invites, email]);
    this.tempEmail = '';
  }

  removeInvite(email: string): void {
    this.tripInvites.update((invites) => invites.filter((e) => e !== email));
  }

  async finishWizard(): Promise<void> {
    if (!this.validateCurrentStep()) {
      return;
    }

    this.isLoading.set(true);

    try {
      if (this.mode === 'edit' && this.tripToEdit) {
        await this.updateTrip();
      } else {
        await this.createTrip();
      }
    } catch (error) {
      console.error(`Error al ${this.mode === 'edit' ? 'actualizar' : 'crear'} el viaje:`, error);
      this.notificationService.error(
        `Error al ${this.mode === 'edit' ? 'actualizar' : 'crear'} el viaje.`
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // Método para actualizar viaje
  private async updateTrip(): Promise<void> {
    if (!this.tripToEdit) return;

    await this.tripService.updateTrip(this.tripToEdit.id, {
      name: this.tripName(),
      city: this.tripCity(),
      country: this.tripCountry(),
      latitude: this.tripLatitude()!,
      longitude: this.tripLongitude()!,
      start_date: this.tripStartDate(),
      end_date: this.tripEndDate(),
    });

    this.notificationService.success('Viaje actualizado correctamente');
    this.closed.emit();
    await this.router.navigate(['/trips', this.tripToEdit.id]);
    await this.tripService.loadUserTrips();
  }

  // Lógica de creación
  private async createTrip(): Promise<void> {
    const trip = await this.tripService.createTrip({
      name: this.tripName(),
      city: this.tripCity(),
      country: this.tripCountry(),
      latitude: this.tripLatitude()!,
      longitude: this.tripLongitude()!,
      start_date: this.tripStartDate(),
      end_date: this.tripEndDate(),
    });

    if (this.tripInvites().length > 0) {
      const invitePromises = this.tripInvites().map((email) =>
        this.tripInviteService
          .inviteUser({
            tripId: trip.id,
            email: email,
          })
          .catch((error) => {
            console.error(`Error invitando a ${email}:`, error);
            return null;
          })
      );

      await Promise.all(invitePromises);
    }

    this.notificationService.success('¡Viaje creado!');
    this.closed.emit();
    await this.router.navigate([this.redirectAfterCreate, trip.id]);
  }

  onBackdropClick(event: Event): void {
    // Solo cerrar si no es onboarding
    if (!this.showWelcome) {
      this.closeWizard();
    }
  }

  closeWizard(): void {
    // Siempre emitir el evento de cierre
    this.closed.emit();

    // Si es onboarding, también marcar como cerrado
    if (this.backgroundStyle === 'onboarding') {
      sessionStorage.setItem('onboardingDismissed', 'true');
      this.router.navigate(['/overview']);
    }
  }
}
