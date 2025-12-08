import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "@core/authentication";
import { NotificationService } from "@core/notifications/notification.service";
import { ButtonModule } from "primeng/button";
import ForgotPasswordForm from "./../../components/forgot-password-form/forgot-password-form";

/**
 * Componente de recuperación de contraseña
 *
 * Permite a los usuarios solicitar un email para resetear su contraseña
 * cuando la han olvidado.
 *
 * Flujo:
 * 1. Usuario ingresa su email
 * 2. Se envía un email con enlace mágico de recuperación
 * 3. Al hacer clic en el enlace, se redirige a /auth/reset-password
 * 4. Muestra confirmación visual de que el email fue enviado
 *
 * Estados:
 * - emailSent = null: Muestra formulario de solicitud
 * - emailSent = email enviado: Muestra mensaje de confirmación indicando el email al que se envió el enlace
 */
@Component({
	selector: "app-forgot-password",
	imports: [ForgotPasswordForm, ButtonModule, RouterLink],
	templateUrl: "./forgot-password.component.html",
	styles: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
	#auth = inject(AuthService);
	#notification = inject(NotificationService);
	/** Indica si hay una operación en curso */
	loading = signal(false);

	/** Indica si el email de recuperación fue enviado con éxito */
	emailSent: string | null = null;

	/**
	 * Maneja el envío del formulario de recuperación
	 *
	 * 1. Solicita el email de recuperación al servicio
	 * 2. Muestra notificación y cambia el estado a "emailSent"
	 * 3. El usuario puede reenviar el email si no lo recibió
	 */
	async onSendEmail(email: string) {
		this.loading.set(true);
		const response = await this.#auth.resetPassword(email);

		if (response.error) {
			this.#notification.error(response.error);
		} else {
			this.emailSent = email;
		}
		this.loading.set(false);
	}
}
