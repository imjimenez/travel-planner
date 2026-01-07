import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "@core/authentication";
import { ItineraryModalService } from "@core/dialog/itinerary-modal.service";
import { WidgetModalService } from "@core/dialog/widget-modal.service";
import { TripStore } from "@core/trips/store/trips.store";
import { MobileHeaderComponent } from "@shared/components/mobile-header/mobile-header.component";
import { SidebarComponent } from "@shared/components/sidebar/sidebar.component";

@Component({
	imports: [SidebarComponent, RouterOutlet, MobileHeaderComponent],
	templateUrl: "./dashboard-layout.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "flex lg:gap-6 h-full" },
})
export default class DashboardLayout {
	readonly #auth = inject(AuthService);
	readonly #tripStore = inject(TripStore);

	trips = this.#tripStore.trips;
	isLoadingTrips = this.#tripStore.isLoading;
	widgetModalService = inject(WidgetModalService);
	itineraryModalService = inject(ItineraryModalService);
	user = this.#auth.currentUser;
}
