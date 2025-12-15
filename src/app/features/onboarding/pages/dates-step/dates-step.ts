import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import DatesForm from "./../../components/dates-form/dates-form";
import StepHeader from "./../../components/step-header/step-header";
import type { TripDates } from "./../../model";
import { OnboardingStore } from "./../../stores/onboarding.store";

@Component({
	imports: [StepHeader, DatesForm, ButtonModule, RouterLink],
	templateUrl: "./dates-step.html",
	host: {
		class: "flex-1 overflow-hidden flex flex-col",
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatesStep {
	#onboardingStore = inject(OnboardingStore);
	#router = inject(Router);

	isLoading = this.#onboardingStore.isLoading;
	tripDates = this.#onboardingStore.tripDates;

	value: TripDates | null = null;

	async upsertTrip() {
		if (!this.value) return;
		this.#onboardingStore.updateTrip(this.value);
		this.#onboardingStore.completeCurrentStep();
		const error = await this.#onboardingStore.upsertTrip();
		if (!error) {
			this.#router.navigate(["app", "onboarding", "members"]);
		}
	}
}
