// src/core/trips/components/trip-detail/trip-detail.component.ts

import { DatePipe } from "@angular/common";
import {
	Component,
	computed,
	inject,
	linkedSignal,
	signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@core/authentication/services/auth.service";
import { ItineraryModalService } from "@core/dialog/itinerary-modal.service";
import { DialogService } from "@core/dialog/services/dialog.service";
import { NotificationService } from "@core/notifications/notification.service";
import { TripStore } from "@core/trips/store/trips.store";
import { ChecklistWidgetComponent } from "@features/trips/components/checklist/checklist-widget.component";
import { DocumentWidgetComponent } from "@features/trips/components/documents/documents-widget.component";
import EditTripDialog from "@features/trips/components/edit-trip-dialog/edit-trip-dialog";
import { ExpensesComponent } from "@features/trips/components/expenses/expenses.component";
import { ItineraryDetailComponent } from "@features/trips/components/itinerary/itinerary-detail.component";
// Componentes de la vista
import { ParticipantWidgetComponent } from "@features/trips/components/participants/participants-widget.component";
import { ItineraryModalWrapperComponent } from "@shared/components/modal-wrapper/itinerary-modal-wrapper.component";
import { ConfirmationService } from "primeng/api";
import { ConfirmPopupModule } from "primeng/confirmpopup";

/**
 * Componente para mostrar el detalle de un viaje
 *
 * Se suscribe a los cambios de parámetros de la ruta para actualizar
 * el viaje cuando el usuario navega entre diferentes viajes
 */
@Component({
	selector: "app-trip-detail",
	standalone: true,
	imports: [
		DatePipe,
		ParticipantWidgetComponent,
		DocumentWidgetComponent,
		ChecklistWidgetComponent,
		ExpensesComponent,
		ItineraryDetailComponent,
		ItineraryModalWrapperComponent,
		ConfirmPopupModule,
	],
	templateUrl: "./trip-detail.component.html",
	providers: [ConfirmationService],
	styles: `
    /* Ocultar scrollbars en todos los navegadores */
    .hide-scrollbar {
      scrollbar-width: none;        /* Firefox */
      -ms-overflow-style: none;     /* IE + Edge antiguo */
    }

    .hide-scrollbar::-webkit-scrollbar {
      display: none;                /* Chrome, Safari, Edge */
    }
  `,
})
export class TripDetailComponent {
	readonly #confirmationService = inject(ConfirmationService);
	readonly #dialogService = inject(DialogService);
	readonly #router = inject(Router);
	readonly #tripStore = inject(TripStore);

	private authService = inject(AuthService);
	private notificationService = inject(NotificationService);
	itineraryModalService = inject(ItineraryModalService);

	trip = this.#tripStore.selectedTrip;

	tripDuration = computed(() => {
		const trip = this.trip();
		if (!trip) return 0;
		const start = new Date(trip.start_date);
		const end = new Date(trip.end_date);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		// Sumar 1 para incluir ambos días (inicio y fin)
		return diffDays + 1;
	});

	isPending = linkedSignal<string | null>(() =>
		this.#tripStore.isLoading() ? "Cargando viajes..." : null,
	);
	activeTab = signal<"itinerary" | "expenses">("itinerary");
	isOwner = computed(
		() => this.trip()?.owner_user_id === this.authService.currentUser?.id,
	);

	editTrip() {
		this.#dialogService.openCustomDialog(EditTripDialog, {
			header: "Editar viaje",
			closable: true,
			draggable: false,
			dismissableMask: true,
		});
	}

	deleteTrip(event: Event) {
		this.#confirmationService.confirm({
			target: event.currentTarget as EventTarget,
			header: "Eliminar viaje",
			message: `¿Estás seguro de que deseas eliminar el viaje? Esta acción no se puede deshacer.`,
			icon: "pi pi-exclamation-triangle",
			acceptButtonStyleClass: "p-button-danger",
			rejectButtonStyleClass: "p-button-secondary",
			acceptLabel: "Eliminar",
			rejectLabel: "Cancelar",
			accept: async () => {
				try {
					this.isPending.set("Eliminando viaje");
					await this.#tripStore.deleteSelectedTrip();
					this.notificationService.success("Viaje eliminado correctamente");
					this.#router.navigate(["/app/overview"]);
				} catch (error) {
					console.error("Error al eliminar el viaje:", error);
					this.notificationService.error("Error al eliminar el viaje");
					this.isPending.set(null);
				}
			},
		});
	}

	/**
	 * Permite al participante salir del viaje
	 * Usa el servicio de participantes para remover al usuario actual
	 */
	async leaveTrip(event: Event): Promise<void> {
		this.#confirmationService.confirm({
			target: event.currentTarget as EventTarget,
			header: "Eliminar viaje",
			message: `¿Estás seguro de que deseas salir del viaje "${this.trip()?.name}"?`,
			icon: "pi pi-exclamation-triangle",
			acceptButtonStyleClass: "p-button-danger",
			rejectButtonStyleClass: "p-button-secondary",
			acceptLabel: "Eliminar",
			rejectLabel: "Cancelar",
			accept: async () => {
				try {
					this.isPending.set("Abandonando viaje");
					await this.#tripStore.leaveSelectedTrip();
					this.notificationService.success(
						"Has salido del viaje correctamente",
					);
					this.#router.navigate(["/app/overview"]);
				} catch (error) {
					console.error("Error al salir del viaje:", error);
					this.notificationService.error(
						error instanceof Error ? error.message : "Error al salir del viaje",
					);
					this.isPending.set(null);
				}
			},
		});
	}
}
