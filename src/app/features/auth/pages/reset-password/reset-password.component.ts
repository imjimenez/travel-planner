// src/app/features/auth/pages/reset-password/reset-password.component.ts

import {
	ChangeDetectionStrategy,
	Component,
	effect,
	inject,
	signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "@core/authentication";
import { NotificationService } from "@core/notifications/notification.service";
import { ButtonModule } from "primeng/button";
import ResetPasswordForm from "./../../components/reset-password-form/reset-password-form";

@Component({
	selector: "app-reset-password",
	imports: [ResetPasswordForm, ButtonModule, RouterLink],
	template: `
    <div class="space-y-6">
      @if(!isPasswordRestored()) {
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
          <p class="text-gray-600">Ingresa tu nueva contraseña para acceder a tu cuenta</p>
        </div>

        <!-- Formulario -->
        <app-reset-password-form class="block" [loading]="loading()" (resetPassword)="onResetPassword($event)" />

        <div class="text-center pt-2">
            <p class="text-sm text-gray-600">
              ¿Recordaste tu contraseña?
              <a routerLink="/auth/login" class="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Inicia sesión
              </a>
            </p>
        </div>
        }@else{
          <div class="text-center space-y-4">
            <div class="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
              <div class="flex justify-center items-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <i class="pi pi-check-circle text-green-600 text-4xl"></i>
              </div>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">¡Contraseña restablecida!</h2>
            <p class="text-gray-600 text-sm">
              Tu contraseña ha sido actualizada correctamente.
            </p>
            <p class="text-gray-600 text-sm">
              Serás redirigido a la página principal en unos segundos.
            </p>
          </div>

          <div class="pt-4">
            <p-button
              styleClass="w-full py-3 rounded-lg font-medium transform hover:scale-[1.02] transition-all"
              routerLink="/dashboard"
            >
              Continuar
            </p-button>
          </div>
      }
    </div>
  `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResetPasswordComponent {
	#authService = inject(AuthService);
	#notificationService = inject(NotificationService);
	#router = inject(Router);

	loading = signal(false);
	isPasswordRestored = signal(false);
	redirectionDelay = 5000;

	async onResetPassword(password: string) {
		this.loading.set(true);
		try {
			const response = await this.#authService.updatePassword(password);

			if (response.error) {
				this.#notificationService.error(response.error);
			} else {
				this.isPasswordRestored.set(true);
			}
		} catch (error: unknown) {
			let errorMessage = "Error al cambiar la contraseña";
			if (error instanceof Error) {
				errorMessage = error.message;
			}
			this.#notificationService.error(errorMessage);
		} finally {
			this.loading.set(false);
		}
	}

	redirectAfterRestore = effect(async () => {
		if (this.isPasswordRestored()) {
			setTimeout(() => {
				this.#router.navigate(["/overview"]);
			}, this.redirectionDelay);
		}
	});
}
