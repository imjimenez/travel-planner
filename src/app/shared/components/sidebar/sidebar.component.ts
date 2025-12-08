import { Component, inject, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService, getFullName, getUserInitials, User } from '@core/authentication';
import { TripService } from '@core/trips/services/trip.service';
import { TripModalService } from '@core/trips/services/trip-modal.service.ts';
import { TripInviteService } from '@core/trips';

/**
 * Componente de barra lateral (sidebar) del dashboard
 *
 * Muestra la navegación principal y la información del usuario autenticado.
 *
 * Funcionalidades actuales:
 * - Navegación a Dashboard , lista de viajes y Settings
 * - Lista de viajes del usuario
 * - Navegación a los ajustes del usuario
 * - Badge con número de invitaciones pendientes
 *
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Side bar -->
    <aside class="w-80 hidden md:block">
      <div
        class="sticky top-6 bg-white/50 backdrop-blur-xl rounded-2xl shadow-sm h-[calc(100vh-3rem)] border border-gray-200 overflow-hidden"
      >
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="mb-8 p-6">
            <h2 class="text-3xl font-semibold text-gray-900">TravelApp</h2>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 overflow-y-auto -mx-3 px-6">
            <!-- Dashboard/Overview -->
            <a
              routerLink="/overview"
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="{ exact: true }"
              class="relative flex items-center gap-3 px-3 py-2 mx-3 rounded-lg text-gray-800 text-sm transition-all hover:bg-white hover:shadow-sm overflow-clip"
              [class.bg-white]="isActiveRoute('/overview')"
              [class.shadow-sm]="isActiveRoute('/overview')"
              [class.text-black]="isActiveRoute('/overview')"
            >
              <!-- Indicador vertical -->
              <div
                class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full transition-all"
                [class.bg-gray-900]="isActiveRoute('/overview')"
              ></div>
              <i class="pi pi-th-large" style="font-size: 1rem"></i>
              <span class="text-base text-black">Dashboard</span>
            </a>

            <!-- Divider -->
            <div class="h-px bg-gray-400 my-4 mx-3"></div>

            <!-- Loading trips -->
            @if (isLoading()) {
            <div class="px-3 py-2 text-center mx-3">
              <span class="text-xs text-gray-400">Cargando viajes...</span>
            </div>
            }

            <!-- Trips list -->
            @if (!isLoading() && trips().length > 0) {
            <div class="flex flex-col gap-2">
              @for (trip of trips(); track trip.id) {
              <a
                [routerLink]="['/trips', trip.id]"
                routerLinkActive="active-trip"
                class="relative flex flex-col gap-1 px-3 py-2 mx-3 rounded-lg transition-all cursor-pointer hover:bg-white hover:shadow-sm group"
                [class.bg-white]="isTripActive(trip.id)"
                [class.shadow-sm]="isTripActive(trip.id)"
              >
                <div
                  class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full transition-all"
                  [class.bg-gray-900]="isTripActive(trip.id)"
                  [class.bg-transparent]="!isTripActive(trip.id)"
                ></div>
                <div class="flex gap-3 justify-start items-center">
                  <i class="pi pi-map-marker" style="color: black; font-size: 1.2rem"></i>
                  <div class="flex flex-col">
                    <span class="text-base font-medium text-gray-900 truncate">
                      {{ trip.name }}
                    </span>
                    <span class="text-xs text-gray-500 truncate">
                      {{ trip.city }}, {{ trip.country }}
                    </span>
                  </div>
                </div>
              </a>
              }
            </div>
            }

            <!-- Empty state -->
            @if (!isLoading() && trips().length === 0) {
            <div class="px-3 py-4 text-center mx-3">
              <p class="text-sm text-gray-500 mb-2">No tienes viajes aún</p>
            </div>
            }
          </nav>

          <!-- Footer -->
          <div class="shrink-0 p-3">
            <button
              (click)="openModal()"
              class="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Crear viaje
            </button>
            <!-- Divider -->
            <div class="h-px bg-gray-400 my-4 mx-3"></div>
            <!-- User info-->
            @if (user) {
            <button
              (click)="goToSettings()"
              class="w-full flex items-center gap-3 p-3 hover:shadow-sm transition-all rounded-lg hover:bg-gray-100 text-left cursor-pointer"
            >
              <!-- Avatar -->
              @if (user.avatarURL) {
              <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                <img
                  [src]="user.avatarURL"
                  [alt]="getDisplayName(user)"
                  class="w-full h-full object-cover"
                />
              </div>
              } @else {
              <div
                class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0"
              >
                {{ getInitial(user) }}
              </div>
              }

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ getDisplayName(user) || 'Usuario' }}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {{ user.email }}
                </p>
              </div>

              <!-- Badge de invitaciones pendientes -->
              @if (pendingInvitesCount() > 0) {
              <div
                class="shrink-0 flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-semibold"
              >
                {{ pendingInvitesCount() }}
              </div>
              }
            </button>
            }
          </div>
        </div>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit, OnDestroy {
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private tripModalService = inject(TripModalService);
  private inviteService = inject(TripInviteService);
  public router = inject(Router);

  /**
   * Usuario actual recibido desde el componente padre (DashboardLayout)
   * Se pasa como Input para evitar múltiples suscripciones al mismo Observable
   */
  @Input() user: User | null = null;

  trips = this.tripService.trips;
  private loadingSignal = signal(true);
  isLoading = this.loadingSignal.asReadonly();

  /**
   * Número de invitaciones pendientes del usuario
   */
  pendingInvitesCount = signal(0);

  async ngOnInit() {
    this.loadingSignal.set(true);
    await this.tripService.loadUserTrips();
    console.log('Ejecutando..');
    this.loadingSignal.set(false);

    // Cargar invitaciones pendientes
    await this.loadPendingInvites();

    // Escuchar evento de invitación aceptada
    window.addEventListener('inviteAccepted', this.handleInviteAccepted.bind(this));
  }

  /**
   * Carga el número de invitaciones pendientes del usuario
   */
  private async loadPendingInvites() {
    try {
      const invites = await this.inviteService.getMyInvites();
      this.pendingInvitesCount.set(invites.length);
    } catch (error) {
      console.error('Error loading pending invites:', error);
      this.pendingInvitesCount.set(0);
    }
  }

  /**
   * Maneja el evento de invitación aceptada
   */
  private handleInviteAccepted(event: Event) {
    const customEvent = event as CustomEvent;
    this.pendingInvitesCount.set(customEvent.detail);
  }

  /**
   * Limpia el listener del evento al destruir el componente
   */
  ngOnDestroy() {
    window.removeEventListener('inviteAccepted', this.handleInviteAccepted.bind(this));
  }

  /**
   * Cierra la sesión del usuario actual
   *
   * Llama al servicio de autenticación y redirige a la landing page.
   * El loading state se maneja automáticamente en el servicio.
   */
  async onLogout() {
    await this.authService.signOut();
    sessionStorage.setItem('onboardingDismissed', 'false');
    this.router.navigate(['/']);
  }

  /**
   * Obtiene la inicial del usuario para mostrar en el avatar
   *
   * Usa la primera letra del email como fallback si no hay nombre.
   * Si no hay usuario, retorna 'U' por defecto.
   *
   * @param user - Usuario actual o null
   * @returns Primera letra en mayúscula del email o 'U'
   */
  getInitial(user: User | null): string {
    if (!user || !user.email) return 'U';
    return getUserInitials(user);
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  getDisplayName(user: User | null): string {
    if (!user) return 'Usuario';
    return getFullName(user);
  }

  /**
   * Verifica si una ruta específica está activa
   *
   * Usado para aplicar estilos de "activo" a los links del sidebar.
   * Compara la URL actual del router con la ruta proporcionada.
   *
   * @param route - Ruta a verificar (ej: '/dashboard/settings')
   * @returns true si la ruta está activa
   */
  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  /**
   * Verifica si un viaje especifico está activo
   *
   * @param tripId - ID del viaje a verificar
   * @returns true si el viaje está activo
   */
  isTripActive(tripId: string): boolean {
    return this.router.url.includes(`/trips/${tripId}`);
  }

  openModal() {
    this.tripModalService.openCreateTripModal();
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
}
