import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
	Output,
	type Signal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	type AbstractControl,
	FormBuilder,
	ReactiveFormsModule,
	type ValidationErrors,
	Validators,
} from "@angular/forms";
import { DatePickerModule } from "primeng/datepicker";
import { MessageModule } from "primeng/message";
import { combineLatest, first, map } from "rxjs";
import type { TripDates } from "./../../model";

@Component({
	selector: "app-dates-form",
	imports: [ReactiveFormsModule, DatePickerModule, MessageModule],
	templateUrl: "./dates-form.html",
	host: {
		class: "overflow-y-auto",
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatesForm {
	readonly #fb = inject(FormBuilder);

	dates = input<TripDates | null>(null);
	isLoading = input<boolean>(false);

	form = this.#fb.group(
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
	);

	@Output()
	onValue = combineLatest([
		this.form.statusChanges,
		this.form.valueChanges,
	]).pipe(
		map(([status]) => {
			const { startDate, endDate } = this.form.getRawValue();
			if (status !== "VALID" || !startDate || !endDate) return null;
			return {
				start_date: startDate.toISOString(),
				end_date: endDate.toISOString(),
			};
		}),
	);

	today = new Date();
	tripDuration: Signal<number>;

	constructor() {
		// Mantenemos el campo endDate deshabilitado hasta que startDate tenga un valor
		this.form.controls.startDate.valueChanges
			.pipe(first(Boolean))
			.subscribe(() => {
				this.form.controls.endDate.enable();
			});
		const valueChanged = toSignal(this.form.valueChanges, {
			initialValue: this.form.getRawValue(),
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
	/**
	 * Efecto para establecer los valores de entrada del formulario.
	 */
	setInputValues = effect(() => {
		const dates = this.dates();
		if (!dates) return;
		this.form.reset({
			startDate: new Date(dates.start_date),
			endDate: new Date(dates.end_date),
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

	#endDateMustBeAfterStartDate(
		control: AbstractControl,
	): ValidationErrors | null {
		const startDate = control.get("startDate")?.value;
		const endDate = control.get("endDate")?.value;
		if (!startDate || !endDate) return null;
		return startDate > endDate ? { endDateMustBeAfterStartDate: true } : null;
	}
}
