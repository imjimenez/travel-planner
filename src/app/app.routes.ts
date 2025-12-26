import type { Routes } from "@angular/router";
import landingRoutes from "@features/landing";
import MainLayoutComponent from "@shared/layouts/main-layout/main-layout.component";
import { authGuard, oauthCallbackGuard } from "./core/authentication";

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
		pathMatch: "full",
		children: landingRoutes,
	},
	{
		path: "",
		component: MainLayoutComponent,
		children: [
			{
				path: "auth",
				loadChildren: () => import("@features/auth"),
			},
			{
				// Rutas privadas (protegidas)
				// Requiere autenticación vía authGuard
				path: "app",
				canMatch: [authGuard],
				loadChildren: () => import("@features/main"),
			},
			{
				path: "invite/:token",
				loadComponent: () => import("@features/invitation"),
			},
			{
				path: "**",
				redirectTo: "/",
			}
		],
	}
];
