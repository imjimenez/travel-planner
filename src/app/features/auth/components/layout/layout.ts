import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
	imports: [RouterOutlet],
	template: `
    <div
      class="min-h-screen bg-white p-4 flex items-center justify-center relative overflow-hidden"
    >
      <!-- SVG de fondo -->
      <img
        src="/images/mapamundi.svg"
        alt="Mapa mundial"
        class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none transform scale-135"
        style="filter: invert(70%) sepia(1%) saturate(209%) hue-rotate(4deg) brightness(94%) contrast(85%);"
      />
      <div class="w-full max-w-md">
        <div class="bg-white/50 backdrop-blur-xl rounded-2xl shadow-2xl  border-gray-200 p-8 space-y-6">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
	styles: ``,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AuthLayout {}
