import { inject } from "@angular/core";
import { type CanMatchFn, Router } from "@angular/router";
import { NotificationService } from "@core/notifications/notification.service";
import { AuthService } from "../services/auth.service";

/**
 * Guard de autenticación para proteger rutas privadas
 *
 * Verifica si el usuario está autenticado antes de permitir el acceso a una ruta.
 * Si no está autenticado, redirige a /auth/login y guarda la URL original
 * en queryParams para volver después del login.
 *
 * @example
 * // En las rutas:
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   component: DashboardComponent
 * }
 */
export const authGuard: CanMatchFn = async (_, segments) => {
	const authService = inject(AuthService);
	const router = inject(Router);

	const user = await authService.getAuthUser();
	if (user) {
		return true; // Usuario autenticado, permite el acceso
	} else {
		// Usuario no autenticado, redirige al login
		// Guarda la URL original para redirigir después del login
		const urlTree = router.createUrlTree(["/auth/login"], {
			queryParams: { returnUrl: segments.map((s) => s.path).join("/") },
		});
		return urlTree;
	}
};

/**
 * Guarda para rutas públicas
 * Comprueba si no existe un usuario autenticado
 * Devuelve true si no hay usuario autenticado, false si hay
 * @returns boolean
 */
export const noAuthGuard: CanMatchFn = async () => {
	const authService = inject(AuthService);
	const user = await authService.getAuthUser();
	if (user) {
		return false;
	}
	return true;
};

/**
 * Guarda para rutas de restablecimiento de contraseña
 * Comprueba si existe un usuario autenticado
 * Devuelve true si hay usuario autenticado, si no redirige a la página de recuperación de contraseña
 * @returns boolean
 */
export const resetPasswordGuard: CanMatchFn = async () => {
	const authService = inject(AuthService);
	const notifications = inject(NotificationService);
	const router = inject(Router);
	try {
		// Verificar que hay un usuario autenticado (viene del magic link)
		const session = await authService.getSession();
		if (!session?.user) {
			throw new Error("Usuario no autenticado");
		}
	} catch (error) {
		console.error("Error al procesar la sesión:", error);
		notifications.error("Enlace de recuperación inválido o expirado");
		return router.parseUrl("/auth/forgot-password");
	}
	return true;
};
