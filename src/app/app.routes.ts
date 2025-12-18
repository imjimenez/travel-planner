import type { Routes } from "@angular/router";
import MainLayoutComponent from "@shared/layouts/main-layout/main-layout.component";
import {
    authGuard,
    oauthCallbackGuard,
    onboardingCheckGuard
} from "./core/authentication";
import { HomeComponent } from "./features/landing/pages/home/home.component";

/**
 * Configuración de rutas de la aplicación
 */
export const routes: Routes = [
	{
		// Ruta para gestionar el retorno de OAuth
		path: "oauth/callback",
		canMatch: [oauthCallbackGuard],
		children: [],
	},
	{
		// Landing page pública
		path: "",
		component: HomeComponent,
		pathMatch: "full",
	},
	{
		// Ruta raíz para establecer un layout a las rutas internas
		path: "",
		component: MainLayoutComponent,
		children: [
			{
				path: "auth",
				loadChildren: () => import("@features/auth"),
			},
		],
	},
	{
		path: "invite/:token",
		loadComponent: () =>
			import("./features/trips/pages/accept-invite/accept-invite.component"),
	},
	{
		path: "onboarding",
		canMatch: [authGuard],
		loadComponent: () => import("@features/onboarding/pages/onboarding.component"),
	},
	{
		// Rutas privadas (protegidas)
		// Requiere autenticación vía authGuard
		// Usa DashboardLayout con sidebar para todas las rutas hijas
		path: "",
		canMatch: [authGuard],
		loadComponent: () => import("./shared/layouts/dashboard-layout.component"),
		children: [
			{
				// Overview - página principal del dashboard
				path: "overview",
				canActivate: [onboardingCheckGuard],
				loadChildren: () => import("./features/dashboard/dashboard.routes"),
			},
			{
				// Trips - gestión de viajes
				path: "trips",
				loadChildren: () => import("./features/trips/trips.routes"),
			},
			{
				path: "settings",
				loadChildren: () => import("./features/settings/settings.routes"),
			},
			{
				// Redirige ráiz a overview
				path: "**",
				redirectTo: "overview",
			},
		],
	},
	{
		// Wildcard - rutas no encontradas redirigen a home
		path: "**",
		redirectTo: "",
	},
];
