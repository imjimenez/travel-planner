// src/app/features/settings/pages/settings/settings.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/authentication';
import { TripInviteService } from '@core/trips';
import { NotificationService } from '@core/notifications/notification.service';
import { ConfirmModalService } from '@core/modal/confirm-modal.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full mx-auto max-w-6xl">
      <!-- Header con avatar centrado (sin fondo) -->
      <div class="flex flex-col items-center mb-12 pt-8">
        <!-- Avatar grande -->
        @if (getAvatarUrl()) {
        <div
          class="w-32 h-32 rounded-full overflow-hidden bg-gray-200 ring-4 ring-black/5 shadow-xl mb-6"
        >
          <img
            [src]="getAvatarUrl()!"
            [alt]="getDisplayName()"
            class="w-full h-full object-cover"
          />
        </div>
        } @else {
        <div
          class="w-32 h-32 rounded-full bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center text-4xl font-bold text-white ring-4 ring-black/5 shadow-xl mb-6"
        >
          {{ getInitials() }}
        </div>
        }

        <!-- Info usuario -->
        <h1 class="text-3xl font-semibold text-gray-900 mb-2">{{ getDisplayName() }}</h1>
        <p class="text-base text-gray-600 mb-3">{{ user()?.email }}</p>

        @if (authProvider()) {
        <span
          class="inline-flex items-center gap-2 px-4 py-1.5 bg-black/5 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          Conectado vía {{ authProvider() }}
        </span>
        }
      </div>

      <!-- Grid de dos columnas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Columna izquierda: Información de la cuenta -->
        <div class="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-6">Información de la cuenta</h2>

          <!-- Detalles de la cuenta -->
          <div class="space-y-4 mb-6">
            <div class="flex items-center justify-between py-3 border-b border-gray-100">
              <span class="text-sm text-gray-600">Cuenta creada</span>
              <span class="text-sm font-medium text-gray-900">{{
                formatDate(user()?.created_at)
              }}</span>
            </div>
            <div class="flex items-center justify-between py-3 border-b border-gray-100">
              <span class="text-sm text-gray-600">Última conexión</span>
              <span class="text-sm font-medium text-gray-900">{{
                formatDate(user()?.last_sign_in_at)
              }}</span>
            </div>
          </div>

          <!-- Cambiar contraseña (solo para usuarios con email/password) -->
          @if (canChangePassword()) {
          <div class="pt-6 border-t border-gray-200">
            <h3 class="text-base font-semibold text-gray-900 mb-4">Cambiar contraseña</h3>

            <form (submit)="changePassword($event)" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
                <input
                  type="password"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  placeholder="Mínimo 6 caracteres"
                  [disabled]="isChangingPassword()"
                  class="w-full px-4 py-2.5 rounded-xl border bg-white border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                  class="w-full px-4 py-2.5 rounded-xl border bg-white border-gray-200 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  minlength="6"
                />
              </div>

              <button
                type="submit"
                [disabled]="isChangingPassword() || !newPassword || !confirmPassword"
                class="w-full px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
        </div>

        <!-- Columna derecha: Invitaciones pendientes -->
        <div class="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">Invitaciones pendientes</h2>
            @if (pendingInvites().length > 0) {
            <span class="px-2.5 py-1 bg-gray-900 text-white rounded-full text-xs font-semibold">
              {{ pendingInvites().length }}
            </span>
            }
          </div>

          @if (pendingInvites().length > 0) {
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (invite of pendingInvites(); track invite.id) {
            <div
              class="group p-4 bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all"
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
                [disabled]="acceptingInviteToken() === invite.token"
                class="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                @if (acceptingInviteToken() === invite.token) {
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Aceptando...</span>
                } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
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

      <!-- Zona de peligro -->
      <div
        class="bg-linear-to-br from-red-50 to-red-100/50 backdrop-blur-sm rounded-2xl border-2 border-red-200 shadow-sm p-6"
      >
        <div class="flex items-start gap-4 mb-6">
          <div class="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-base font-semibold text-red-900 mb-1">Zona de peligro</h3>
            <p class="text-sm text-red-700">
              Estas acciones son permanentes y no se pueden deshacer.
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Cerrar sesión -->
          <button
            (click)="logout()"
            class="px-4 py-3 bg-white border-2 border-red-300 text-red-700 rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Cerrar sesión</span>
          </button>

          <!-- Eliminar cuenta -->
          <button
            (click)="deleteAccount()"
            class="px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Eliminar cuenta</span>
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
  private confirmModalService = inject(ConfirmModalService);

  user = signal<any>(null);
  pendingInvites = signal<any[]>([]);

  newPassword = '';
  confirmPassword = '';

  isChangingPassword = signal(false);
  acceptingInviteToken = signal<string | null>(null);

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
    this.acceptingInviteToken.set(token);

    try {
      const result = await this.inviteService.acceptInvite(token);
      this.notificationService.success('Te has unido al viaje correctamente');

      // Recargar invitaciones
      const invites = await this.inviteService.getMyInvites();
      this.pendingInvites.set(invites);

      // Emitir evento personalizado para que el sidebar se actualice
      window.dispatchEvent(new CustomEvent('inviteAccepted', { detail: invites.length }));

      // Redirigir al viaje
      setTimeout(() => {
        this.router.navigate(['/trips', result.tripId]);
      }, 1000);
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error al aceptar la invitación');
    } finally {
      this.acceptingInviteToken.set(null);
    }
  }

  async logout() {
    this.confirmModalService.open(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      async () => {
        await this.authService.signOut();
        sessionStorage.setItem('onboardingDismissed', 'false');
        this.router.navigate(['/']);
      },
      'Cerrar sesión'
    );
  }

  async deleteAccount() {
    this.confirmModalService.open(
      'Eliminar cuenta permanentemente',
      '¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción es irreversible, no se puede deshacer.',
      async () => {
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
      },
      'Eliminar'
    );
  }
}
