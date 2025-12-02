import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService, getFullName, getUserInitials, User } from '@core/authentication';
import { TripService } from '@core/trips/services/trip.service';
import { TripModalService } from '@core/trips/services/trip-modal.service.ts';

/**
 * Componente de barra lateral (sidebar) del dashboard
 *
 * Muestra la navegación principal y la información del usuario autenticado.
 * Este es un componente temporal/básico a mejorar
 *
 * Funcionalidades actuales:
 * - Navegación a Dashboard y Settings
 * - Información del usuario (avatar, nombre, email)
 * - Botón de cierre de sesión
 * - Indicador visual de ruta activa
 *
 * TODO:
 * - Añadir navegación a lista de viajes
 * - Mejorar diseño visual con Tailwind
 * - Añadir iconos SVG
 * - Implementar versión responsive (mobile menu)
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit {
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private tripModalService = inject(TripModalService);
  public router = inject(Router);

  /**
   * Usuario actual recibido desde el componente padre (DashboardLayout)
   * Se pasa como Input para evitar múltiples suscripciones al mismo Observable
   */
  @Input() user: User | null = null;

  trips = this.tripService.trips;
  private loadingSignal = signal(true);
  isLoading = this.loadingSignal.asReadonly();

  async ngOnInit() {
    this.loadingSignal.set(true);
    await this.tripService.loadUserTrips();
    console.log('Ejecutando..');
    this.loadingSignal.set(false);
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
}
