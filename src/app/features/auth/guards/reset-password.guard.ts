import { inject } from "@angular/core";
import type { CanDeactivateFn } from "@angular/router";
import { AuthService } from "@core/authentication";
import type ResetPasswordComponent from "../pages/reset-password/reset-password.component";

/**
 * Guarda para eliminar la sesión si el usuario no ha restablecido la contraseña
 * @param component
 */
export const passwordResetedGuard: CanDeactivateFn<
	ResetPasswordComponent
> = async (component) => {
	const authService = inject(AuthService);
	if (!component.isPasswordRestored()) {
		await authService.signOut();
	}
	return true;
};
