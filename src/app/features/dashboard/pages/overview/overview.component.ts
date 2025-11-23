import { Component } from "@angular/core";
import { CheckButton } from "../../../../shared/components/check-button/check-button";

@Component({
	selector: "app-overview",
	imports: [CheckButton],
	template: `
    <div>
      <h1>Welcome to the Overview</h1>
      <p>This is the overview component.</p>
      <app-check-button></app-check-button>
    </div>
  `,
	styles: [],
})
export class OverviewComponent {}
