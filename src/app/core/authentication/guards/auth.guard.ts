import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Guard de autenticación para proteger rutas privadas
 * 
 * Verifica si el usuario está autenticado antes de permitir el acceso a una ruta.
 * Si no está autenticado, redirige a /auth/login y guarda la URL original
 * en queryParams para volver después del login.
 * 
 * @example
 * // En las rutas:
 * {
 *   path: 'dashboard',
 *   canActivate: [authGuard],
 *   component: DashboardComponent
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Optimización: verifica primero el estado síncrono (más rápido)
  const currentUser = authService.currentUser;
  if (currentUser) {
    return true; // Usuario autenticado
  }

  // Si no hay usuario en el estado síncrono, espera a que se inicialice
  // la autenticación y verifica el Observable
  return authService.currentUser$.pipe(
    take(1), // Toma solo el primer valor y completa
    map(user => {
      if (user) {
        return true; // Usuario autenticado, permite el acceso
      } else {
        // Usuario no autenticado, redirige al login
        // Guarda la URL original para redirigir después del login
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    })
  );
};

