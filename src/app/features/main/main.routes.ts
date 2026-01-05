import type { Routes } from "@angular/router";
import { onboardingCheckGuard } from "@core/authentication";
import { TripStore } from "@core/trips/store/trips.store";
import DashboardLayout from "@shared/layouts/dashboard-layout/dashboard-layout";

const mainRoutes: Routes = [
	{
		path: "onboarding",
		loadChildren: () => import("@features/onboarding/onboarding.routes"),
	},
	{
		path: "",
		component: DashboardLayout,
		providers: [TripStore],
		children: [
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
		],
	},
];

export default mainRoutes;
