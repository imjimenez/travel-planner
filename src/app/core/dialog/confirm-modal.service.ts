import { Injectable, signal, computed } from '@angular/core';

/**
 * Servicio para modales de confirmación reutilizables
 *
 * Permite abrir un modal con:
 * - Título
 * - Texto del body
 * - Texto del botón de confirmar
 * - Acción a ejecutar al confirmar
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmModalService {
  // Señal que indica si el modal está abierto
  private active = signal(false);
  isOpen = computed(() => this.active());

  // Contenido del modal
  private titleSignal = signal<string>('');
  title = computed(() => this.titleSignal());

  private bodySignal = signal<string>('');
  body = computed(() => this.bodySignal());

  private confirmTextSignal = signal<string>('Confirmar');
  confirmText = computed(() => this.confirmTextSignal());

  // Callback a ejecutar al confirmar
  private onConfirmCallback: (() => void) | null = null;

  /**
   * Abre el modal de confirmación
   *
   * @param title - Título del modal
   * @param body - Texto del modal
   * @param confirmText - Texto del botón de confirmar (opcional)
   * @param onConfirm - Función a ejecutar al confirmar
   */
  open(
    title: string,
    body: string,
    onConfirm: () => void,
    confirmText: string = 'Confirmar'
  ): void {
    this.titleSignal.set(title);
    this.bodySignal.set(body);
    this.confirmTextSignal.set(confirmText);
    this.onConfirmCallback = onConfirm;
    this.active.set(true);
  }

  /**
   * Cierra el modal
   */
  close(): void {
    this.active.set(false);
    this.onConfirmCallback = null;
  }

  /**
   * Llama al callback y cierra el modal
   */
  confirm(): void {
    if (this.onConfirmCallback) {
      this.onConfirmCallback();
    }
    this.close();
  }
}
