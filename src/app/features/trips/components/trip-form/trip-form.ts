import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
	output,
	type Signal,
	signal,
	viewChild,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	type AbstractControl,
	FormBuilder,
	ReactiveFormsModule,
	type ValidationErrors,
	Validators,
} from "@angular/forms";
import { LeafletService } from "@core/leaflet/services/leaflet.service";
import { INVALID_COORDINATE, type Trip } from "@core/trips";
import { MapComponent } from "@shared/components/map/map.component";
import type { MapCoordinates } from "@shared/components/map/models";
import { ButtonModule } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { first, firstValueFrom } from "rxjs";

@Component({
	selector: "app-trip-form",
	imports: [
		ReactiveFormsModule,
		InputTextModule,
		InputGroupModule,
		InputGroupAddonModule,
		MapComponent,
		MessageModule,
		DatePickerModule,
		ButtonModule,
	],
	templateUrl: "./trip-form.html",
	styles: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TripForm {
	readonly #fb = inject(FormBuilder);
	readonly #leaflet = inject(LeafletService);
	readonly map = viewChild.required(MapComponent);

	trip = input<Trip>();
	isLoading = input(false);

	onSubmitTrip = output<Partial<Trip>>();

	form = this.#fb.group({
		name: this.#fb.nonNullable.control("", Validators.required),
		latitude: this.#fb.nonNullable.control(INVALID_COORDINATE, [
			Validators.required,
			Validators.max(INVALID_COORDINATE - 1),
		]),
		longitude: this.#fb.nonNullable.control(INVALID_COORDINATE, [
			Validators.required,
			Validators.max(INVALID_COORDINATE - 1),
		]),
		dates: this.#fb.nonNullable.group(
			{
				startDate: this.#fb.nonNullable.control<Date | null>(null, [
					Validators.required,
				]),
				endDate: this.#fb.nonNullable.control<Date | null>(
					{ value: null, disabled: true },
					[Validators.required],
				),
			},
			{ validators: [this.#endDateMustBeAfterStartDate] },
		),
	});

	isSearching = signal(false);
	destinationName = signal<string | null>(null);
	today = new Date();
	tripDuration: Signal<number>;

	/**
	 * Efecto para establecer los valores de entrada del formulario.
	 */
	setInputValues = effect(() => {
		const trip = this.trip();
		if (!trip) return;
		const { name, latitude, longitude, start_date, end_date } = trip;
		this.form.reset({
			name,
			...(latitude ? { latitude } : {}),
			...(longitude ? { longitude } : {}),
			dates: {
				...(start_date ? { startDate: new Date(start_date) } : {}),
				...(end_date ? { endDate: new Date(end_date) } : {}),
			},
		});
		if (latitude && longitude)
			this.onMapLocationSelected({
				lat: latitude,
				lng: longitude,
			});
	});

	/**
	 * Efecto para habilitar/deshabilitar el formulario según el estado de carga
	 */
	toggleFormStatus = effect(() => {
		if (this.isLoading()) {
			this.form.disable();
		} else {
			this.form.enable();
		}
	});

	constructor() {
		// Mantenemos el campo endDate deshabilitado hasta que startDate tenga un valor
		this.form.controls.dates.controls.startDate.valueChanges
			.pipe(first(Boolean))
			.subscribe(() => {
				this.form.controls.dates.controls.endDate.enable();
			});
		const valueChanged = toSignal(this.form.controls.dates.valueChanges, {
			initialValue: this.form.controls.dates.getRawValue(),
		});
		this.tripDuration = computed(() => {
			const values = valueChanged();
			if (values?.startDate && values?.endDate) {
				const start = new Date(values.startDate);
				const end = new Date(values.endDate);
				const diffTime = Math.abs(end.getTime() - start.getTime());
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				return diffDays;
			}
			return -1;
		});
	}

	onSubmit() {
		if (this.form.valid) {
			const {
				name,
				latitude,
				longitude,
				dates: { startDate, endDate },
			} = this.form.getRawValue();
			this.onSubmitTrip.emit({
				name,
				latitude,
				longitude,
				start_date: startDate?.toISOString(),
				end_date: endDate?.toISOString(),
			});
		}
	}
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
			this.#updateMap(coordinates.lat, coordinates.lng);
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
			this.#updateMap(location.coordinates.lat, location.coordinates.lng);
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
	#updateMap(lat: number, lng: number) {
		if (this.map().initialized()) {
			this.map().centerMap({
				lat,
				lng,
			});
			this.map().addSimpleMarker({ lat, lng });
		}
	}

	#endDateMustBeAfterStartDate(
		control: AbstractControl,
	): ValidationErrors | null {
		const startDate = control.get("startDate")?.value;
		const endDate = control.get("endDate")?.value;
		if (!startDate || !endDate) return null;
		return startDate > endDate ? { endDateMustBeAfterStartDate: true } : null;
	}
}
