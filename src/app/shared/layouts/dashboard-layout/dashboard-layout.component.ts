import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService, User } from '../../../core/authentication';
import { Observable } from 'rxjs';
import { TripWizardComponent } from '@shared/components/trips/tripWizard/trip-wizard.component';
import { TripModalService } from '@core/trips/services/trip-modal.service.ts';

/**
 * Layout principal del dashboard
 *
 * Componente contenedor que proporciona la estructura base para todas
 * las páginas del dashboard (overview, trips, settings, etc.).
 *
 * Estructura:
 * - Sidebar fijo con navegación e información del usuario
 * - Área de contenido dinámico que renderiza las rutas hijas vía <router-outlet>
 *
 * Este layout solo se muestra para usuarios autenticados gracias al authGuard
 * configurado en las rutas principales (app.routes.ts).
 *
 * TODO :
 * - Añadir header superior, busquedas (si se implementa), botón para colapsar, etc.
 * - Implementar diseño responsive (hamburger menu en mobile)
 * - Mejorar estilos con Tailwind CSS
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TripWizardComponent],
  templateUrl: './dashboard-layout.component.html',
})
export default class DashboardLayoutComponent implements OnInit {
  private tripModalService = inject(TripModalService);
  /**
   * Observable del usuario actual
   * Se pasa al sidebar para mostrar información del usuario
   */
  currentUser$: Observable<User | null>;
  showCreateTripModal = this.tripModalService.createTripModal;

  constructor(private authService: AuthService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  /**
   * Inicialización del componente
   *
   * Verifica que haya un usuario autenticado (medida de seguridad adicional).
   * En teoría nunca debería ser null porque el authGuard protege estas rutas,
   * pero se mantiene como verificación de desarrollo.
   */
  ngOnInit() {
    this.currentUser$.subscribe((user) => {
      if (!user) {
        console.warn('No authenticated user in dashboard');
      }
    });
  }

  // Método para abrir el modal (se llamará desde el sidebar)
  openCreateTripModal() {
    this.tripModalService.openCreateTripModal();
  }

  closeCreateTripModal() {
    this.tripModalService.closeCreateTripModal();
  }
}
