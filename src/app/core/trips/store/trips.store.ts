import { inject } from "@angular/core";
import {
	patchState,
	signalStore,
	withHooks,
	withMethods,
	withState,
} from "@ngrx/signals";
import type { Trip } from "../models";
import { TripService } from "../services";

type TripState = {
	trips: Trip[];
	isLoading: boolean;
	selectedTripId: string | null;
};

const initialState: TripState = {
	trips: [],
	isLoading: false,
	selectedTripId: null,
};

export const TripStore = signalStore(
	withState(initialState),
	withMethods((store, tripService = inject(TripService)) => ({
		loadTrips: async () => {
			patchState(store, { isLoading: true });
			await new Promise((resolve) => {
				setTimeout(resolve, 2000);
			});
			try {
				const trips = await tripService.loadUserTrips();
				patchState(store, { trips, isLoading: false });
			} catch (error) {
				console.error("Error loading trips:", error);
				patchState(store, { isLoading: false });
			}
		},
	})),
	withHooks((store) => ({
		onInit() {
			store.loadTrips();
		},
	})),
);
