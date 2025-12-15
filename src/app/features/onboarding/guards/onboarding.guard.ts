import { inject } from "@angular/core";
import { type CanActivateChildFn, Router } from "@angular/router";
import { OnboardingStore } from "../stores/onboarding.store";

/**
 * Guarda para establecer el paso seleccionado en el store de onboarding.
 * @returns true
 */
export const selectedStepGuard: CanActivateChildFn = (route) => {
	const onboardingStore = inject(OnboardingStore);
	onboardingStore.setActiveStep(route.data["step"]);
	return true;
};

export const previousCompletedStepGuard: CanActivateChildFn = () => {
	const onboardingStore = inject(OnboardingStore);
	const router = inject(Router);
	const currentStep = onboardingStore.currentStep();
	const steps = onboardingStore.steps();
	if (steps.slice(0, currentStep).some((step) => !step.completed)) {
		return router.parseUrl("/app/onboarding");
	}
	return true;
};
