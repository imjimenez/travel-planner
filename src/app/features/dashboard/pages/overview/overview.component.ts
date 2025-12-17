// src/app/(dashboard)/overview/overview.component.ts
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TripService } from "@core/trips/services/trip.service";
import { TripModalService } from "@core/trips/services/trip-modal.service.ts";
import { DatePipe } from "@angular/common";

@Component({
	selector: "app-overview",
	standalone: true,
	imports: [DatePipe, RouterLink],
	templateUrl: "./overview.component.html",
	styles: [],
})
export class OverviewComponent {
	private tripService = inject(TripService);
	private tripModalService = inject(TripModalService);

	trips = this.tripService.trips;
	loading = this.tripService.loading;

	openModal() {
		this.tripModalService.openCreateTripModal();
	}
}
