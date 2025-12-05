// src/app/features/trips/pages/accept-invite/accept-invite.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TripInviteService } from '@core/trips';
import { NotificationService } from '@core/notifications/notification.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-h-screen bg-white p-6 flex items-center justify-center relative overflow-hidden"
    >
      <!-- SVG de fondo igual que el dashboard -->
      <img
        src="/images/mapamundi.svg"
        alt="Mapa mundial"
        class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none transform scale-125"
        style="
      filter: invert(70%) sepia(1%) saturate(209%) hue-rotate(4deg) brightness(94%) contrast(85%);
    "
      />

      <!-- Contenido -->
      <div class="relative z-10 w-full max-w-2xl">
        <div
          class="bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-18"
        >
          @if (isLoading()) {
          <!-- Estado de carga -->
          <div class="text-center">
            <div
              class="w-20 h-20 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <div
                class="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent"
              ></div>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-3">Procesando invitación</h2>
            <p class="text-gray-600">Estamos verificando tu invitación al viaje...</p>
            <div class="mt-6 flex justify-center gap-1">
              <div
                class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style="animation-delay: 0s"
              ></div>
              <div
                class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style="animation-delay: 0.1s"
              ></div>
              <div
                class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style="animation-delay: 0.2s"
              ></div>
            </div>
          </div>
          } @else if (error()) {
          <!-- Estado de error -->
          <div class="text-center">
            <div
              class="w-20 h-20 bg-linear-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <svg
                class="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-3">No se pudo aceptar la invitación</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">{{ error() }}</p>

            <div class="flex items-center justify-center gap-4">
              <button
                (click)="goToLogin()"
                class="w-full px-6 py-4 bg-linear-to-r from-gray-900 to-gray-800 text-white rounded-full font-semibold hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Iniciar sesión</span>
              </button>

              <button
                (click)="goToHome()"
                class="w-full px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Ir al inicio</span>
              </button>
            </div>
          </div>
          } @else if (success()) {
          <!-- Estado de éxito -->
          <div class="text-center">
            <div
              class="w-20 h-20 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-slow"
            >
              <svg
                class="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-3">¡Invitación aceptada!</h2>
            <p class="text-gray-600 mb-8 leading-relaxed">
              Te has unido al viaje correctamente.<br />
              Serás redirigido en unos segundos...
            </p>

            <!-- Barra de progreso -->
            <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-linear-to-r from-green-500 to-green-600 rounded-full animate-progress"
              ></div>
            </div>

            <p class="text-sm text-gray-500 mt-4 animate-pulse">Redirigiendo al viaje...</p>
          </div>
          }

          <!-- Logo/Branding en la parte inferior -->
          <div class="text-center mt-8">
            <p class="text-gray-600 text-sm">
              ¿Problemas con la invitación?
              <span class="text-gray-900 font-semibold"> Contacta con el organizador </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes bounce-slow {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      @keyframes progress {
        0% {
          width: 0%;
        }
        100% {
          width: 100%;
        }
      }

      .animate-bounce-slow {
        animation: bounce-slow 1s ease-in-out;
      }

      .animate-progress {
        animation: progress 2s ease-in-out;
      }
    `,
  ],
})
export default class AcceptInviteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inviteService = inject(TripInviteService);
  private notificationService = inject(NotificationService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  success = signal(false);

  async ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.error.set('Token de invitación no válido');
      this.isLoading.set(false);
      return;
    }

    await this.acceptInvitation(token);
  }

  private async acceptInvitation(token: string) {
    try {
      this.isLoading.set(true);

      const result = await this.inviteService.acceptInvite(token);

      this.success.set(true);
      this.notificationService.success('Te has unido al viaje correctamente');

      setTimeout(() => {
        this.router.navigate(['/trips', result.tripId]);
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting invite:', error);

      if (error.message.includes('iniciar sesión')) {
        this.error.set('Debes iniciar sesión para aceptar la invitación');
      } else if (error.message.includes('expirada')) {
        this.error.set(
          'Esta invitación ha expirado o es inválida. Solicita una nueva al organizador del viaje'
        );
      } else {
        this.error.set(error.message || 'No se pudo aceptar la invitación');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
