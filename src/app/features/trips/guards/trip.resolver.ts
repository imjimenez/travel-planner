import { inject } from "@angular/core";
import { RedirectCommand, type ResolveFn, Router } from "@angular/router";
import { NotificationService } from "@core/notifications/notification.service";
import { type Trip, TripService } from "@core/trips";

export const tripResolver: ResolveFn<Trip> = (route) => {
	const tripService = inject(TripService);
	const notificationService = inject(NotificationService);
	const router = inject(Router);
	try {
		const id = route.paramMap.get("id");
		if (!id) {
			throw new Error("No se pudo obtener el id del viaje");
		}
		return tripService.getTripById(id);
	} catch (error) {
		console.error(error);
		notificationService.error("No se pudo cargar el viaje");
		return new RedirectCommand(router.parseUrl("/app/overview"));
	}
};
