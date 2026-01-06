import { inject } from "@angular/core";
import { AuthService } from "@core/authentication";
import {
	patchState,
	signalStore,
	withComputed,
	withHooks,
	withMethods,
	withState,
} from "@ngrx/signals";
import type { Trip, TripInsert } from "../models";
import { TripParticipantService, TripService } from "../services";

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
	{ providedIn: "root" },
	withState(initialState),
	withComputed(({ selectedTripId, trips }) => ({
		selectedTrip: () => {
			return trips().find((trip) => trip.id === selectedTripId());
		},
	})),
	withMethods(
		(
			store,
			tripService = inject(TripService),
			participantService = inject(TripParticipantService),
			authService = inject(AuthService),
		) => ({
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
			selectTrip: (id: string | null) => {
				patchState(store, { selectedTripId: id });
			},
			createTrip: async (trip: TripInsert) => {
				try {
					const newTrip = await tripService.createTrip(trip);
					const updatedTrips = [...store.trips(), newTrip];
					patchState(store, { trips: updatedTrips.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) });
					return newTrip;
				} catch (error) {
					console.error("Error creating trip:", error);
					throw error;
				}
			},
			updateSelectedTrip: async (update: Partial<Trip>) => {
				const trip = store.selectedTrip();
				if (!trip) return;
				try {
					const updatedTrip = await tripService.updateTrip(trip.id, update);
					const tripIndex = store.trips().indexOf(trip);
					const updatedTrips = [...store.trips()];
					updatedTrips[tripIndex] = updatedTrip;
					patchState(store, { trips: updatedTrips.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) });
				} catch (error) {
					console.error("Error updating trip:", error);
				}
			},
			deleteSelectedTrip: async () => {
				const trip = store.selectedTrip();
				if (!trip) return;
				try {
					await tripService.deleteTrip(trip.id);
					const tripIndex = store.trips().indexOf(trip);
					const updatedTrips = [...store.trips()];
					updatedTrips.splice(tripIndex, 1);
					patchState(store, { trips: updatedTrips, selectedTripId: null });
				} catch (error) {
					console.error("Error deleting trip:", error);
				}
			},
			leaveSelectedTrip: async () => {
				const trip = store.selectedTrip();
				const user = authService.currentUser;
				if (!trip || !user) return;
				try {
					await participantService.removeParticipantFromTrip(trip.id, user.id);
					const tripIndex = store.trips().indexOf(trip);
					const updatedTrips = [...store.trips()];
					updatedTrips.splice(tripIndex, 1);
					patchState(store, { trips: updatedTrips, selectedTripId: null });
				} catch (error) {
					console.error("Error leaving trip:", error);
				}
			},
		}),
	),
	withHooks((store) => ({
		onInit() {
			store.loadTrips();
		},
	})),
);
