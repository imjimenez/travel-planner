import { Routes } from '@angular/router';
import { authenticationRoutes } from './core/authentication/authentication.routes';
import { HomeComponent } from './features/landing/pages/home/home.component';
import { DashboardLayoutComponent } from './shared/layouts/dashboard-layout/dashboard-layout.component';
import { authGuard } from './core/authentication';

/**
 * Configuración de rutas de la aplicación
 * 
 * Estructura:
 * - / → Landing page pública (home)
 * - /auth → Rutas de autenticación (login, register, forgot-password, etc.)
 * - / (con layout) → Rutas privadas protegidas por authGuard
 * 
 * El authGuard protege todas las rutas del dashboard mediante el layout.
 * Las rutas hijas se cargan de forma lazy (loadChildren) para mejor performance.
 */
export const routes: Routes = [
    {
         // Landing page pública
        path: '',
        component: HomeComponent
    },
    {
        // Rutas de autenticación (públicas)
        // Incluye: /auth/login, /auth/register, /auth/forgot-password, etc.
        path: 'auth',
        children: authenticationRoutes
    },
    {
        // Rutas privadas (protegidas)
        // Requiere autenticación vía authGuard
        // Usa DashboardLayout con sidebar para todas las rutas hijas
        path: '',
        component: DashboardLayoutComponent, // Layout con sidebar
        canActivate: [authGuard], // Protege todas las rutas hijas
        children: [
            {
                // Overview - página principal del dashboard
                path: 'dashboard',
                loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.default)
            },
            {
                // Trips - gestión de viajes
                path:'trips',
                loadChildren: () => import('./features/trips/trips.routes').then(m => m.default)
            },
            {
                path: 'settings',
                loadChildren: () => import('./features/settings/settings.routes').then(m => m.default)
            },
            {
                // Redirige ráiz a overview
                path: '',
                redirectTo: 'overview',
                pathMatch: 'full',
            }
        ]
    },
    {
        // Wildvard - rutas no encontradas redirigen a home
        path: '**',
        redirectTo: '',
    }
];
