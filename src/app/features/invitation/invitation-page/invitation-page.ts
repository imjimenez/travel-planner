import { Component, inject, type OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "@core/authentication/services/auth.service";
import { NotificationService } from "@core/notifications/notification.service";
import { TripInviteService } from "@core/trips";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from "primeng/progressspinner";

@Component({
	imports: [ProgressSpinnerModule, ButtonModule, RouterLink],
	templateUrl: "./invitation-page.html",
	styles: [],
	host: {
		class: "flex items-center justify-center h-full",
	},
})
export default class InvitationPage implements OnInit {
	readonly #route = inject(ActivatedRoute);
	readonly #router = inject(Router);
	readonly #inviteService = inject(TripInviteService);
	readonly #authService = inject(AuthService);
	readonly #notificationService = inject(NotificationService);

	isLoading = signal(true);
	error = signal<string | null>(null);
	success = signal(false);
	loadingMessage = signal("Validando invitación");
	loadingSubMessage = signal("Estamos verificando tu invitación al viaje...");

	async ngOnInit() {
		const token = this.#route.snapshot.paramMap.get("token");

		if (!token) {
			this.error.set("Token de invitación no válido");
			this.isLoading.set(false);
			return;
		}

		// Verificar si el usuario está autenticado
		const user = await this.#authService.getAuthUser();

		if (!user) {
			// Usuario no autenticado → redirigir al login
			// No mostramos error, simplemente informamos y redirigimos
			this.loadingMessage.set("Redirigiendo al inicio de sesión");
			this.loadingSubMessage.set(
				"Inicia sesión o regístrate para ver esta invitación en tu panel",
			);

			this.#notificationService.info(
				"Inicia sesión para aceptar la invitación",
			);

			setTimeout(() => {
				this.#router.navigate(["/auth/login"]);
			}, 2500);
			return;
		}

		// Usuario autenticado → procesar invitación
		await this.acceptInvitation(token);
	}

	private async acceptInvitation(token: string) {
		try {
			this.isLoading.set(true);
			this.loadingMessage.set("Procesando invitación");
			this.loadingSubMessage.set("Estamos agregándote al viaje...");

			const result = await this.#inviteService.acceptInvite(token);

			this.success.set(true);
			this.#notificationService.success("Te has unido al viaje correctamente");

			setTimeout(() => {
				this.#router.navigate(["/app/trips", result.tripId]);
			}, 2000);
		} catch (error: unknown) {
			console.error("Error accepting invite:", error);
			const message =
				error instanceof Error
					? error.message
					: "No se pudo aceptar la invitación";

			if (message.includes("expirada")) {
				this.error.set(
					"Esta invitación ha expirado o es inválida. Solicita una nueva al organizador del viaje",
				);
			} else {
				this.error.set(message);
			}
		} finally {
			this.isLoading.set(false);
		}
	}
}
