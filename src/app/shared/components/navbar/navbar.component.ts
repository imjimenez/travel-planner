import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../../core/authentication";

/**
 * Componente de barra de navegación (navbar) de la landing page
 *
 * Muestra la navegación principal para usuarios no autenticados.
 * Este es un componente temporal/básico a mejorar
 *
 * Funcionalidades actuales:
 * - Links a Login y Register cuando NO hay usuario autenticado
 * - Link al Dashboard cuando SÍ hay usuario autenticado
 * - Logo/nombre de la aplicación
 *
 * El navbar se renderiza condicionalmente según el estado de autenticación
 * usando el observable currentUser$ con el pipe async en el template.
 *
 * TODO:
 * - Añadir menú de navegación responsive
 * - Mejorar diseño visual con Tailwind
 * - Añadir animaciones de transición
 */
@Component({
	selector: "app-navbar",
	imports: [RouterLink, AsyncPipe],
	template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="logo">Travel planner</a>

        <div class="nav-links">
          @if (currentUser$ | async; as user) {
            <a routerLink="/dashboard" class="btn btn-outline">Dashboard</a>
          } @else {
            <a routerLink="/auth/login" class="btn btn-outline">Iniciar Sesión</a>
            <a routerLink="/auth/register" class="btn btn-primary">Registrarse</a>
          }
        </div>
      </div>
    </nav>
  `,
	styleUrl: "./navbar.component.scss",
})
export class NavbarComponent {
	#authService = inject(AuthService);
	/**
	 * Observable del usuario actual
	 *
	 * Se usa con el pipe async en el template para:
	 * - Mostrar "Login/Register" si currentUser$ emite null
	 * - Mostrar "Dashboard" si currentUser$ emite un objeto User
	 *
	 * @example
	 * // En el template:
	 * @if (currentUser$ | async; as user) {
	 *   <a routerLink="/dashboard">Dashboard</a>
	 * } @else {
	 *   <a routerLink="/auth/login">Login</a>
	 * }
	 */
	currentUser$ = this.#authService.currentUser$;
}
