// src/app/features/auth/pages/reset-password/reset-password.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/authentication';
import { NotificationService } from '@core/notifications/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen bg-white p-6 flex items-center justify-center relative overflow-hidden"
    >
      <!-- SVG de fondo -->
      <img
        src="/images/mapamundi.svg"
        alt="Mapa mundial"
        class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none transform scale-135"
        style="filter: invert(70%) sepia(1%) saturate(209%) hue-rotate(4deg) brightness(94%) contrast(85%);"
      />

      <!-- Contenido -->
      <div class="relative z-10 w-full max-w-md">
        <div
          class="bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-10"
        >
          <!-- Header -->
          <div class="text-center mb-8">
            <div
              class="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h1>
            <p class="text-gray-600">Introduce tu nueva contraseña</p>
          </div>

          <!-- Formulario -->
          <form (submit)="resetPassword($event)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Nueva contraseña </label>
              <input
                type="password"
                [(ngModel)]="newPassword"
                name="newPassword"
                placeholder="Mínimo 6 caracteres"
                [disabled]="isLoading()"
                class="w-full px-4 py-3 rounded-lg border bg-white border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
                required
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
                [disabled]="isLoading()"
                class="w-full px-4 py-3 rounded-lg border bg-white border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
                required
                minlength="6"
              />
            </div>

            <button
              type="submit"
              [disabled]="isLoading() || !newPassword || !confirmPassword"
              class="w-full px-6 py-3 bg-linear-to-r from-gray-900 to-gray-800 text-white rounded-lg text-sm font-semibold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              @if (isLoading()) {
              <div class="flex justify-center py-8">
                <div
                  class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 border-t-transparent"
                ></div>
              </div>
              <span>Actualizando...</span>
              } @else {
              <span>Cambiar contraseña</span>
              }
            </button>
          </form>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6">
          <p class="text-sm text-gray-600">
            ¿Ya te acuerdas de tu contraseña?
            <a href="/auth/login" class="text-gray-900 font-semibold hover:underline ml-1">
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export default class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  newPassword = '';
  confirmPassword = '';
  isLoading = signal(false);

  async ngOnInit() {
    // Verificar que hay un usuario autenticado (viene del magic link)
    const user = await this.authService.getAuthUser();
    if (!user) {
      this.notificationService.error('Enlace de recuperación inválido o expirado');
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  async resetPassword(event: Event) {
    event.preventDefault();

    if (this.newPassword !== this.confirmPassword) {
      this.notificationService.warning('Las contraseñas no coinciden');
      return;
    }

    if (this.newPassword.length < 6) {
      this.notificationService.warning('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);

    try {
      const response = await this.authService.updatePassword(this.newPassword);

      if (response.error) {
        this.notificationService.error(response.error);
      } else {
        this.notificationService.success('Contraseña actualizada correctamente');

        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
          this.router.navigate(['/overview']);
        }, 1000);
      }
    } catch (error: any) {
      this.notificationService.error(error.message || 'Error al cambiar la contraseña');
    } finally {
      this.isLoading.set(false);
    }
  }
}
