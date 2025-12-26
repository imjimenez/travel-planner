import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { TripService } from "@core/trips";

export const loadTripsGuard: CanActivateFn = async () => {
	const tripsService = inject(TripService);
	try {
		await tripsService.loadUserTrips();
	} catch (error) {
		console.error("Error loading user trips:", error);
	}
	return true;
};
