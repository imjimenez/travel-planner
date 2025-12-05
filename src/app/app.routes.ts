import type { Routes } from '@angular/router';
import {
  authGuard,
  noAuthGuard,
  oauthCallbackGuard,
  onboardingCheckGuard,
} from './core/authentication';
import { HomeComponent } from './features/landing/pages/home/home.component';
import { OnboardingComponent } from '@features/onboarding/pages/onboarding.component';

/**
 * Configuración de rutas de la aplicación
 */
export const routes: Routes = [
  {
    path: 'oauth/callback',
    canMatch: [oauthCallbackGuard],
    children: [],
  },
  {
    // Landing page pública
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  {
    // Rutas de autenticación (públicas)
    // Incluye: /auth/login, /auth/register, /auth/forgot-password, etc.
    path: 'auth',
    canMatch: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  {
    // Reset password DEBE permitir usuario autenticado
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/pages/reset-password/reset-password.component'),
  },
  {
    path: 'invite/:token',
    loadComponent: () => import('./features/trips/pages/accept-invite/accept-invite.component'),
  },
  {
    path: 'onboarding',
    canMatch: [authGuard],
    component: OnboardingComponent,
  },
  {
    // Rutas privadas (protegidas)
    // Requiere autenticación vía authGuard
    // Usa DashboardLayout con sidebar para todas las rutas hijas
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('./shared/layouts/dashboard-layout.component'),
    children: [
      {
        // Overview - página principal del dashboard
        path: 'overview',
        canActivate: [onboardingCheckGuard],
        loadChildren: () => import('./features/dashboard/dashboard.routes'),
      },
      {
        // Trips - gestión de viajes
        path: 'trips',
        loadChildren: () => import('./features/trips/trips.routes'),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes'),
      },
      {
        // Redirige ráiz a overview
        path: '**',
        redirectTo: 'overview',
      },
    ],
  },
  {
    // Wildcard - rutas no encontradas redirigen a home
    path: '**',
    redirectTo: '',
  },
];
