import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '@core/notifications/notification.service';
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
 * - Animaciones de entrada (desde la derecha) y salida (hacia arriba)
 *
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-4 right-4 max-sm:right-3 max-sm:left-3 z-9999 flex flex-col gap-3 max-w-[400px] max-sm:max-w-none"
    >
      @for (notification of notifications$ | async; track notification.id) {

      <div
        [ngClass]="[
          'flex items-center gap-3 p-4 rounded-lg shadow-lg bg-white/30 backdrop-blur-xs border-l-4 animate-slideIn min-w-[300px] max-sm:min-w-0 transition-all duration-300',
          getBorderColor(notification.type),
          notification.isClosing ? 'animate-slideOut' : ''
        ]"
      >
        <div
          [ngClass]="[
            'w-6 h-6 flex items-center justify-center rounded-full text-base shrink-0',
            getIconBackground(notification.type),
            getIconColor(notification.type)
          ]"
        >
          <i [ngClass]="getIcon(notification.type)"></i>
        </div>

        <div class="flex-1 text-sm text-gray-700 leading-normal">
          {{ notification.message }}
        </div>

        <button
          class="border-0 cursor-pointer text-gray-400 p-1 leading-none transition-colors duration-200 shrink-0 hover:text-gray-600"
          (click)="close(notification.id)"
          aria-label="Close"
        >
          <i class="pi pi-times text-sm"></i>
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateY(0);
          opacity: 1;
          max-height: 200px;
          margin-bottom: 12px;
        }
        to {
          transform: translateY(-20px);
          opacity: 0;
          max-height: 0;
          margin-bottom: 0;
        }
      }

      .animate-slideIn {
        animation: slideIn 0.3s ease-out;
      }

      .animate-slideOut {
        animation: slideOut 0.3s ease-out forwards;
      }
    `,
  ],
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
   * Cierra manualmente una notificación con animación
   *
   * Se llama cuando el usuario hace clic en el botón X.
   * Inicia la animación de salida y luego elimina la notificación.
   *
   * @param id - ID único de la notificación a cerrar
   */
  close(id: string) {
    this.notificationService.remove(id);
  }

  /**
   * Obtiene la clase del icono de PrimeNG según el tipo de notificación
   *
   * @param type - Tipo de notificación
   * @returns Clase del icono de PrimeNG
   */
  getIcon(type: Notification['type']): string {
    const icons = {
      success: 'pi pi-check',
      error: 'pi pi-times',
      warning: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle',
    };
    return icons[type];
  }

  /**
   * Obtiene las clases de Tailwind para el color del borde izquierdo según el tipo
   */
  getBorderColor(type: Notification['type']): string {
    const colors = {
      success: 'border-l-emerald-500',
      error: 'border-l-red-500',
      warning: 'border-l-amber-500',
      info: 'border-l-blue-500',
    };
    return colors[type];
  }

  /**
   * Obtiene las clases de Tailwind para el fondo del icono según el tipo
   */
  getIconBackground(type: Notification['type']): string {
    const backgrounds = {
      success: 'bg-emerald-100',
      error: 'bg-red-100',
      warning: 'bg-amber-100',
      info: 'bg-blue-100',
    };
    return backgrounds[type];
  }

  /**
   * Obtiene las clases de Tailwind para el color del icono según el tipo
   */
  getIconColor(type: Notification['type']): string {
    const colors = {
      success: 'text-emerald-500',
      error: 'text-red-500',
      warning: 'text-amber-500',
      info: 'text-blue-500',
    };
    return colors[type];
  }
}
