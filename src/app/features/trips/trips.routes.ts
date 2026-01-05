import type { Routes } from "@angular/router";
import { selectTripGuard } from "./guards/trip.guard";
import NewTrip from "./pages/new-trip/new-trip";
import { TripDetailComponent } from "./pages/trip-detail/trip-detail.component";
import { TripParticipantStore } from "@core/trips/store/trip-participant.store";

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
		providers: [TripParticipantStore],
		component: TripDetailComponent,
	},
];

export default tripsRoutes;
