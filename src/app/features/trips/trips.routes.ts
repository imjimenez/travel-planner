import type { Routes } from "@angular/router";
import { TripDocumentStore } from "@core/trips/store/trip-document.store";
import { TripExpenseStore } from "@core/trips/store/trip-expense.store";
import { TripItineraryStore } from "@core/trips/store/trip-itinerary.store";
import { TripParticipantStore } from "@core/trips/store/trip-participant.store";
import { TripTodoStore } from "@core/trips/store/trip-todo.store";
import { selectTripGuard } from "./guards/trip.guard";
import NewTrip from "./pages/new-trip/new-trip";
import { TripDetailComponent } from "./pages/trip-detail/trip-detail.component";

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
		providers: [
			TripParticipantStore,
			TripDocumentStore,
			TripTodoStore,
			TripItineraryStore,
			TripExpenseStore,
		],
		component: TripDetailComponent,
	},
];

export default tripsRoutes;
