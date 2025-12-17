import { Injectable, inject, type Type } from "@angular/core";
import {
	type DynamicDialogConfig,
	DialogService as DynamicDialogService,
} from "primeng/dynamicdialog";

@Injectable({
	providedIn: "root",
	deps: [DynamicDialogService],
})
export class DialogService {
	readonly #dialogService = inject(DynamicDialogService);

	openCustomDialog<Component, Config extends DynamicDialogConfig>(
		component: Type<Component>,
		config: Config = {} as Config,
	) {
		return this.#dialogService.open(component, config);
	}
}
