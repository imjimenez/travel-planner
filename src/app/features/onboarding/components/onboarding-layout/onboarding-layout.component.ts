import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { OnboardingStore } from './../../stores/onboarding.store';

@Component({
  imports: [RouterOutlet, NgClass, ButtonModule],
  templateUrl: './onboarding-layout.component.html',
  host: {
    class: 'flex h-full w-full items-center justify-center',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OnboardingLayout {
  #router = inject(Router);
  #onboardingStore = inject(OnboardingStore);

  steps = this.#onboardingStore.steps;
  currentStep = this.#onboardingStore.currentStep;

	dismiss() {
		sessionStorage.setItem("onboardingDone", "1");
		this.#router.navigate(["/app/overview"]);
	}
}
