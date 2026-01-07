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
import { TripInviteService, TripParticipantService } from "../services";
import { TripStore } from "./trips.store";

type TripParticipantState = {
	isLoading: boolean;
	participants: ParticipantWithUser[];
	pendingInvitations: { id: string; email: string; created_at: string | null }[];
};

const initialState: TripParticipantState = {
	isLoading: false,
	participants: [],
	pendingInvitations: [],
};

export const TripParticipantStore = signalStore(
  {providedIn: 'root'},
	withState(initialState),
	withProps(() => ({
		selectedTrip: inject(TripStore).selectedTrip,
	})),
	withMethods((store, participantService = inject(TripParticipantService), inviteService = inject(TripInviteService)) => ({
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
		loadPendingInvitations: async () => {
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				const pendingInvitations = await inviteService.getPendingInvites(trip.id);
				patchState(store, { pendingInvitations });
			} catch (error) {
				console.error("Error loading pending invitations:", error);
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
