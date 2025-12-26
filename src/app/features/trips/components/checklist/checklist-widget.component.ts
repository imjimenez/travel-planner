import { Component, effect, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetModalService } from '@core/dialog/widget-modal.service';
import { TripTodoService } from '@core/trips/services/trip-todo.service';
import { NotificationService } from '@core/notifications/notification.service';
import type { TripTodo } from '@core/trips/models/trip-todo.model';

/**
 * Widget de checklist para mostrar en el dashboard del viaje
 *
 * Funcionalidades:
 * - Muestra las 2 primeras tareas pendientes
 * - Permite marcar tareas como completadas con checkbox
 * - Input siempre visible para agregar tareas rápidamente
 * - Empty state simple cuando no hay tareas
 * - Abre modal para gestión completa
 * - Loading solo se muestra en la primera carga
 */
@Component({
  selector: 'app-checklist-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="h-62 flex flex-col bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-shadow"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-md font-medium text-gray-900 uppercase tracking-wide">Checklist</h3>
          <p class="text-sm text-gray-500">{{ completedCount() }}/{{ totalCount() }} completadas</p>
        </div>

        <!-- Menu button -->
        <button
          type="button"
          (click)="openChecklistModal()"
          class="flex items-center justify-center w-8 h-8 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          [title]="'Ver todas'"
        >
          <i class="pi pi-pen-to-square" style="font-size: 1rem"></i>
        </button>
      </div>

      <!-- Loading state (solo primera carga) -->
      @if (isLoading()) {
      <div class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
      }

      <!-- Content -->
      @if (!isLoading()) {
      <div class="flex-1 flex flex-col">
        <!-- Empty state simple -->
        @if (pendingTodos().length === 0) {
        <div class="flex items-center h-2 justify-center mb-3"></div>
        <div class="flex items-center gap-2 h-13 justify-center text-gray-500 mb-3">
          <p class="text-sm">No hay tareas pendientes</p>
        </div>
        <div class="flex items-center h-2 justify-center mb-3"></div>

        }

        <!-- Lista de tareas y input -->
        <div class="space-y-3">
          <!-- Primeras 2 tareas pendientes -->
          @for (todo of displayedTodos(); track todo.id) {
          <div
            class="group flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <!-- Checkbox -->
            <div
              class="shrink-0 w-10 h-10 rounded overflow-hidden flex items-center justify-center"
            >
              <button
                type="button"
                (click)="toggleTodo(todo)"
                class="shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 flex items-center justify-center transition-colors cursor-pointer"
                [class.bg-green-500]="todo.status === 'completed'"
                [class.border-green-500]="todo.status === 'completed'"
              >
                @if (todo.status === 'completed') {
                <i class="pi pi-check text-white" style="font-size: 0.65rem"></i>
                }
              </button>
            </div>

            <!-- Texto de la tarea -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm text-gray-900 truncate"
                [class.line-through]="todo.status === 'completed'"
                [class.text-gray-500]="todo.status === 'completed'"
              >
                {{ todo.title }}
              </p>
            </div>
          </div>
          }

          <!-- Input para nueva tarea (siempre visible) -->
          <div
            class="flex items-center gap-2 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg transition-colors"
          >
            <div class="shrink-0 w-10 h-10 rounded flex items-center justify-center">
              <i class="pi pi-plus text-gray-400" style="font-size: 1.25rem"></i>
            </div>
            <input
              type="text"
              [(ngModel)]="newTodoTitle"
              (keyup.enter)="addTodo()"
              (blur)="onInputBlur()"
              placeholder="Agregar tarea..."
              class="flex-1 text-sm bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class ChecklistWidgetComponent implements OnInit {
  @Input() tripId!: string;

  private widgetModalService = inject(WidgetModalService);
  private todoService = inject(TripTodoService);
  private notificationService = inject(NotificationService);

  todos = signal<TripTodo[]>([]);
  isLoading = signal(true);
  newTodoTitle = signal('');
  private isFirstLoad = signal(true);

  /**
   * Computed: Tareas pendientes (no completadas)
   */
  pendingTodos = signal<TripTodo[]>([]);

  /**
   * Computed: Primeras 2 tareas pendientes para mostrar
   */
  displayedTodos = signal<TripTodo[]>([]);

  /**
   * Computed: Total de tareas
   */
  totalCount = signal(0);

  /**
   * Computed: Tareas completadas
   */
  completedCount = signal(0);

  constructor() {
    effect(() => {
      const closed = this.widgetModalService.closedModal();

      if (closed === 'checklist') {
        // Recargar sin loading cuando se cierra el modal
        void this.loadTodos(false);
      }
    });
  }

  async ngOnInit() {
    await this.loadTodos();
  }

  /**
   * Carga todas las tareas del viaje
   * Solo muestra loading en la primera carga
   */
  private async loadTodos(showLoading: boolean = true): Promise<void> {
    try {
      // Solo mostrar loading si es la primera carga Y showLoading es true
      if (this.isFirstLoad() && showLoading) {
        this.isLoading.set(true);
      }

      const allTodos = await this.todoService.getTripTodos(this.tripId);
      this.todos.set(allTodos);

      // Calcular estadísticas
      const pending = allTodos.filter((t) => t.status !== 'completed');
      const completed = allTodos.filter((t) => t.status === 'completed');

      this.pendingTodos.set(pending);
      this.displayedTodos.set(pending.slice(0, 2));
      this.totalCount.set(allTodos.length);
      this.completedCount.set(completed.length);

      // Marcar que ya no es la primera carga
      this.isFirstLoad.set(false);
    } catch (error: any) {
      console.error('Error loading todos:', error);
      this.notificationService.error(error.message || 'No se pudieron cargar las tareas');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Marca/desmarca una tarea como completada
   */
  async toggleTodo(todo: TripTodo): Promise<void> {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';

    try {
      await this.todoService.updateTodo(todo.id, { status: newStatus });
      // Recargar sin loading
      await this.loadTodos(false);
    } catch (error: any) {
      console.error('Error updating todo:', error);
      this.notificationService.error(error.message || 'No se pudo actualizar la tarea');
    }
  }

  /**
   * Agrega una nueva tarea
   */
  async addTodo(): Promise<void> {
    const title = this.newTodoTitle().trim();
    if (!title) return;

    try {
      await this.todoService.createTodo({
        tripId: this.tripId,
        title,
        status: 'pending',
      });

      this.newTodoTitle.set('');
      this.notificationService.success('Tarea agregada');
      // Recargar sin loading
      await this.loadTodos(false);
    } catch (error: any) {
      console.error('Error creating todo:', error);
      this.notificationService.error(error.message || 'No se pudo agregar la tarea');
    }
  }

  /**
   * Maneja el blur del input
   */
  onInputBlur(): void {
    // Si hay texto y el usuario sale del input, agregar la tarea
    if (this.newTodoTitle().trim()) {
      this.addTodo();
    }
  }

  /**
   * Abre el modal con todas las tareas
   */
  openChecklistModal(): void {
    this.widgetModalService.openChecklistModal(this.tripId);
  }
}
