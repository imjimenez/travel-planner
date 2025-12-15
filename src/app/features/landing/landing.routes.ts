import type { Routes } from "@angular/router";
import { HomeComponent } from "./pages/home/home.component";

const landingRoutes: Routes = [
	{
		path: "",
		component: HomeComponent,
	},
];

export default landingRoutes;
