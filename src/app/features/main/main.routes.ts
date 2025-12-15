import type { Routes } from "@angular/router";
import { onboardingCheckGuard } from "@core/authentication";

const mainRoutes: Routes = [
	{
		path: "onboarding",
		loadChildren: () =>
			import("@features/onboarding/onboarding.routes"),
	},
	{
		// Overview - página principal del dashboard
		path: "overview",
		canActivate: [onboardingCheckGuard],
		loadChildren: () => import("@features/dashboard/dashboard.routes"),
	},
	{
		// Trips - gestión de viajes
		path: "trips",
		loadChildren: () => import("@features/trips/trips.routes"),
	},
	{
		path: "settings",
		loadChildren: () => import("@features/settings/settings.routes"),
	},
	{
		// Redirige ráiz a overview
		path: "**",
		redirectTo: "overview",
	},
];

export default mainRoutes;
