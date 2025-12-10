import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
	AuthService,
	type LoginCredentials,
	type OAuthProvider,
} from "@core/authentication";
import { NotificationService } from "@core/notifications/notification.service";
import LoginForm from "./../../components/login-form/login-form";
import OAuthButton from "./../../components/oauth-button/oauth-button";
import Card from "@shared/components/card/card";

/**
 * Componente de inicio de sesión
 *
 * Permite a los usuarios autenticarse mediante:
 * - Email y contraseña (formulario tradicional)
 * - OAuth con Google, GitHub o Apple
 *
 * Características:
 * - Validación de formularios en tiempo real
 * - Toggle para mostrar/ocultar contraseña
 * - Feedback visual mediante notificaciones toast
 * - Redirección automática al dashboard tras login exitoso
 */
@Component({
	selector: "app-login",
	imports: [Card ,RouterLink, LoginForm, OAuthButton],
	templateUrl: "./login.component.html",
	styles: [],
	host: {
		class: "flex items-center justify-center h-full",
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent {
	#authService = inject(AuthService);
	#notificationService = inject(NotificationService);
	#router = inject(Router);

	/** Indica si hay una operación de login en curso */
	loading = false;

	oAuthProviders: OAuthProvider[] = ["google", "github", "apple"];

	/**
	 * Maneja el envío del formulario de login con email/password
	 *
	 * 1. Llama al servicio de autenticación
	 * 2. Muestra notificación de éxito/error
	 * 3. Redirige al dashboard si es exitoso
	 */
	async onLogin(credentials: LoginCredentials) {
		this.loading = true;
		try {
			const response = await this.#authService.signIn(credentials);
			if (response.error) {
				this.#notificationService.error(response.error);
			} else if (response.user) {
				this.#notificationService.success("¡Bienvenido de vuelta!");
				this.#router.navigate(["/dashboard"]);
			} else {
				this.#notificationService.error("Error desconocido al iniciar sesión");
			}
		} catch {
			this.#notificationService.error("Error inesperado al iniciar sesión");
		} finally {
			this.loading = false;
		}
	}

	async onOAuth(provider: OAuthProvider) {
		this.loading = true;
		const result = await this.#authService.signInWithOAuth(provider);

		if (result.error) {
			this.#notificationService.error(result.error);
			this.loading = false;
		}
		// Si no hay error, el navegador redirige automáticamente
	}
}
