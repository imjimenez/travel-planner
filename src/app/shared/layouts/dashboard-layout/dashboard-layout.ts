import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/authentication';
import { ConfirmModalService } from '@core/dialog/confirm-modal.service';
import { ItineraryModalService } from '@core/dialog/itinerary-modal.service';
import { WidgetModalService } from '@core/dialog/widget-modal.service';
import { TripService } from '@core/trips';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';
import { MobileHeaderComponent } from '@shared/components/mobile-header/mobile-header.component';

@Component({
  imports: [SidebarComponent, RouterOutlet, MobileHeaderComponent],
  templateUrl: './dashboard-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex lg:gap-6 h-full' },
})
export default class DashboardLayout {
  readonly #auth = inject(AuthService);
  readonly #tripService = inject(TripService);
  confirmModalService = inject(ConfirmModalService);
  widgetModalService = inject(WidgetModalService);
  itineraryModalService = inject(ItineraryModalService);
  user = this.#auth.currentUser;
  trips = this.#tripService.trips;
}
