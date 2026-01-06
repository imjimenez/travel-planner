import { inject } from "@angular/core";
import type { CanActivateFn } from "@angular/router";
import { TripStore } from "@core/trips/store/trips.store";

export const selectTripGuard: CanActivateFn = async (route) => {
	const tripStore = inject(TripStore);
	const id = route.paramMap.get("id");
	tripStore.selectTrip(id);
	return true;
};
