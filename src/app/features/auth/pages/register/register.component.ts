import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
	AuthService,
	type OAuthProvider,
	type SignUpCredentials,
} from "@core/authentication";
import { NotificationService } from "@core/notifications/notification.service";
import OAuthButton from "./../../components/oauth-button/oauth-button";
import RegisterForm from "./../../components/register-form/register-form";
import { Card } from "@shared/components/card";

/**
 * Componente de registro de nuevos usuarios
 *
 * Permite crear una cuenta mediante:
 * - Email, contraseña y nombre completo (formulario tradicional)
 * - OAuth con Google, GitHub o Apple
 *
 * Características:
 * - Toggle para mostrar/ocultar contraseñas
 * - Redirección automática al dashboard tras registro exitoso
 */
@Component({
	imports: [Card, RegisterForm, OAuthButton, RouterLink],
	templateUrl: "./register.component.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "flex flex-col items-center justify-center h-full",
	},
})
export default class RegisterComponent {
	#authService = inject(AuthService);
	#notificationService = inject(NotificationService);
	#router = inject(Router);

	oAuthProviders: OAuthProvider[] = ["google", "github", "apple"];

	/** Indica si hay una operación de registro en curso */
	loading = signal(false);

	/**
	 * Maneja el envío del formulario de registro
	 *
	 * 1. Llama al servicio de autenticación
	 * 2. Muestra notificación de éxito/error
	 * 3. Redirige al dashboard si es exitoso
	 */
	async onRegister(credentials: SignUpCredentials) {
		this.loading.set(true);

		try {
			const response = await this.#authService.signUp(credentials);

			if (response.error) {
				this.#notificationService.error(response.error);
			} else if (response.user) {
				// Verifica si necesita confirmación de email
				if (!response.session) {
					this.#notificationService.success(
						"Cuenta creada. Revisa tu email para confirmar tu dirección de correo.",
					);
					this.#router.navigate(["/auth/login"]);
				} else {
					this.#notificationService.success("Cuenta creada, !Bienvenido!");
					this.#router.navigate(["/dashboard"]);
				}
			} else {
				this.#notificationService.error("Error desconocido al crear la cuenta");
			}
		} catch {
			this.#notificationService.error("Error inesperado al crear la cuenta");
		} finally {
			this.loading.set(false);
		}
	}

	async onOAuth(provider: OAuthProvider) {
		this.loading.set(true);
		const result = await this.#authService.signInWithOAuth(provider);

		if (result.error) {
			this.#notificationService.error(result.error);
			this.loading.set(false);
		}
		// Si no hay error, el navegador redirige automáticamente
	}
}
