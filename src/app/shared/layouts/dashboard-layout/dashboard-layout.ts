import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "@core/authentication";
import { TripService } from "@core/trips";
import { SidebarComponent } from "@shared/components/sidebar/sidebar.component";

@Component({
	imports: [SidebarComponent, RouterOutlet],
	templateUrl: "./dashboard-layout.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { class: "w-full flex gap-6" },
})
export default class DashboardLayout {
  readonly #auth = inject(AuthService);
  readonly #tripService = inject(TripService);
	user = this.#auth.currentUser;
	trips = this.#tripService.trips;
}
