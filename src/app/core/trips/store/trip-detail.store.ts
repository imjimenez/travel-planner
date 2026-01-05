import { effect, inject } from "@angular/core";
import {
	patchState,
	signalStore,
	withHooks,
	withMethods,
	withProps,
	withState,
} from "@ngrx/signals";
import type { ParticipantWithUser, TripDocument, TripTodo } from "../models";
import { TripParticipantService } from "../services";
import { TripStore } from "./trips.store";

type TripDetailState = {
	isLoading: boolean;
	participants: ParticipantWithUser[];
	documents: TripDocument[];
	todos: TripTodo[];
};

const initialState: TripDetailState = {
	isLoading: false,
	participants: [],
	documents: [],
	todos: [],
};

export const TripDetailStore = signalStore(
	withState(initialState),
	withProps(() => ({
		selectedTrip: inject(TripStore).selectedTrip,
		participantService: inject(TripParticipantService),
		// documents: inject(TripDocumentService).documents,
		// todos: inject(TripTodoService).todos,
	})),
	withMethods((store) => ({
		loadTripDetail: async () => {
			patchState(store, { isLoading: true });
			try {
				const tripId = store.selectedTrip()?.id;
				if (!tripId) return;
				const participants =
					await store.participantService.loadParticipantsByTripId(tripId);
				patchState(store, { participants });
			} finally {
				patchState(store, { isLoading: false });
			}
		},
	})),
	withHooks((store) => ({
		onInit() {
			effect(() => {
				if (store.selectedTrip()) {
					store.loadTripDetail();
				} else {
					patchState(store, initialState);
				}
			});
		},
	})),
);
