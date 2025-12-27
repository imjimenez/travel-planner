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
import { Card } from "@shared/components/card";
import { ButtonModule } from "primeng/button";
import ResetPasswordForm from "./../../components/reset-password-form/reset-password-form";

@Component({
	imports: [Card, ResetPasswordForm, ButtonModule, RouterLink],
	templateUrl: "./reset-password.component.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "flex flex-col items-center justify-center h-screen",
	},
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
				this.#router.navigate(["/app/overview"]);
			}, this.redirectionDelay);
		}
	});
}
