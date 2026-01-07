import { effect, inject } from "@angular/core";
import { NotificationService } from "@core/notifications/notification.service";
import {
	patchState,
	signalStore,
	withHooks,
	withMethods,
	withProps,
	withState,
} from "@ngrx/signals";
import type {
	ItineraryItemInsert,
	ItineraryItemUpdate,
	ItineraryItemWithDetails,
} from "../models";
import { ItineraryService } from "../services";
import { TripStore } from "./trips.store";

type ItineraryModalMode = "create" | "edit" | "view";

type TripItineraryState = {
	isLoading: boolean;
	itinerary: ItineraryItemWithDetails[];
	mode: ItineraryModalMode | null;
};

const initialState: TripItineraryState = {
	isLoading: false,
	itinerary: [],
	mode: null,
};

export const TripItineraryStore = signalStore(
	{ providedIn: "root" },
	withState(initialState),
	withProps(() => ({
		selectedTrip: inject(TripStore).selectedTrip,
	})),
	withMethods(
		(
			store,
			itineraryServie = inject(ItineraryService),
			notificationService = inject(NotificationService),
		) => ({
			setMode(mode: ItineraryModalMode | null) {
				patchState(store, { mode });
			},
			loadItinerary: async () => {
				patchState(store, { isLoading: true });
				const trip = store.selectedTrip();
				if (!trip) return;
				try {
					const itinerary = await itineraryServie.loadItineraryItems(trip.id);

					patchState(store, { itinerary });
				} catch {
					notificationService.error(
						"Error al cargar las paradas del itinerario",
					);
				} finally {
					patchState(store, { isLoading: false });
				}
			},
			createItineraryItemForSelectedTrip: async (
				itemData: ItineraryItemInsert,
			) => {
				const trip = store.selectedTrip();
				if (!trip) return null;
				patchState(store, { isLoading: true });
				try {
					const createdItem = await itineraryServie.createItineraryItem({
						...itemData,
						trip_id: trip.id,
					});
					patchState(store, {
						itinerary: store.itinerary().concat(createdItem),
					});
					return createdItem;
				} finally {
					patchState(store, { isLoading: false });
				}
			},
			updateItineraryItem: async (
				itemId: string,
				itemData: ItineraryItemUpdate,
			) => {
				patchState(store, { isLoading: true });
				try {
					const updatedItem = await itineraryServie.updateItineraryItem(
						itemId,
						itemData,
					);

					patchState(store, {
						itinerary: store
							.itinerary()
							.map((item) => (item.id === itemId ? updatedItem : item)),
					});
					return updatedItem;
				} finally {
					patchState(store, { isLoading: false });
				}
			},
			deleteItineraryItem: async (itemId: string) => {
				patchState(store, { isLoading: true });
				try {
					await itineraryServie.deleteItineraryItem(itemId);

					patchState(store, {
						itinerary: store.itinerary().filter((item) => item.id !== itemId),
					});
				} finally {
					patchState(store, { isLoading: false });
				}
			},
		}),
	),

	withHooks((store) => ({
		onInit: () => {
			effect(() => {
				if (store.selectedTrip()) {
					store.loadItinerary();
				} else {
					patchState(store, initialState);
				}
			});
		},
	})),
);
