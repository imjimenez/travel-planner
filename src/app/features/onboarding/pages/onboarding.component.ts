import { Component } from '@angular/core';
import { TripWizardComponent } from '@shared/components/trips/tripWizard/trip-wizard.component';

/**
 * Componente de onboarding para nuevos usuarios
 *
 * Utiliza el TripWizardComponent en modo página completa con bienvenida.
 * Se muestra cuando un usuario nuevo accede a la aplicación por primera vez.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [TripWizardComponent],
  template: `
    <app-trip-wizard
      [showWelcome]="true"
      [backgroundStyle]="'onboarding'"
      [redirectAfterCreate]="'/trips'"
    >
    </app-trip-wizard>
  `,
})
export class OnboardingComponent {}
