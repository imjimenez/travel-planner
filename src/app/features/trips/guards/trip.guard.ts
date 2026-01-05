import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { NotificationService } from "@core/notifications/notification.service";
import {
	ExpenseService,
	ItineraryService,
	TripDocumentService,
	TripParticipantService,
	TripTodoService,
} from "@core/trips";

export const tripLoadGuard: CanActivateFn = async (route) => {
	const participantService = inject(TripParticipantService);
	const documentService = inject(TripDocumentService);
	const todoService = inject(TripTodoService);
	const expenseService = inject(ExpenseService);
	const itineraryService = inject(ItineraryService);
	const notificationService = inject(NotificationService);
	try {
		const id = route.paramMap.get("id");
		if (!id) {
			throw new Error("No se pudo obtener el id del viaje");
		}
		await Promise.allSettled([
			participantService.loadParticipants(id),
			documentService.getTripDocuments(id),
			todoService.getTripTodos(id),
			expenseService.loadExpenses(id),
			itineraryService.loadItineraryItems(id),
		]);
	} catch (error) {
		console.error(error);
		notificationService.error(
			"Se ha producido un error al cargar los detalles del viaje",
		);
	}
	return true;
};
