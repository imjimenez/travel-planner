import type { Routes } from "@angular/router";
import { tripResolver } from "./guards/trip.resolver";
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
		resolve: {
			tripInfo: tripResolver,
		},
		component: TripDetailComponent,
	},
];

export default tripsRoutes;
