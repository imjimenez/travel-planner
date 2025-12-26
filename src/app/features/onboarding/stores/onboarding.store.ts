import { inject } from "@angular/core";
import { NotificationService } from "@core/notifications/notification.service";
import { type Trip, TripInviteService, TripService } from "@core/trips";
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from "@ngrx/signals";
import { LeafletService } from "@shared/components/map/services/leaflet.service";
import { firstValueFrom } from "rxjs";

interface OnboardingStep {
	id: number;
	completed: boolean;
}

type OnboardingState = {
	currentStep: number;
	isLoading: boolean;
	steps: OnboardingStep[];
	trip: Partial<Trip>;
	emailsToInvite: string[];
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
	emailsToInvite: [],
};

export const OnboardingStore = signalStore(
	withState(initialState),
	withComputed((state) => ({
		currentDestination: () => {
			const { name, latitude, longitude } = state.trip();
			if (!name || !latitude || !longitude) return null;
			return { name, latitude, longitude };
		},
		dates: () => {
			const { start_date, end_date } = state.trip();
			if (!start_date || !end_date) return null;
			return { start_date, end_date };
		},
	})),
	withMethods(
		(
			state,
			tripService = inject(TripService),
			tripInviteService = inject(TripInviteService),
			leaflet = inject(LeafletService),
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
			async createTrip() {
				patchState(state, { isLoading: true });
				let trip = state.trip();
				try {
					const { name, latitude, longitude, start_date, end_date } = trip;
					if (!name || !latitude || !longitude || !start_date || !end_date) {
						throw new Error("Missing required fields");
					} else {
						const location = await firstValueFrom(
							leaflet.reverseGeocode({ lat: latitude, lng: longitude }),
						);
						trip = await tripService.createTrip({
							name,
							latitude,
							longitude,
							start_date,
							end_date,
							...leaflet.extractCityAndCountry(location),
						});
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
			addEmail(email: string) {
				const emailsToInvite = state.emailsToInvite();
				if (emailsToInvite.includes(email)) {
					notifications.error("El correo electrónico ya está registrado");
					return;
				}
				patchState(state, {
					emailsToInvite: [...state.emailsToInvite(), email],
				});
			},
			removeEmail(email: string) {
				const emailsToInvite = state.emailsToInvite();
				const emailIdx = emailsToInvite.indexOf(email);
				if (emailIdx !== -1) {
					const updatedEmail = [...emailsToInvite];
					updatedEmail.splice(emailIdx, 1);
					patchState(state, {
						emailsToInvite: updatedEmail,
					});
				}
			},
			async sendInvitations() {
				const emailsToInvite = state.emailsToInvite();
				if (!emailsToInvite.length) {
					return;
				}
				patchState(state, { isLoading: true });
				try {
					const tripId = state.trip().id;
					if (!tripId) {
						throw new Error("Trip ID is missing");
					}
					const settledResults = await Promise.allSettled(
						emailsToInvite.map((email) =>
							tripInviteService.inviteUser({
								tripId,
								email,
							}),
						),
					);
					if (settledResults.some((result) => result.status === "rejected")) {
						throw new Error("Some invitations failed");
					}
					return;
				} catch (error) {
					console.error(error);
					notifications.error(
						"Algunas invitaciones no se pudieron enviar. Vuelve a intentarlo desde la página de invitaciones del viaje.",
					);
					return error;
				} finally {
					patchState(state, { isLoading: false });
				}
			},
		}),
	),
);
