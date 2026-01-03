import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

/**
 * Layout base para todas las páginas internas de la aplicación
 * Contenedor general con fondo SVG y contenido dinámico
 * TODO: (Valorar) Color configurable en función de la sección actual
 */
@Component({
	standalone: true,
	imports: [RouterOutlet],
	template: `
    <div class="min-h-screen bg-white p-6 flex md:gap-6 relative overflow-hidden">
      <!-- SVG como imagen con filtro verde -->
      <img
        src="/images/mapamundi.svg"
        alt="Mapa mundial"
        class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none transform scale-135 background-filter"
      />
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
	styles: [
		`.background-filter {
      filter: invert(28%) sepia(13%) saturate(2899%) hue-rotate(83deg) brightness(92%) contrast(85%);
    }`,
	],
})
export default class MainLayoutComponent {}
