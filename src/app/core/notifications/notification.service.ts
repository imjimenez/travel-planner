import { Injectable } from "@angular/core";
import { BehaviorSubject, type Observable } from "rxjs";

/**
 * Modelo de notificación toast
 */
export interface Notification {
	/** ID único de la notificación */
	id: string;

	/** Tipo de notificación (determina color/icono) */
	type: "success" | "error" | "warning" | "info";

	/** Mensaje a mostrar al usuario */
	message: string;

	/** Duración en ms antes de auto-cerrar (0 = no auto-cerrar) */
	duration?: number;

	/** Indica si la notificación está en proceso de cerrarse (para animación) */
	isClosing?: boolean;
}

/**
 * Servicio de notificaciones tipo toast
 *
 * Gestiona un sistema de notificaciones temporales que se muestran
 * en la esquina de la pantalla. Soporta 4 tipos: success, error, warning, info.
 * Incluye animaciones de entrada (desde la derecha) y salida (hacia arriba).
 *
 * @example
 * constructor(private notification: NotificationService) {}
 *
 * onSave() {
 *   this.notification.success('Datos guardados correctamente');
 * }
 *
 * onError() {
 *   this.notification.error('Error al guardar', 8000); // 8 segundos
 * }
 */
@Injectable({
	providedIn: "root",
})
export class NotificationService {
	private notificationsSubject = new BehaviorSubject<Notification[]>([]);

	/** Observable de notificaciones activas (usado por ToastContainerComponent) */
	public notifications$: Observable<Notification[]> =
		this.notificationsSubject.asObservable();

	/** Duración de la animación de salida en ms */
	private readonly ANIMATION_DURATION = 300;

	/**
	 * Muestra una notificación genérica
	 *
	 * @param type - Tipo de notificación
	 * @param message - Mensaje a mostrar
	 * @param duration - Tiempo en ms antes de auto-cerrar (default: 5000ms)
	 */
	show(type: Notification["type"], message: string, duration: number = 5000) {
		const id = Math.random().toString(36).substr(2, 9);
		const notification: Notification = {
			id,
			type,
			message,
			duration,
			isClosing: false,
		};

		// Añade la notificación a la lista actual
		const current = this.notificationsSubject.value;
		this.notificationsSubject.next([...current, notification]);

		// Auto-elimina después del duration (si duration > 0)
		if (duration > 0) {
			setTimeout(() => this.remove(id), duration);
		}
	}

	/** Muestra una notificación de éxito (verde) */
	success(message: string, duration?: number) {
		this.show("success", message, duration);
	}

	/** Muestra una notificación de error (roja) */
	error(message: string, duration?: number) {
		this.show("error", message, duration);
	}

	/** Muestra una notificación de advertencia (amarilla) */
	warning(message: string, duration?: number) {
		this.show("warning", message, duration);
	}

	/** Muestra una notificación informativa (azul) */
	info(message: string, duration?: number) {
		this.show("info", message, duration);
	}

	/**
	 * Elimina una notificación específica con animación de salida
	 *
	 * Primero marca la notificación como "cerrando" para activar la animación,
	 * luego la elimina del array después de que termine la animación.
	 *
	 * @param id - ID de la notificación a eliminar
	 */
	remove(id: string) {
		const current = this.notificationsSubject.value;
		const notification = current.find((n) => n.id === id);

		// Si la notificación ya está cerrando, no hacer nada
		if (!notification || notification.isClosing) {
			return;
		}

		// Marcar como cerrando para activar la animación
		notification.isClosing = true;
		this.notificationsSubject.next([...current]);

		// Eliminar después de que termine la animación
		setTimeout(() => {
			const updated = this.notificationsSubject.value.filter(
				(n) => n.id !== id,
			);
			this.notificationsSubject.next(updated);
		}, this.ANIMATION_DURATION);
	}

	/**
	 * Elimina todas las notificaciones activas
	 *
	 * Útil para limpiar todas las notificaciones de una vez,
	 * por ejemplo, al cerrar sesión o cambiar de ruta.
	 */
	clearAll() {
		const current = this.notificationsSubject.value;

		// Marcar todas como cerrando
		current.forEach((n) => (n.isClosing = true));
		this.notificationsSubject.next([...current]);

		// Eliminar todas después de la animación
		setTimeout(() => {
			this.notificationsSubject.next([]);
		}, this.ANIMATION_DURATION);
	}
}
