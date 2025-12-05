import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { AuthService, User } from '../../core/authentication';
import { Observable } from 'rxjs';
import { TripWizardComponent } from '@shared/components/trips/tripWizard/trip-wizard.component';
import { TripModalService } from '@core/trips/services/trip-modal.service.ts';
import { ModalService } from '@core/modal/modal.service';
import { ParticipantsModalComponent } from '@features/trips/components/participants/participants-modal-component';
import { ModalWrapperComponent } from '@shared/components/modal-wrapper/modal-wrapper.component';
import { DocumentsModalComponent } from '@features/trips/components/documents/documents-modal-component';
import { ChecklistModalComponent } from '@features/trips/components/checklist/checklist-modal-component';

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
 */
@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TripWizardComponent,
    ModalWrapperComponent,
    ParticipantsModalComponent,
    DocumentsModalComponent,
    ChecklistModalComponent,
  ],
  template: `
    <div class="min-h-screen bg-white p-6 flex gap-6 relative overflow-hidden">
      <!-- SVG como imagen con filtro verde -->
      <img
        src="/images/mapamundi.svg"
        alt="Mapa mundial"
        class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none transform scale-135"
        style="
      filter: invert(28%) sepia(13%) saturate(2899%) hue-rotate(83deg) brightness(92%) contrast(85%);
    "
      />

      <!-- Contenido -->
      <div class="relative z-10 w-full flex gap-6">
        <app-sidebar [user]="currentUser$ | async"></app-sidebar>

        <main class="flex-1">
          <div
            class="bg-white/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-3rem)] p-6 overflow-auto"
          >
            <router-outlet />
          </div>
        </main>
      </div>

      @if (showCreateTripModal()) {
      <app-trip-wizard
        [showWelcome]="false"
        [backgroundStyle]="'dark'"
        [redirectAfterCreate]="'/trips'"
        [mode]="'create'"
        (closed)="closeCreateTripModal()"
      >
      </app-trip-wizard>
      } @if (showEditTripModal()) {
      <app-trip-wizard
        [showWelcome]="false"
        [backgroundStyle]="'dark'"
        [redirectAfterCreate]="'/trips'"
        [mode]="'edit'"
        [tripToEdit]="tripToEdit()"
        (closed)="closeEditTripModal()"
      >
      </app-trip-wizard>
      }

      <!-- MODALES NUEVOS -->
      @if (modalService.activeModal() === 'participants') {
      <app-modal-wrapper title="Participantes">
        <app-participants-modal />
      </app-modal-wrapper>
      } @if (modalService.activeModal() === 'documents') {
      <app-modal-wrapper title="Documentos">
        <app-documents-modal />
      </app-modal-wrapper>
      } @if (modalService.activeModal() === 'checklist') {
      <app-modal-wrapper title="Checklist">
        <app-checklist-modal />
      </app-modal-wrapper>
      }
    </div>
  `,
})
export default class DashboardLayoutComponent implements OnInit {
  private tripModalService = inject(TripModalService);
  modalService = inject(ModalService);
  /**
   * Observable del usuario actual
   * Se pasa al sidebar para mostrar información del usuario
   */
  currentUser$: Observable<User | null>;
  showCreateTripModal = this.tripModalService.createTripModal;
  showEditTripModal = this.tripModalService.editTripModal;
  tripToEdit = this.tripModalService.tripToEdit;

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

  closeEditTripModal() {
    this.tripModalService.closeEditTripModal();
  }
}
