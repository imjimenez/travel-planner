// src/app/features/settings/pages/settings/settings.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/authentication';
import { TripInviteService } from '@core/trips';
import { NotificationService } from '@core/notifications/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full mx-auto">
      <h1 class="text-3xl font-medium text-gray-900 mb-8">Configuración de cuenta</h1>

      <!-- Grid de dos columnas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Columna izquierda: Información del perfil -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Información personal</h2>

          <div class="flex flex-col items-center gap-4 mb-6">
            <!-- Avatar grande centrado -->
            @if (getAvatarUrl()) {
            <div class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 ring-4 ring-gray-100">
              <img
                [src]="getAvatarUrl()!"
                [alt]="getDisplayName()"
                class="w-full h-full object-cover"
              />
            </div>
            } @else {
            <div
              class="w-24 h-24 rounded-full bg-linear-to-br from-gray-300 to-gray-400 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-gray-100"
            >
              {{ getInitials() }}
            </div>
            }

            <!-- Info usuario -->
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-900">{{ getDisplayName() }}</h3>
              <p class="text-sm text-gray-600">{{ user()?.email }}</p>
              @if (authProvider()) {
              <span
                class="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
              >
                Conectado vía {{ authProvider() }}
              </span>
              }
            </div>
          </div>

          <!-- Información adicional -->
          <div class="space-y-3 pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-600">Cuenta creada</span>
              <span class="text-sm font-medium text-gray-900">{{
                formatDate(user()?.created_at)
              }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-600">Última conexión</span>
              <span class="text-sm font-medium text-gray-900">{{
                formatDate(user()?.last_sign_in_at)
              }}</span>
            </div>
          </div>
        </div>

        <!-- Columna derecha: Invitaciones pendientes -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Invitaciones pendientes</h2>
            @if (pendingInvites().length > 0) {
            <span class="px-2.5 py-1 bg-green-100 text-gray-900 rounded-full text-xs font-semibold">
              {{ pendingInvites().length }}
            </span>
            }
          </div>

          @if (pendingInvites().length > 0) {
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (invite of pendingInvites(); track invite.id) {
            <div
              class="group p-4 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-all"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-gray-900 truncate">
                    {{ invite.trip?.name || 'Viaje sin nombre' }}
                  </p>
                  <p class="text-sm text-gray-600 truncate">
                    {{ invite.trip?.city }}, {{ invite.trip?.country }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    Invitado {{ formatDate(invite.created_at) }}
                  </p>
                </div>
              </div>

              <button
                (click)="acceptInvite(invite.token)"
                [disabled]="isAcceptingInvite()"
                class="w-full px-4 py-2.5 bg-gray-200 text-green-600 rounded-xl text-sm font-medium  transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                @if (isAcceptingInvite()) {
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Aceptando...</span>
                } @else {
                <i class="pi pi-check" style="color: green; font-size: 1.2rem"></i>

                <span>Aceptar invitación</span>
                }
              </button>
            </div>
            }
          </div>
          } @else {
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                class="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
            </div>
            <p class="text-sm text-gray-500">No tienes invitaciones pendientes</p>
          </div>
          }
        </div>
      </div>

      <!-- Cambiar contraseña (solo para usuarios con email/password) -->
      @if (canChangePassword()) {
      <div class="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">Cambiar contraseña</h3>

        <form (submit)="changePassword($event)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Nueva contraseña </label>
            <input
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              placeholder="Mínimo 6 caracteres"
              [disabled]="isChangingPassword()"
              class="w-full px-4 py-3 rounded-lg border bg-white border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              minlength="6"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              placeholder="Repite la contraseña"
              [disabled]="isChangingPassword()"
              class="w-full px-4 py-3 rounded-lg border bg-white border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              minlength="6"
            />
          </div>

          <button
            type="submit"
            [disabled]="isChangingPassword() || !newPassword || !confirmPassword"
            class="w-full px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            @if (isChangingPassword()) {
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Actualizando...</span>
            } @else {
            <span>Cambiar contraseña</span>
            }
          </button>
        </form>
      </div>
      }

      <!-- Zona de peligro -->
      <div class="bg-linear-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-red-900 mb-1">Zona de peligro</h3>
            <p class="text-sm text-red-700">
              Estas acciones son permanentes y no se pueden deshacer.
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Cerrar sesión -->
          <button
            (click)="logout()"
            class="w-full px-4 py-3 bg-white border-2 border-red-300 text-red-700 rounded-xl text-sm font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i class="pi pi-sign-out" style="color: red-300; font-size: 1.2rem"></i>
            <span>Cerrar sesión</span>
          </button>

          <!-- Eliminar cuenta -->
          <button
            (click)="deleteAccount()"
            class="w-full px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i class="pi pi-trash" style="color: white; font-size: 1.2rem"></i>
            <span>Eliminar cuenta permanentemente</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export default class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private inviteService = inject(TripInviteService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  user = signal<any>(null);
  pendingInvites = signal<any[]>([]);

  newPassword = '';
  confirmPassword = '';

  isChangingPassword = signal(false);
  isAcceptingInvite = signal(false);

  async ngOnInit() {
    // Cargar usuario
    const authUser = await this.authService.getAuthUser();
    this.user.set(authUser);

    // Cargar invitaciones pendientes
    try {
      const invites = await this.inviteService.getMyInvites();
      this.pendingInvites.set(invites);
      console.log(invites);
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  }

  getDisplayName(): string {
    const metadata = this.user()?.user_metadata;
    return metadata?.['full_name'] || metadata?.['name'] || 'Usuario';
  }

  getInitials(): string {
    const name = this.getDisplayName();
    return name.charAt(0).toUpperCase();
  }

  getAvatarUrl(): string | null {
    const metadata = this.user()?.user_metadata;
    return metadata?.['avatar_url'] || metadata?.['picture'] || null;
  }

  authProvider(): string | null {
    const provider = this.user()?.app_metadata?.provider;
    if (provider === 'email') return null;
    if (provider === 'google') return 'Google';
    if (provider === 'github') return 'GitHub';
    if (provider === 'apple') return 'Apple';
    return null;
  }

  canChangePassword(): boolean {
    return this.user()?.app_metadata?.provider === 'email';
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Desconocido';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async changePassword(event: Event) {
    event.preventDefault();

    if (this.newPassword !== this.confirmPassword) {
      this.notificationService.warning('Las contraseñas no coinciden');
      return;
    }

    if (this.newPassword.length < 6) {
      this.notificationService.warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isChangingPassword.set(true);

    try {
      const response = await this.authService.updatePassword(this.newPassword);

      if (response.error) {
        this.notificationService.error(response.error);
      } else {
        this.notificationService.success('Contraseña actualizada correctamente');
        this.newPassword = '';
        this.confirmPassword = '';
      }
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  async acceptInvite(token: string) {
    this.isAcceptingInvite.set(true);

    try {
      const result = await this.inviteService.acceptInvite(token);
      this.notificationService.success('Te has unido al viaje correctamente');

      // Recargar invitaciones
      const invites = await this.inviteService.getMyInvites();
      this.pendingInvites.set(invites);

      // Redirigir al viaje
      setTimeout(() => {
        this.router.navigate(['/trips', result.tripId]);
      }, 1000);
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error al aceptar la invitación');
    } finally {
      this.isAcceptingInvite.set(false);
    }
  }

  async logout() {
    if (!confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      return;
    }

    await this.authService.signOut();
    sessionStorage.setItem('onboardingDismissed', 'false');
    this.router.navigate(['/']);
  }

  async deleteAccount() {
    const firstConfirm = confirm(
      '¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción es PERMANENTE y eliminará:\n• Tu cuenta\n• Todos tus viajes\n• Toda tu información\n\nNo se puede deshacer.'
    );

    if (!firstConfirm) return;

    const secondConfirm = confirm(
      'ÚLTIMA ADVERTENCIA\n\n¿Confirmas que quieres eliminar permanentemente tu cuenta?\n\nEscribe "ELIMINAR" en el siguiente paso para continuar.'
    );

    if (!secondConfirm) return;

    const typed = prompt('Por favor, escribe "ELIMINAR" para confirmar:');

    if (typed !== 'ELIMINAR') {
      this.notificationService.error('Cancelado. La cuenta no fue eliminada.');
      return;
    }

    try {
      const response = await this.authService.deleteAccount();

      if (response.error) {
        this.notificationService.error(response.error);
      } else {
        this.notificationService.success('Cuenta eliminada correctamente');
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error al eliminar la cuenta');
    }
  }
}
