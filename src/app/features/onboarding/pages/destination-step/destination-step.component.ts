import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import DestinationForm from "@features/onboarding/components/destination-form/destination-form";
import { OnboardingStore } from "@features/onboarding/stores/onboarding.store";
import { ButtonModule } from "primeng/button";
import StepHeader from "./../../components/step-header/step-header";
import type { Destination } from "./../../model";

@Component({
	imports: [StepHeader, DestinationForm, ButtonModule, RouterLink],
	templateUrl: "./destination-step.component.html",
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: "flex-1 overflow-hidden flex flex-col",
	},
})
export default class DestinationStep {
	#onboardingStore = inject(OnboardingStore);
	#router = inject(Router);

	currentDestination = this.#onboardingStore.currentDestination;
	destinationValue: Destination | null = null;

	completeStep() {
		if (!this.destinationValue) return;
		this.#onboardingStore.updateTrip(this.destinationValue);
		this.#onboardingStore.completeCurrentStep();
		this.#router.navigate(["app", "onboarding", "dates"]);
	}
}
