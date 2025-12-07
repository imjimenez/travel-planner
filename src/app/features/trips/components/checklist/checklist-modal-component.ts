import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetModalService } from '@core/modal/widget-modal.service';
import { NotificationService } from '@core/notifications/notification.service';
import { TripTodoService } from '@core/trips/services/trip-todo.service';
import { TripParticipantService } from '@core/trips/services/trip-participant.service';
import type { TripTodo } from '@core/trips/models/trip-todo.model';
import type { ParticipantWithUser } from '@core/trips/models/trip-participant.model';
import { ConfirmModalService } from '@core/modal/confirm-modal.service';

/**
 * Modal de gestión de checklist
 *
 * Funcionalidades:
 * - Lista completa de tareas agrupadas por estado
 * - Checkbox para marcar como completadas
 * - Editar tareas completas (título + detalles + asignación)
 * - Eliminar tareas
 * - Asignar participante al crear tarea nueva
 * - Loading solo se muestra en la primera carga
 */
@Component({
  selector: 'app-checklist-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col">
      <!-- Contenido scrolleable -->
      <div
        class="flex-1 overflow-y-auto p-6"
        [class.flex]="!isLoading() && todos().length === 0"
        [class.items-center]="!isLoading() && todos().length === 0"
        [class.justify-center]="!isLoading() && todos().length === 0"
      >
        <!-- Loading state (solo primera carga) -->
        @if (isLoading()) {
        <div class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        }

        <!-- Empty state -->
        @if (!isLoading() && todos().length === 0) {
        <div class="flex flex-col items-center justify-center">
          <i class="pi pi-list-check text-gray-300" style="font-size: 4rem"></i>
          <h3 class="mt-4 text-lg font-medium text-gray-900">No hay tareas</h3>
          <p class="mt-2 text-sm text-gray-500 text-center max-w-sm">
            Organiza tu viaje creando una lista de tareas pendientes
          </p>
        </div>
        }

        <!-- Lista de tareas -->
        @if (!isLoading() && todos().length > 0) {
        <div class="space-y-6">
          <!-- Tareas pendientes -->
          @if (pendingTodos().length > 0) {
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i class="pi pi-circle text-gray-400" style="font-size: 0.5rem"></i>
              Pendientes ({{ pendingTodos().length }})
            </h3>
            <div class="space-y-2">
              @for (todo of pendingTodos(); track todo.id) {
              <div
                class="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-colors"
              >
                <!-- Checkbox -->
                <button
                  type="button"
                  (click)="toggleTodo(todo)"
                  class="shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  @if (todo.status === 'completed') {
                  <i class="pi pi-check text-green-600" style="font-size: 0.7rem"></i>
                  }
                </button>

                <!-- Contenido principal -->
                <div class="flex-1 min-w-0">
                  @if (editingTask() === todo.id) {
                  <!-- MODO EDICIÓN -->
                  <div class="space-y-2">
                    <div class="flex items-center gap-3">
                      <!-- Input título -->
                      <input
                        type="text"
                        [(ngModel)]="editTitle"
                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-green-600 focus:outline-none placeholder-gray-400"
                        placeholder="Título de la tarea"
                      />
                      <!-- Select asignación -->
                      <select
                        [(ngModel)]="editAssignee"
                        class="min-w-42 h-7.5 px-2 py-1 text-xs border border-gray-300 rounded focus:border-green-600 focus:outline-none cursor-pointer"
                      >
                        <option value="">Sin asignar</option>
                        @for (participant of participants(); track participant.user_id) {
                        <option [value]="participant.user_id">{{ participant.fullName }}</option>
                        }
                      </select>
                    </div>

                    <!-- Textarea detalles -->
                    <textarea
                      [(ngModel)]="editDetails"
                      rows="2"
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none placeholder-gray-400 resize-none"
                      placeholder="Detalles adicionales (opcional)"
                    ></textarea>
                  </div>
                  } @else {
                  <!-- MODO VISTA -->
                  <div class="flex items-start gap-6">
                    <!-- Título -->
                    <p class="text-sm font-medium text-gray-900">{{ todo.title }}</p>

                    <!-- Badge asignado (pegado al título) -->
                    @if (todo.assigned_to) {
                    <span
                      class="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      <i class="pi pi-user" style="font-size: 0.6rem"></i>
                      {{ getParticipantName(todo.assigned_to) }}
                    </span>
                    }
                  </div>

                  <!-- Detalles -->
                  @if (todo.details) {
                  <p class="text-xs text-gray-500 mt-0.5">{{ todo.details }}</p>
                  } }
                </div>

                <!-- Botones de acción -->
                <div
                  class="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  @if (editingTask() === todo.id) {
                  <!-- Botones de edición: Guardar y Cancelar -->
                  <button
                    type="button"
                    (click)="saveEdit(todo)"
                    class="w-7 h-7 flex items-center justify-center text-green-600 hover:bg-green-100 rounded transition-colors cursor-pointer"
                    title="Guardar cambios"
                  >
                    <i class="pi pi-check" style="font-size: 0.85rem"></i>
                  </button>
                  <button
                    type="button"
                    (click)="cancelEdit()"
                    class="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                    title="Cancelar"
                  >
                    <i class="pi pi-times" style="font-size: 0.85rem"></i>
                  </button>
                  } @else {
                  <!-- Botones normales: Editar y Eliminar -->
                  <button
                    type="button"
                    (click)="startEdit(todo)"
                    class="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                    title="Editar tarea"
                  >
                    <i class="pi pi-pencil" style="font-size: 0.85rem"></i>
                  </button>
                  <button
                    type="button"
                    (click)="deleteTodo(todo)"
                    class="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                    title="Eliminar tarea"
                  >
                    <i class="pi pi-trash" style="font-size: 0.85rem"></i>
                  </button>
                  }
                </div>
              </div>
              }
            </div>
          </div>
          }

          <!-- Tareas completadas -->
          @if (completedTodos().length > 0) {
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <i class="pi pi-check-circle text-green-500" style="font-size: 0.75rem"></i>
              Completadas ({{ completedTodos().length }})
            </h3>
            <div class="space-y-2">
              @for (todo of completedTodos(); track todo.id) {
              <div
                class="group flex items-center gap-3 p-3 bg-green-50 rounded-lg transition-colors"
              >
                <!-- Checkbox -->
                <button
                  type="button"
                  (click)="toggleTodo(todo)"
                  class="shrink-0 w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center transition-colors cursor-pointer hover:bg-green-600"
                >
                  <i class="pi pi-check text-white" style="font-size: 0.7rem"></i>
                </button>

                <!-- Contenido principal -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start gap-6">
                    <!-- Título -->
                    <p class="text-sm font-medium text-gray-500 line-through">{{ todo.title }}</p>

                    <!-- Badge asignado (pegado al título) -->
                    @if (todo.assigned_to) {
                    <span
                      class="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs"
                    >
                      <i class="pi pi-user" style="font-size: 0.6rem"></i>
                      {{ getParticipantName(todo.assigned_to) }}
                    </span>
                    }
                  </div>

                  <!-- Detalles -->
                  @if (todo.details) {
                  <p class="text-xs text-gray-400 mt-0.5 line-through">{{ todo.details }}</p>
                  }
                </div>

                <!-- Botón eliminar -->
                <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    (click)="deleteTodo(todo)"
                    class="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-100 rounded transition-colors cursor-pointer"
                    title="Eliminar tarea"
                  >
                    <i class="pi pi-trash" style="font-size: 0.75rem"></i>
                  </button>
                </div>
              </div>
              }
            </div>
          </div>
          }
        </div>
        }
      </div>

      <!-- Formulario fijo abajo -->
      <div class="shrink-0 border-t border-gray-200 bg-white">
        <div class="p-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Agregar nueva tarea</h3>

          <form (submit)="addTodo($event)" class="space-y-3">
            <!-- Input de título -->
            <div class="flex gap-2">
              <input
                type="text"
                [(ngModel)]="newTodoTitle"
                name="newTodoTitle"
                placeholder="Título de la tarea"
                required
                [disabled]="isAdding()"
                class="flex-1 px-3 py-2 border bg-gray-50 border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 placeholder-gray-400 rounded-lg text-sm disabled:bg-gray-100"
              />
              <!-- Asignar participante -->
              <select
                [(ngModel)]="newTodoAssignee"
                name="newTodoAssignee"
                class="min-w-32 px-3 py-2 border bg-gray-50 border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 rounded-lg text-sm cursor-pointer"
              >
                <option value="">Sin asignar</option>
                @for (participant of participants(); track participant.user_id) {
                <option [value]="participant.user_id">{{ participant.fullName }}</option>
                }
              </select>
              <button
                type="submit"
                [disabled]="isAdding() || !newTodoTitle"
                class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              >
                @if (isAdding()) {
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Agregando...</span>
                } @else {
                <span>Agregar</span>
                }
              </button>
            </div>

            <div class="space-y-3 pt-2">
              <!-- Detalles -->
              <textarea
                [(ngModel)]="newTodoDetails"
                name="newTodoDetails"
                placeholder="Detalles adicionales (opcional)"
                rows="2"
                class="w-full px-3 py-2 border bg-gray-50 border-gray-100 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 placeholder-gray-400 rounded-lg text-sm resize-none"
              ></textarea>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class ChecklistModalComponent implements OnInit {
  private todoService = inject(TripTodoService);
  private participantService = inject(TripParticipantService);
  private notificationService = inject(NotificationService);
  private widgetModalService = inject(WidgetModalService);
  private confirmModalService = inject(ConfirmModalService);

  todos = signal<TripTodo[]>([]);
  participants = signal<ParticipantWithUser[]>([]);
  isLoading = signal(false);
  isAdding = signal(false);
  private isFirstLoad = signal(true);

  // Estado de edición
  editingTask = signal<string | null>(null);
  editTitle = '';
  editDetails = '';
  editAssignee = '';

  // Formulario de nueva tarea
  newTodoTitle = '';
  newTodoDetails = '';
  newTodoAssignee = '';

  /**
   * Computed: Tareas pendientes
   */
  pendingTodos = computed(() => {
    return this.todos().filter((t) => t.status !== 'completed');
  });

  /**
   * Computed: Tareas completadas
   */
  completedTodos = computed(() => {
    return this.todos().filter((t) => t.status === 'completed');
  });

  async ngOnInit() {
    const tripId = this.widgetModalService.tripId();
    if (tripId) {
      await this.loadData(tripId);
    }
  }

  /**
   * Carga tareas y participantes
   * Solo muestra loading en la primera carga
   */
  private async loadData(tripId: string, showLoading: boolean = true): Promise<void> {
    try {
      // Solo mostrar loading si es la primera carga Y showLoading es true
      if (this.isFirstLoad() && showLoading) {
        this.isLoading.set(true);
      }

      const [todos, participants] = await Promise.all([
        this.todoService.getTripTodos(tripId),
        this.participantService.getParticipants(tripId),
      ]);

      this.todos.set(todos);
      this.participants.set(participants);

      // Marcar que ya no es la primera carga
      this.isFirstLoad.set(false);
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.notificationService.error(error.message || 'No se pudieron cargar los datos');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Inicia el modo de edición de una tarea
   */
  startEdit(todo: TripTodo): void {
    this.editingTask.set(todo.id);
    this.editTitle = todo.title;
    this.editDetails = todo.details || '';
    this.editAssignee = todo.assigned_to || '';
  }

  /**
   * Cancela el modo de edición
   */
  cancelEdit(): void {
    this.editingTask.set(null);
    this.editTitle = '';
    this.editDetails = '';
    this.editAssignee = '';
  }

  /**
   * Guarda los cambios de la edición
   */
  async saveEdit(todo: TripTodo): Promise<void> {
    const title = this.editTitle.trim();
    if (!title) {
      this.notificationService.warning('El título no puede estar vacío');
      return;
    }

    try {
      await this.todoService.updateTodo(todo.id, {
        title,
        details: this.editDetails.trim() || undefined,
        assigned_to: this.editAssignee || undefined,
      });

      this.notificationService.success('Tarea actualizada correctamente');
      this.cancelEdit();

      const tripId = this.widgetModalService.tripId();
      if (tripId) {
        // Recargar sin mostrar loading
        await this.loadData(tripId, false);
      }
    } catch (error: any) {
      console.error('Error updating todo:', error);
      this.notificationService.error(error.message || 'No se pudo actualizar la tarea');
    }
  }

  /**
   * Marca/desmarca una tarea como completada
   */
  async toggleTodo(todo: TripTodo): Promise<void> {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';

    try {
      await this.todoService.updateTodo(todo.id, { status: newStatus });

      const tripId = this.widgetModalService.tripId();
      if (tripId) {
        // Recargar sin mostrar loading
        await this.loadData(tripId, false);
      }
    } catch (error: any) {
      console.error('Error updating todo:', error);
      this.notificationService.error(error.message || 'No se pudo actualizar la tarea');
    }
  }

  /**
   * Elimina una tarea
   */
  async deleteTodo(todo: TripTodo): Promise<void> {
    this.confirmModalService.open(
      'Eliminar tarea',
      `¿Estás seguro de que quieres eliminar "${todo.title}"?`,
      async () => {
        try {
          await this.todoService.deleteTodo(todo.id);
          this.notificationService.success('Tarea eliminada correctamente');

          const tripId = this.widgetModalService.tripId();
          if (tripId) {
            // Recargar sin mostrar loading
            await this.loadData(tripId, false);
          }
        } catch (error: any) {
          console.error('Error deleting todo:', error);
          this.notificationService.error(error.message || 'No se pudo eliminar la tarea');
        }
      },
      'Eliminar'
    );
  }

  /**
   * Agrega una nueva tarea
   */
  async addTodo(event: Event): Promise<void> {
    event.preventDefault();

    const tripId = this.widgetModalService.tripId();
    if (!this.newTodoTitle || !tripId) return;

    this.isAdding.set(true);

    try {
      await this.todoService.createTodo({
        tripId,
        title: this.newTodoTitle.trim(),
        details: this.newTodoDetails.trim() || undefined,
        assigned_to: this.newTodoAssignee || undefined,
        status: 'pending',
      });

      this.notificationService.success('Tarea agregada correctamente');
      this.newTodoTitle = '';
      this.newTodoDetails = '';
      this.newTodoAssignee = '';

      // Recargar sin mostrar loading
      await this.loadData(tripId, false);
    } catch (error: any) {
      console.error('Error creating todo:', error);
      this.notificationService.error(error.message || 'No se pudo agregar la tarea');
    } finally {
      this.isAdding.set(false);
    }
  }

  /**
   * Obtiene el nombre de un participante por su ID
   */
  getParticipantName(userId: string): string {
    const participant = this.participants().find((p) => p.user_id === userId);
    return participant?.fullName || 'Sin asignar';
  }
}
