import { inject } from "@angular/core";
import { NotificationService } from "@core/notifications/notification.service";
import { type Trip, TripService } from "@core/trips";
import {
	patchState,
	signalStore,
	withComputed,
	withMethods,
	withState,
} from "@ngrx/signals";

interface OnboardingStep {
	id: number;
	completed: boolean;
}

type OnboardingState = {
	currentStep: number;
	isLoading: boolean;
	steps: OnboardingStep[];
	trip: Partial<Trip>;
};

const initialState: OnboardingState = {
	currentStep: 0,
	isLoading: false,
	steps: [
		{
			id: 0,
			completed: false,
		},
		{
			id: 1,
			completed: false,
		},
		{
			id: 2,
			completed: false,
		},
		{
			id: 3,
			completed: false,
		},
	],
	trip: {},
};

export const OnboardingStore = signalStore(
	withState(initialState),
	withComputed((state) => ({
		currentDestination: () => {
			const { name, city, country, latitude, longitude } = state.trip();
			if (!name && !city && !country && !latitude && !longitude) return null;
			return { name, city, country, latitude, longitude };
		},
		tripDates: () => {
			const { start_date, end_date } = state.trip();
			if (!start_date && !end_date) return null;
			return { start_date, end_date };
		},
	})),
	withMethods(
		(
			state,
			tripService = inject(TripService),
			notifications = inject(NotificationService),
		) => ({
			setActiveStep(step: number) {
				patchState(state, { currentStep: step });
			},
			async completeCurrentStep() {
				const steps = [...state.steps()];
				steps[state.currentStep()].completed = true;
				patchState(state, { steps });
			},
			updateTrip(trip: Partial<Trip>) {
				patchState(state, {
					trip: {
						...state.trip(),
						...trip,
					},
				});
			},
			createTrip() {},
			async upsertTrip() {
				patchState(state, { isLoading: true });
				let trip = state.trip();
				const tripId = trip?.id;

				try {
					if (tripId) {
						trip = await tripService.updateTrip(tripId, trip);
					} else {
						const { name, latitude, longitude, start_date, end_date } = trip;
						if (!name || !latitude || !longitude || !start_date || !end_date) {
							throw new Error("Missing required fields");
						} else {
							trip = await tripService.createTrip({
								name,
								latitude,
								longitude,
								start_date,
								end_date,
							});
						}
					}
					patchState(state, { trip });
					return;
				} catch (error) {
					notifications.error(
						"Se ha producido un error al crear el viaje. Revise todos los datos y vuelva a intentarlo nuevamente",
					);
					return error;
				} finally {
					patchState(state, { isLoading: false });
				}
			},
		}),
	),
);
