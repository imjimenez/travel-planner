import {
	Component,
	effect,
	inject,
	input,
	Output,
	signal,
	viewChild,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MapComponent } from "@shared/components/map/map.component";
import type { MapCoordinates } from "@shared/components/map/models";
import { LeafletService } from "@shared/components/map/services/leaflet.service";
import { ButtonModule } from "primeng/button";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { combineLatest, firstValueFrom, map } from "rxjs";
import {
	DEFAULT_COORDINATES,
	type Destination,
	INVALID_COORDINATE,
} from "./../../model";

@Component({
	selector: "app-destination-form",
	imports: [
		ReactiveFormsModule,
		InputTextModule,
		InputGroupModule,
		InputGroupAddonModule,
		ButtonModule,
		MapComponent,
		MessageModule,
	],
	templateUrl: "./destination-form.html",
	host: {
		class: "overflow-y-auto",
	},
})
export default class DestinationForm {
	readonly #fb = inject(FormBuilder);
	readonly #leaflet = inject(LeafletService);

	readonly map = viewChild.required(MapComponent);

	destination = input<Destination | null>(null);

	form = this.#fb.group({
		name: this.#fb.nonNullable.control("", [Validators.required]),
		latitude: this.#fb.nonNullable.control(INVALID_COORDINATE, [
			Validators.required,
		]),
		longitude: this.#fb.nonNullable.control(INVALID_COORDINATE, [
			Validators.required,
		]),
	});

	@Output()
	onValue = combineLatest([
		this.form.statusChanges,
		this.form.valueChanges,
	]).pipe(
		map(([status]) => {
			const { name, latitude, longitude } = this.form.getRawValue();
			if (
				status !== "VALID" ||
				[latitude, longitude].includes(INVALID_COORDINATE)
			)
				return null;
			return { name, latitude, longitude };
		}),
	);

	destinationName = signal<string | null>(null);
	mapCoordinates = signal<MapCoordinates>(DEFAULT_COORDINATES);
	isSearching = signal(false);

	constructor() {
		navigator.geolocation.getCurrentPosition(({ coords }) => {
			if (!this.destination())
				this.map().centerMap({
					lat: coords.latitude,
					lng: coords.longitude,
				});
		});
	}

	/**
	 * Efecto para establecer los valores de entrada del formulario.
	 */
	setInputValues = effect(() => {
		const destination = this.destination();
		if (!destination) return;
		this.form.reset({ name: destination.name });
		this.onMapLocationSelected({
			lat: destination.latitude,
			lng: destination.longitude,
		});
	});

	/**
	 * Efecto para deshabilitar el formulario durante la búsqueda.
	 * Cuando se completa la búsqueda, se habilita el formulario nuevamente.
	 */
	disableFormWhileSearching = effect(() => {
		if (this.isSearching()) {
			this.form.disable();
		} else {
			this.form.enable();
		}
	});

	/**
	 * Maneja la selección de ubicación directamente en el mapa
	 */
	async onMapLocationSelected(coordinates: MapCoordinates) {
		this.form.setErrors(null);
		this.isSearching.set(true);
		try {
			const location = await firstValueFrom(
				this.#leaflet.reverseGeocode(coordinates),
			);
			if (!location) {
				throw new Error("No location found");
			}
			this.destinationName.set(location.displayName);
			this.form.patchValue({
				latitude: coordinates.lat,
				longitude: coordinates.lng,
			});
			this.mapCoordinates.set(coordinates);
			this.updateMap(coordinates.lat, coordinates.lng);
		} catch {
			this.form.patchValue({
				latitude: INVALID_COORDINATE,
				longitude: INVALID_COORDINATE,
			});
		} finally {
			this.isSearching.set(false);
		}
	}

	async searchLocation(search: string) {
		const query = search.trim();
		if (!query) return;
		try {
			this.form.setErrors(null);
			this.isSearching.set(true);
			const location = await firstValueFrom(
				this.#leaflet.searchFirstLocation(query),
			);
			if (!location) {
				throw new Error("No location found");
			}
			this.destinationName.set(location.displayName);
			this.form.patchValue({
				latitude: location.coordinates.lat,
				longitude: location.coordinates.lng,
			});
			this.updateMap(location.coordinates.lat, location.coordinates.lng);
		} catch {
			this.form.patchValue({
				latitude: INVALID_COORDINATE,
				longitude: INVALID_COORDINATE,
			});
			this.form.setErrors({ notFound: true });
		} finally {
			this.isSearching.set(false);
		}
	}

	/**
	 * Actualizar el mapa con las coordenadas del destino seleccionado
	 */
	updateMap(lat: number, lng: number) {
		if (this.map().initialized()) {
			this.map().centerMap({
				lat,
				lng,
			});
			this.map().addSimpleMarker({ lat, lng });
		}
	}
}
