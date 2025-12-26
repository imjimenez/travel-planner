import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
	selector: "app-step-header",
	template: `
    <div class="px-12 pt-6 pb-4 shrink-0">
      <h2 class="text-3xl font-medium text-gray-900 mb-2 tracking-tight">{{ title() }}</h2>
      <p class="text-gray-600">{{ description() }}</p>
      </div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StepHeader {
	title = input("");
	description = input("");
}
