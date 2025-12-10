import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
	selector: "app-card",
	template: `
    <div class="w-full max-w-md">
      <div class="bg-white/50 backdrop-blur-xl rounded-2xl shadow-2xl  border-gray-200 p-8 space-y-6">
        <ng-content></ng-content>
      </div>
    </div>
  `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Card {}
