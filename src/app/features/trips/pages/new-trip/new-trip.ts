import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { LeafletService } from "@core/leaflet/services/leaflet.service";
import { NotificationService } from "@core/notifications/notification.service";
import { type Trip, TripService } from "@core/trips";
import { firstValueFrom } from "rxjs";
import TripForm from "./../../components/trip-form/trip-form";

@Component({
	imports: [TripForm],
	templateUrl: "./new-trip.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NewTrip {
	readonly #leaflet = inject(LeafletService);
	readonly #tripService = inject(TripService);
	readonly #notification = inject(NotificationService);
	readonly #router = inject(Router);

	isCreating = signal(false);

	async createTrip(trip: Partial<Trip>) {
		this.isCreating.set(true);
		try {
			const { name, latitude, longitude, start_date, end_date } = trip;
			if (!name || !latitude || !longitude || !start_date || !end_date) {
				throw new Error("Missing required fields");
			} else {
				const location = await firstValueFrom(
					this.#leaflet.reverseGeocode({ lat: latitude, lng: longitude }),
				);
				const { id } = await this.#tripService.createTrip({
					name,
					latitude,
					longitude,
					start_date,
					end_date,
					...this.#leaflet.extractCityAndCountry(location),
				});
				this.#notification.success("Viaje creado exitosamente");
				this.#router.navigate(["/app", "trips", id]);
			}
		} catch {
			this.#notification.error(
				"Se ha producido un error al crear el viaje. Revise todos los datos y vuelva a intentarlo nuevamente",
			);

			this.isCreating.set(false);
		}
	}
}
