// src/core/trips/components/trip-detail/trip-detail.component.ts

import { CommonModule } from "@angular/common";
import {
	Component,
	computed,
	inject,
	input,
	linkedSignal,
	signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@core/authentication/services/auth.service";
import { ConfirmModalService } from "@core/dialog/confirm-modal.service";
import { ItineraryModalService } from "@core/dialog/itinerary-modal.service";
import { DialogService } from "@core/dialog/services/dialog.service";
import { WidgetModalService } from "@core/dialog/widget-modal.service";
import { NotificationService } from "@core/notifications/notification.service";
import type { Trip } from "@core/trips/models/trip.model";
import { TripService } from "@core/trips/services/trip.service";
import { TripParticipantService } from "@core/trips/services/trip-participant.service";
import { ChecklistModalComponent } from "@features/trips/components/checklist/checklist-modal-component";
import { ChecklistWidgetComponent } from "@features/trips/components/checklist/checklist-widget.component";
import { DocumentsModalComponent } from "@features/trips/components/documents/documents-modal-component";
import { DocumentWidgetComponent } from "@features/trips/components/documents/documents-widget.component";
import EditTripDialog from "@features/trips/components/edit-trip-dialog/edit-trip-dialog";
import { ExpensesComponent } from "@features/trips/components/expenses/expenses.component";
import { ItineraryDetailComponent } from "@features/trips/components/itinerary/itinerary-detail.component";
import { ParticipantsModalComponent } from "@features/trips/components/participants/participants-modal-component";
// Componentes de la vista
import { ParticipantWidgetComponent } from "@features/trips/components/participants/participants-widget.component";
import { ConfirmModalComponent } from "@shared/components/modal-wrapper/confirm-modal-wrapper.component";
import { ItineraryModalWrapperComponent } from "@shared/components/modal-wrapper/itinerary-modal-wrapper.component";
import { ModalWrapperComponent } from "@shared/components/modal-wrapper/widget-modal-wrapper.component";
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
		CommonModule,
		ParticipantWidgetComponent,
		DocumentWidgetComponent,
		ChecklistWidgetComponent,
		ParticipantWidgetComponent,
		ExpensesComponent,
		ItineraryDetailComponent,
		ConfirmPopupModule,
		ModalWrapperComponent,
		ParticipantsModalComponent,
		DocumentsModalComponent,
		ChecklistModalComponent,
		ItineraryModalWrapperComponent,
		ConfirmModalComponent,
	],
	templateUrl: "./trip-detail.component.html",
	providers: [ConfirmationService],
})
export class TripDetailComponent {
	readonly #confirmationService = inject(ConfirmationService);
	readonly #dialogService = inject(DialogService);
	private router = inject(Router);
	private tripService = inject(TripService);
	private participantService = inject(TripParticipantService);
	private authService = inject(AuthService);
	private notificationService = inject(NotificationService);
	confirmModalService = inject(ConfirmModalService);
	widgetModalService = inject(WidgetModalService);
	itineraryModalService = inject(ItineraryModalService);

	tripInfo = input.required<Trip>();

	trip = linkedSignal(() => this.tripInfo());

	// Signals
	isPending = signal<string | null>(null);
	activeTab = signal<"itinerary" | "expenses">("itinerary");
	isOwner = computed(
		() => this.trip()?.owner_user_id === this.authService.currentUser?.id,
	);

	calculateDuration(): number {
		const currentTrip = this.trip();
		if (!currentTrip?.start_date || !currentTrip?.end_date) {
			return 0;
		}

		const start = new Date(currentTrip.start_date);
		const end = new Date(currentTrip.end_date);

		// Calcular diferencia en días
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		// Sumar 1 para incluir ambos días (inicio y fin)
		return diffDays + 1;
	}

	editTrip() {
		const currentTrip = this.trip();
		if (!currentTrip) return;

		const ref = this.#dialogService.openCustomDialog(EditTripDialog, {
			header: "Editar viaje",
			data: currentTrip,
			closable: true,
		});
		ref?.onClose.subscribe((updatedTrip) => {
			if (updatedTrip) {
				this.trip.update((trip) => ({ ...trip, ...updatedTrip }));
			}
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
					const currentTrip = this.trip();
					if (!currentTrip) throw new Error("Trip not found");
					await this.tripService.deleteTrip(currentTrip.id);
					this.notificationService.success("Viaje eliminado correctamente");
					this.router.navigate(["/app/overview"]);
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
	async leaveTrip(): Promise<void> {
		const currentTrip = this.trip();
		if (!currentTrip) return;

		const user = await this.authService.getAuthUser();
		if (!user) {
			this.notificationService.error("Usuario no autenticado");
			return;
		}

		this.confirmModalService.open(
			"Salir del viaje",
			`¿Estás seguro de que deseas salir del viaje "${currentTrip.name}"?`,
			async () => {
				try {
					await this.participantService.removeParticipant(
						currentTrip.id,
						user.id,
					);
					this.notificationService.success(
						"Has salido del viaje correctamente",
					);
					this.tripService.loadUserTrips();
					this.router.navigate(["/overview"]);
				} catch (error: any) {
					console.error("Error al salir del viaje:", error);
					this.notificationService.error(
						error.message || "Error al salir del viaje",
					);
				}
			},
			"Salir",
		);
	}

	/**
	 * Maneja el evento de añadir parada al itinerario
	 */
	handleAddStop(): void {
		this.notificationService.info("Funcionalidad de itinerario próximamente");
		console.log("Añadir parada al itinerario");
	}
}
