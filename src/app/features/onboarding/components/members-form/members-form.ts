import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";

@Component({
	selector: "app-members-form",
	imports: [ButtonModule, InputTextModule],
	templateUrl: "./members-form.html",
	host: {
		class: "flex-1 overflow-y-auto px-12 pb-6",
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MembersForm {
	invitations = input.required<string[]>();

	addMember = output<string>();

	removeInvite(email: string) {
		// Add logic to remove invite
	}
}
