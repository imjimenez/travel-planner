import { Component, type OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../../../core/authentication";

/**
 * Componente de callback OAuth
 *
 * Esta página se carga después de que el usuario se autentica con un
 * proveedor OAuth externo (Google, GitHub, Apple).
 *
 * Flujo:
 * 1. El proveedor redirige a /auth/callback con tokens en la URL
 * 2. Supabase procesa automáticamente los tokens y crea la sesión
 * 3. Este componente espera a que se procese la sesión
 * 4. Redirige al dashboard si hay usuario, o al login si falló
 *
 * NOTA: El HTML solo muestra un spinner/mensaje de "Procesando..."
 */
@Component({
	selector: "app-auth-callback",
	imports: [],
	templateUrl: "./auth-callback.component.html",
	styleUrl: "./auth-callback.component.scss",
})
export class AuthCallbackComponent implements OnInit {
	constructor(
		private authService: AuthService,
		private router: Router,
	) {}

	/**
	 * Procesa el callback OAuth al cargar el componente
	 *
	 * Espera 1 segundo para dar tiempo a Supabase de procesar la sesión,
	 * luego verifica si hay usuario autenticado y redirige en consecuencia.
	 */
	async ngOnInit() {
		// Timeout para dar tiempo a Supabase de procesar la sesión
		setTimeout(async () => {
			const user = await this.authService.currentUser;

			if (user) {
				// Redirige al dashboard o home
				this.router.navigate(["/dashboard"]);
			} else {
				console.error("OAuth login failed");
				this.router.navigate(["/auth/login"]);
			}
		}, 1000);
	}
}
