import { CommonModule } from '@angular/common';
import { Component, inject, input, type OnDestroy, type OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, getFullName, getUserInitials, type User } from '@core/authentication';
import { type Trip, TripInviteService } from '@core/trips';

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
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnDestroy {
  readonly #authService = inject(AuthService);
  readonly #router = inject(Router);

	trips = input.required<Trip[]>();
  isLoadingTrips = input(false);

	user = input.required<User | null>();

	private inviteService = inject(TripInviteService);


  private loadingSignal = signal(false);
  isLoading = this.loadingSignal.asReadonly();

  /**
   * Número de invitaciones pendientes del usuario
   */
  pendingInvitesCount = signal(0);

  async ngOnInit() {
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
		await this.#authService.signOut();
		sessionStorage.setItem("onboardingDone", "false");
		this.#router.navigate(["/"]);
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
		return this.#router.url === route;
	}

	/**
	 * Verifica si un viaje especifico está activo
	 *
	 * @param tripId - ID del viaje a verificar
	 * @returns true si el viaje está activo
	 */
	isTripActive(tripId: string): boolean {
		return this.#router.url.includes(`/trips/${tripId}`);
	}
}
