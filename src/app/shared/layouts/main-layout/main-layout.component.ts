import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Layout base para todas las páginas internas de la aplicación
 * Contenedor general con fondo SVG y contenido dinámico
 * TODO: (Valorar) Color configurable en función de la sección actual
 */
@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="flex h-screen bg-white lg:p-6 relative">
      <!-- SVG como imagen con filtro verde -->
      <img
        src="/images/mapamundi.svg"
        alt="Mapa mundial"
        class="fixed inset-0 w-full h-full object-cover opacity-50 pointer-events-none transform md:scale-135 background-filter"
      />
      <!-- Capa blur intermedia SOLO en mobile 
      <div
        class="fixed inset-0 bg-white/50 backdrop-blur-xl lg:hidden pointer-events-none z-0"
      ></div>
      -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .background-filter {
        filter: invert(28%) sepia(13%) saturate(2899%) hue-rotate(83deg) brightness(92%)
          contrast(85%);
      }
    `,
  ],
})
export default class MainLayoutComponent {}
