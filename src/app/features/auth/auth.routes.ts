// Rutas del módulo
import type { Routes } from "@angular/router";
import { resetPasswordGuard } from "@core/authentication";
import { ForgotPasswordComponent } from "./pages/forgot-password/forgot-password.component";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";

const authRoutes: Routes = [
	{
		path: "login",
		component: LoginComponent,
	},
	{
		path: "register",
		component: RegisterComponent,
	},
	{
		path: "forgot-password",
		component: ForgotPasswordComponent,
	},
	{
		path: "reset-password",
		canMatch: [resetPasswordGuard],
		loadComponent: () =>
			import("./pages/reset-password/reset-password.component"),
	},
	{
		path: "**",
		redirectTo: "login",
	},
];

export default authRoutes;
