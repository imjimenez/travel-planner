import { Injectable, inject } from "@angular/core";
import { AuthService } from "@core/authentication/services/auth.service";
import { SupabaseService } from "@core/supabase/supabase.service";
import type {
	CreateTodoData,
	TripTodo,
	UpdateTodoData,
} from "../models/trip-todo.model";

/**
 * Servicio para gestión de tareas (checklist) de viajes
 *
 * Proporciona operaciones CRUD sobre la tabla 'todo_item':
 * - Crear tareas
 * - Listar tareas del viaje
 * - Actualizar tareas (estado, asignación, detalles)
 * - Eliminar tareas
 * - Filtrar por estado o usuario asignado
 *
 * Permisos:
 * Todos los miembros del viaje pueden realizar cualquier operación
 * sobre las tareas (las políticas RLS ya están configuradas en BD).
 *
 * Estados posibles:
 * - 'pending': Pendiente
 * - 'in_progress': En progreso
 * - 'completed': Completada
 */
@Injectable({
	providedIn: "root",
})
export class TripTodoService {
	private supabaseService = inject(SupabaseService);
	private authService = inject(AuthService);

	/**
	 * Crea una nueva tarea en el checklist del viaje
	 *
	 * Automáticamente asigna el created_by al usuario actual y
	 * establece el status como 'pending' si no se especifica.
	 *
	 * @param data - Datos de la tarea a crear
	 * @returns Tarea creada
	 * @throws Error si el usuario no es miembro del viaje
	 *
	 * @example
	 * const todo = await service.createTodo({
	 *   tripId: 'trip-123',
	 *   title: 'Reservar hotel',
	 *   details: 'Hotel cerca del centro',
	 *   status: 'pending'
	 * });
	 */
	async createTodo(data: CreateTodoData): Promise<TripTodo> {
		const user = await this.authService.getAuthUser();
		if (!user) throw new Error("Usuario no autenticado");

		const { data: todo, error } = await this.supabaseService.client
			.from("todo_item")
			.insert({
				trip_id: data.tripId,
				title: data.title,
				details: data.details || null,
				assigned_to: data.assigned_to || null,
				status: data.status || "pending",
				created_by: user.id,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Error al crear tarea: ${error.message}`);
		}

		return todo;
	}

	/**
	 * Obtiene todas las tareas de un viaje
	 *
	 * Las tareas se ordenan por fecha de creación (más recientes primero).
	 *
	 * @param tripId - ID del viaje
	 * @returns Lista de tareas del viaje
	 * @throws Error si el usuario no es miembro
	 *
	 * @example
	 * const todos = await service.getTripTodos('trip-123');
	 */
	async getTripTodos(tripId: string): Promise<TripTodo[]> {
		const user = this.authService.currentUser;
		if (!user) throw new Error("Usuario no autenticado");

		const { data, error } = await this.supabaseService.client
			.from("todo_item")
			.select("*")
			.eq("trip_id", tripId)
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Error al obtener tareas: ${error.message}`);
		}

		return data || [];
	}

	/**
	 * Actualiza una tarea existente
	 *
	 * Todos los miembros del viaje pueden actualizar cualquier tarea.
	 * Se actualiza automáticamente el campo updated_at.
	 *
	 * @param todoId - ID de la tarea a actualizar
	 * @param updates - Campos a actualizar
	 * @returns Tarea actualizada
	 * @throws Error si la tarea no existe
	 *
	 * @example
	 * await service.updateTodo('todo-123', {
	 *   status: 'completed',
	 *   details: 'Reserva confirmada'
	 * });
	 */
	async updateTodo(todoId: string, updates: UpdateTodoData): Promise<TripTodo> {
		const user = await this.authService.getAuthUser();
		if (!user) throw new Error("Usuario no autenticado");

		// Obtener la tarea para verificar permisos
		const { data: todo, error: getError } = await this.supabaseService.client
			.from("todo_item")
			.select("trip_id")
			.eq("id", todoId)
			.single();

		if (getError || !todo || !todo.trip_id) {
			throw new Error("Tarea no encontrada");
		}

		const { data, error } = await this.supabaseService.client
			.from("todo_item")
			.update({
				...updates,
				updated_at: new Date().toISOString(),
			})
			.eq("id", todoId)
			.select()
			.single();

		if (error) {
			throw new Error(`Error al actualizar tarea: ${error.message}`);
		}

		return data;
	}

	/**
	 * Elimina una tarea
	 *
	 * Todos los miembros del viaje pueden eliminar cualquier tarea.
	 *
	 * @param todoId - ID de la tarea a eliminar
	 * @throws Error si la tarea no existe
	 *
	 * @example
	 * await service.deleteTodo('todo-123');
	 */
	async deleteTodo(todoId: string): Promise<void> {
		const user = await this.authService.getAuthUser();
		if (!user) throw new Error("Usuario no autenticado");

		// Obtener la tarea para verificar permisos
		const { data: todo, error: getError } = await this.supabaseService.client
			.from("todo_item")
			.select("trip_id")
			.eq("id", todoId)
			.single();

		if (getError || !todo || !todo.trip_id) {
			throw new Error("Tarea no encontrada");
		}

		const { error } = await this.supabaseService.client
			.from("todo_item")
			.delete()
			.eq("id", todoId);

		if (error) {
			throw new Error(`Error al eliminar tarea: ${error.message}`);
		}
	}
}
