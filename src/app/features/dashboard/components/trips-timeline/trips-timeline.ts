import { DatePipe, NgClass } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import type { Trip } from "@core/trips";
import { ButtonModule } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { TagModule } from "primeng/tag";
import { TimelineModule } from "primeng/timeline";

@Component({
	selector: "app-trips-timeline",
	imports: [
		ButtonModule,
		TagModule,
		ProgressBarModule,
		TimelineModule,
		DatePipe,
		NgClass,
		RouterLink,
	],
	templateUrl: "./trips-timeline.html",
	host: {
		class: 'p-4'
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TripsTimeline {
	trips = input.required({
		transform: (trips: Trip[]) =>
			trips.map((trip) => ({
				...trip,
				leftDays: Math.ceil(
					(new Date(trip.start_date).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24),
				),
				durationDays: Math.ceil(
					(new Date(trip.end_date).getTime() -
						new Date(trip.start_date).getTime()) /
						(1000 * 60 * 60 * 24),
				)
			})),
	});
	nextTrip = computed(() => this.trips()[0]);
	upcomingTrips = computed(() =>
		this.trips()
			.slice(1)
			.filter((trip) => new Date(trip.start_date) > new Date()),
	);
	pastTrips = computed(() =>
		this.trips()
			.slice(1)
			.filter((trip) => new Date(trip.start_date) < new Date()),
	);
}
