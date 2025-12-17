import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ToastComponent } from "./shared/components/toast/toast.component";

/**
 * Componente raíz de la aplicación
 *
 * Este es el componente principal que se monta en index.html.
 * Contiene:
 * - <router-outlet>: Renderiza las rutas configuradas en app.routes.ts
 * - <app-toast>: Sistema de notificaciones toast global
 *
 * El ToastComponent está aquí para que sea visible en todas las páginas,
 * permitiendo mostrar notificaciones desde cualquier parte de la app.
 */
@Component({
	selector: "app-root",
	imports: [RouterOutlet, ToastComponent],
	templateUrl: "./app.html",
	styleUrl: "./app.scss",
})
export class App {}
