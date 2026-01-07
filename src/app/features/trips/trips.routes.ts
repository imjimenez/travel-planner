import type { Routes } from "@angular/router";
import { TripExpenseStore } from "@core/trips/store/trip-expense.store";
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
		providers: [TripExpenseStore],
		component: TripDetailComponent,
	},
];

export default tripsRoutes;
