import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { ButtonModule } from "primeng/button";
import InvitationForm from "./../../components/invitation-form/invitation-form";
import StepHeader from "./../../components/step-header/step-header";
import { OnboardingStore } from "./../../stores/onboarding.store";

@Component({
	imports: [StepHeader, InvitationForm, ButtonModule],
	templateUrl: "./invitation-step.html",
	host: {
		class: "flex-1 overflow-hidden flex flex-col",
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class InvitationStep {
	#onboardingStore = inject(OnboardingStore);
	#router = inject(Router);

	emailsToInvite = this.#onboardingStore.emailsToInvite;
	isLoading = this.#onboardingStore.isLoading;

	onAddEmail(email: string) {
		this.#onboardingStore.addEmail(email);
	}
	onRemoveEmail(email: string) {
		this.#onboardingStore.removeEmail(email);
	}

	async close() {
		await this.#onboardingStore.sendInvitations();
		this.#router.navigate(["/app/overview"]);
	}
}
