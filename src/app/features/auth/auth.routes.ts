// Rutas del módulo
import type { Routes } from "@angular/router";
import { noAuthGuard, resetPasswordGuard } from "@core/authentication";
import { passwordResetedGuard } from "./guards/reset-password.guard";
import ForgotPasswordComponent from "./pages/forgot-password/forgot-password.component";
import LoginComponent from "./pages/login/login.component";
import RegisterComponent from "./pages/register/register.component";

const authRoutes: Routes = [
	{
		path: "reset-password",
		canMatch: [resetPasswordGuard],
		canDeactivate: [passwordResetedGuard],
		loadComponent: () =>
			import("./pages/reset-password/reset-password.component"),
	},
	{
		path: "",
		canMatch: [noAuthGuard],
		children: [
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
				path: "**",
				redirectTo: "login",
			},
		],
	},
	{
		path: "**",
		redirectTo: "/app",
	},
];

export default authRoutes;
