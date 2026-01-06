import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from "@angular/core";
import { LeafletService } from "@core/leaflet/services/leaflet.service";
import { NotificationService } from "@core/notifications/notification.service";
import type { Trip } from "@core/trips";
import { TripStore } from "@core/trips/store/trips.store";
import { DynamicDialogRef } from "primeng/dynamicdialog";
import { firstValueFrom } from "rxjs";
import TripForm from "../trip-form/trip-form";

@Component({
	imports: [TripForm],
	templateUrl: "./edit-trip-dialog.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditTripDialog {
	readonly #tripStore = inject(TripStore);
	readonly #leaflet = inject(LeafletService);
	readonly #notification = inject(NotificationService);

	readonly #ref = inject(DynamicDialogRef);

	trip = this.#tripStore.selectedTrip;

	isUpdating = signal(false);

	async updateTrip(updatedTrip: Partial<Trip>) {
		this.isUpdating.set(true);
		try {
			const { name, latitude, longitude, start_date, end_date } = updatedTrip;
			if (!name || !latitude || !longitude || !start_date || !end_date) {
				throw new Error("Missing required fields");
			} else {
				const location = await firstValueFrom(
					this.#leaflet.reverseGeocode({ lat: latitude, lng: longitude }),
				);
				await this.#tripStore.updateSelectedTrip({
					name,
					latitude,
					longitude,
					start_date,
					end_date,
					...this.#leaflet.extractCityAndCountry(location),
				});
				this.#notification.success("Viaje actualizado exitosamente");
				this.#ref.close();
			}
		} catch {
			this.#notification.error(
				"Se ha producido un error al crear el viaje. Revise todos los datos y vuelva a intentarlo nuevamente",
			);

			this.isUpdating.set(false);
		}
	}
}
