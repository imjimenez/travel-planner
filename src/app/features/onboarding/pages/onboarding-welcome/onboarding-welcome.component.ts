import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingStore } from '@features/onboarding/stores/onboarding.store';
import { ButtonModule } from 'primeng/button';

@Component({
  imports: [ButtonModule],
  templateUrl: './onboarding-welcome.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'h-full flex flex-col justify-center sm:py-8 sm:px-12',
  },
})
export default class OnboardingWelcome {
  #onboardingStore = inject(OnboardingStore);
  #router = inject(Router);

  next() {
    this.#onboardingStore.completeCurrentStep();
    this.#router.navigate(['app', 'onboarding', 'destination']);
  }
}
