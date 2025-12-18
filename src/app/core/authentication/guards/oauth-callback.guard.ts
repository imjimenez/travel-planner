import { inject } from '@angular/core';
import { type CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const oauthCallbackGuard: CanMatchFn = async () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  // Esperar a que Supabase procese la sesión
  try {
    await auth.getSession();
    // Redirigimos una vez autenticado
    return router.parseUrl('/overview');
  } catch (error) {
    console.error('Error al procesar la sesión:', error);
  }
  // Redirigimos a la raíz
  return router.parseUrl('/');
};
