import { effect, inject } from "@angular/core";
import {
	patchState,
	signalStore,
	withHooks,
	withMethods,
	withProps,
	withState,
} from "@ngrx/signals";
import type { ParticipantWithUser } from "../models";
import { TripParticipantService } from "../services";
import { TripStore } from "./trips.store";

type TripParticipantState = {
	isLoading: boolean;
	participants: ParticipantWithUser[];
};

const initialState: TripParticipantState = {
	isLoading: false,
	participants: [],
};

export const TripParticipantStore = signalStore(
	withState(initialState),
	withProps(() => ({
		selectedTrip: inject(TripStore).selectedTrip,
	})),
	withMethods((store, participantService = inject(TripParticipantService)) => ({
		loadParticipants: async () => {
			patchState(store, { isLoading: true });
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				const participants = await participantService.loadParticipantsByTripId(
					trip.id,
				);

				patchState(store, { participants });
			} finally {
				patchState(store, { isLoading: false });
			}
		},
		removeParticipantFromSelectedTrip: async (participantId: string | null) => {
			const trip = store.selectedTrip();
			if (!trip || !participantId) return;
			patchState(store, { isLoading: true });
			try {
				await participantService.removeParticipantFromTrip(trip.id, participantId);
				patchState(store, {
					participants: store
						.participants()
						.filter((p) => p.user_id !== participantId),
				});
			} finally {
				patchState(store, { isLoading: false });
			}
		},
	})),
	withHooks((store) => ({
		onInit() {
			effect(() => {
				if (store.selectedTrip()) {
					store.loadParticipants();
				} else {
					patchState(store, initialState);
				}
			});
		},
	})),
);
