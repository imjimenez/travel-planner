import type { Tables, TablesInsert, TablesUpdate } from '@core/supabase/supabase.types';

/**
 * Modelo de TodoItem (lectura desde BD)
 * 
 * Representa una tarea del checklist de un viaje.
 * Todos los miembros del viaje pueden crear, ver, editar y eliminar tareas.
 */
export type TripTodo = Tables<'todo_item'>;

/**
 * Modelo para crear un nuevo TodoItem
 * 
 * Se usa al crear una nueva tarea en el checklist del viaje.
 */
export type TripTodoInsert = TablesInsert<'todo_item'>;

/**
 * Modelo para actualizar un TodoItem
 * 
 * Se usa para actualizar el estado, título, detalles o asignación de una tarea.
 */
export type TripTodoUpdate = TablesUpdate<'todo_item'>;

/**
 * Datos necesarios para crear una tarea
 * 
 * Simplifica la creación desde la UI, el servicio añade automáticamente
 * el created_by con el usuario actual.
 */
export interface CreateTodoData {
  /** ID del viaje al que pertenece la tarea */
  tripId: string;
  
  /** Título de la tarea */
  title: string;
  
  /** Detalles adicionales (opcional) */
  details?: string;
  
  /** Usuario asignado (ID de usuario, opcional) */
  assigned_to?: string;
  
  /** Estado inicial (por defecto 'pending') */
  status?: 'pending' | 'in_progress' | 'completed';
}

/**
 * Datos para actualizar una tarea
 */
export interface UpdateTodoData {
  /** Nuevo título (opcional) */
  title?: string;
  
  /** Nuevos detalles (opcional) */
  details?: string;
  
  /** Usuario asignado (opcional) */
  assigned_to?: string;
  
  /** Nuevo estado (opcional) */
  status?: 'pending' | 'in_progress' | 'completed';
}