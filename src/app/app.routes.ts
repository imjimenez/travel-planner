import type { Routes } from "@angular/router";
import { OnboardingComponent } from "@features/onboarding/pages/onboarding.component";
import {
	authGuard,
	noAuthGuard,
	oauthCallbackGuard,
	onboardingCheckGuard,
	resetPasswordGuard,
} from "./core/authentication";
import { HomeComponent } from "./features/landing/pages/home/home.component";
import AuthLayout from "@features/auth/components/layout/layout";

/**
 * Configuración de rutas de la aplicación
 */
export const routes: Routes = [
	{
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
		// Rutas de autenticación (públicas)
		// Incluye: /auth/login, /auth/register, /auth/forgot-password, etc.
		path: "auth",
		loadComponent: () => import("@features/auth/components/layout/layout"),
		children: [
			{
				path: "reset-password",
				canMatch: [resetPasswordGuard],
				loadComponent: () =>
					import(
						"@features/auth/pages/reset-password/reset-password.component"
					),
			},
			{
				path: "",
				canMatch: [noAuthGuard],
				loadChildren: () => import("./features/auth/auth.routes"),
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
		component: OnboardingComponent,
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
