import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import MembersForm from "./../../components/members-form/members-form";
import StepHeader from "./../../components/step-header/step-header";
import { OnboardingStore } from "./../../stores/onboarding.store";

@Component({
	imports: [StepHeader, MembersForm, ButtonModule, RouterLink],
	templateUrl: "./members-step.html",
	host: {
		class: "flex-1 overflow-hidden flex flex-col",
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MembersStep {
	#onboardingStore = inject(OnboardingStore);
	#router = inject(Router);

	next() {
		this.#onboardingStore.completeCurrentStep();
		this.#router.navigate(["/app/overview"]);
	}
}
