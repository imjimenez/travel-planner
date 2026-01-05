// src/app/(dashboard)/overview/overview.component.ts

import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TripStore } from "@core/trips/store/trips.store";
import { ButtonModule } from "primeng/button";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import TripsTimeline from "./../../components/trips-timeline/trips-timeline";

@Component({
	selector: "app-overview",
	standalone: true,
	imports: [
		ProgressSpinnerModule,
		ButtonModule,
		RouterLink,
		TripsTimeline,
	],
	templateUrl: "./overview.component.html",
	styles: [],
})
export class OverviewComponent {
	readonly #tripStore = inject(TripStore);

	trips = this.#tripStore.trips;
	isLoadingTrips = this.#tripStore.isLoading;
}
