// src/app/(dashboard)/overview/overview.component.ts

import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TripService } from "@core/trips/services/trip.service";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { TimelineModule } from "primeng/timeline";
import TripsTimeline from "./../../components/trips-timeline/trips-timeline";

@Component({
	selector: "app-overview",
	standalone: true,
	imports: [
		CardModule,
		ButtonModule,
		ProgressBarModule,
		TagModule,
		TimelineModule,
		RouterLink,
		TripsTimeline,
	],
	templateUrl: "./overview.component.html",
	styles: [],
})
export class OverviewComponent {
	#tripService = inject(TripService);

	trips = this.#tripService.trips;
}
