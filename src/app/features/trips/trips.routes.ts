import type { Routes } from "@angular/router";
import { TripDocumentStore } from "@core/trips/store/trip-document.store";
import { TripParticipantStore } from "@core/trips/store/trip-participant.store";
import { selectTripGuard } from "./guards/trip.guard";
import NewTrip from "./pages/new-trip/new-trip";
import { TripDetailComponent } from "./pages/trip-detail/trip-detail.component";
import { TripTodoStore } from "@core/trips/store/trip-todo.store";
import { TripItineraryStore } from "@core/trips/store/trip-itinerary.store";

/**
 * Rutas del módulo Trips
 */
const tripsRoutes: Routes = [
	{
		path: "new",
		component: NewTrip,
	},
	{
		path: ":id",
		canActivate: [selectTripGuard],
		providers: [TripParticipantStore, TripDocumentStore, TripTodoStore, TripItineraryStore],
		component: TripDetailComponent,
	},
];

export default tripsRoutes;
