import { effect, inject } from "@angular/core";
import {
	patchState,
	signalStore,
	withHooks,
	withMethods,
	withProps,
	withState,
} from "@ngrx/signals";
import type { TripDocumentWithUrl } from "../models";
import { TripDocumentService } from "../services";
import { TripStore } from "./trips.store";

type TripDocumentState = {
	isLoading: boolean;
	isUploading: boolean;
	documents: TripDocumentWithUrl[];
};

const initialState: TripDocumentState = {
	isLoading: false,
	isUploading: false,
	documents: [],
};

export const TripDocumentStore = signalStore(
	{ providedIn: "root" },
	withState(initialState),
	withProps(() => ({
		selectedTrip: inject(TripStore).selectedTrip,
	})),
	withMethods((store, documentService = inject(TripDocumentService)) => ({
		loadDocuments: async () => {
			patchState(store, { isLoading: true });
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				const documents = await documentService.getTripDocumentsWithUrl(
					trip.id,
				);

				patchState(store, { documents });
			} finally {
				patchState(store, { isLoading: false });
			}
		},
		uploadDocumentsIntoSelectedTrip: async (files: File[]) => {
			patchState(store, { isUploading: true });
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				for (const file of files) {
					const doc = await documentService.uploadDocument({
						tripId: trip.id,
						file,
					});
					patchState(store, { documents: [...store.documents(), doc] });
				}
			} finally {
				patchState(store, { isUploading: false });
			}
		},
		deleteDocumentFromSelectedTrip: async (docId: string) => {
			patchState(store, { isLoading: true });
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				await documentService.deleteDocument(docId);
				patchState(store, {
					documents: store.documents().filter((d) => d.id !== docId),
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
					store.loadDocuments();
				} else {
					patchState(store, initialState);
				}
			});
		},
	})),
);
