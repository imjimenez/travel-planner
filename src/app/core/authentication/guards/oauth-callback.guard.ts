import { inject } from "@angular/core";
import { type CanMatchFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const oauthCallbackGuard: CanMatchFn = async () => {
	const router = inject(Router);
	const auth = inject(AuthService);
	// Esperar a que Supabase procese la sesión
	try {
		await auth.getSession();
	} catch (error) {
		console.error("Error al procesar la sesión:", error);
	}
	// Redirigimos a la raíz y el enrutador se encargará de actualizar la URL en función de si existe o no session
	return router.parseUrl("/");
};
