import { Component } from "@angular/core";
import { NavbarComponent } from "../../../../shared/components/navbar/navbar.component";

@Component({
	imports: [NavbarComponent],
	template: `
    <app-navbar></app-navbar>
  `,
	styleUrl: "./home.component.scss",
})
export class HomeComponent {}
