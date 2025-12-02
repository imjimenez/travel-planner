import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NotificationService,
  Notification,
} from '../../../core/notifications/notification.service';
import { Observable } from 'rxjs';

/**
 * Componente contenedor de notificaciones toast
 *
 * Renderiza las notificaciones tipo toast en la esquina superior derecha.
 * Se incluye en el AppComponent para estar disponible globalmente en toda la app.
 *
 * Características:
 * - Muestra múltiples notificaciones apiladas
 * - Auto-cierre después del tiempo configurado (default: 5s)
 * - Tipos: success (verde), error (rojo), warning (amarillo), info (azul)
 * - Botón de cierre manual (X)
 *
 * Uso desde cualquier componente:
 * ```
 * constructor(private notification: NotificationService) {}
 *
 * this.notification.success('Datos guardados');
 * this.notification.error('Error al guardar');
 * ```
 *
 * TODO:
 * - Añadir animaciones de entrada/salida
 * - Mejorar diseño con Tailwind
 * - Añadir iconos SVG en lugar de emojis
 * - Implementar posicionamiento configurable (top-right, bottom-right, etc.)
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  /**
   * Observable de notificaciones activas
   *
   * El servicio mantiene un array de notificaciones que se actualiza
   * automáticamente cuando se añaden o eliminan notificaciones.
   */
  notifications$: Observable<Notification[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  /**
   * Cierra manualmente una notificación
   *
   * Se llama cuando el usuario hace clic en el botón X.
   * El servicio se encarga de eliminarla del array de notificaciones.
   *
   * @param id - ID único de la notificación a cerrar
   */
  close(id: string) {
    this.notificationService.remove(id);
  }

  /**
   * Obtiene el icono correspondiente al tipo de notificación
   *
   * Mapea cada tipo a un emoji/icono visual:
   * - success → ✓ (checkmark)
   * - error → ✕ (X)
   * - warning → ⚠ (triángulo de advertencia)
   * - info → i (i de información)
   *
   * TODO: Reemplazar por iconos SVG para mejor control visual
   *
   * @param type - Tipo de notificación
   * @returns Emoji/icono correspondiente
   */
  getIcon(type: Notification['type']): string {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'i',
    };
    return icons[type];
  }
}
