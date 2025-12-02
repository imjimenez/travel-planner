import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { TripService } from '@core/trips/services/trip.service';

/**
 * Guard que verifica si el usuario necesita onboarding
 *
 * Si el usuario NO tiene viajes, redirige a /onboarding
 * Si el usuario tiene viajes, permite el acceso a la ruta
 */
export const onboardingCheckGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const tripService = inject(TripService);

  try {
    // Si ya cerró onboarding en esta sesión → permitir
    if (sessionStorage.getItem('onboardingDismissed') === 'true') {
      return true;
    }

    const trips = await tripService.getUserTrips();

    if (!trips || trips.length === 0) {
      return router.parseUrl('/onboarding');
    }

    return true;
  } catch (error) {
    return true; // Fail-safe
  }
};
