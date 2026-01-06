// src/app/features/trips/components/expenses/expenses.component.ts
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmModalService } from '@core/dialog/confirm-modal.service';
import { NotificationService } from '@core/notifications/notification.service';
import {
    EXPENSE_CATEGORIES,
    type ExpenseCategory,
    type ExpenseWithUser
} from '@core/trips';
import { TripExpenseStore } from '@core/trips/store/trip-expense.store';

/**
 * Componente para gestionar gastos de un viaje
 *
 * Muestra:
 * - Estadísticas de gastos (mis gastos, me deben/debo, total)
 * - Lista de todos los gastos del viaje
 * - Formulario para añadir nuevos gastos (fijo en la parte inferior)
 *
 * Permisos:
 * - Todos los participantes pueden añadir gastos
 * - El owner puede eliminar y editar cualquier gasto
 * - Los usuarios solo pueden eliminar y editar sus propios gastos
 */
@Component({
  selector: 'app-expenses',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <div class="h-full flex flex-col ">
      <!-- Loading state -->
      @if (isLoading()) {
      <div class="flex flex-col gap-4 items-center justify-center h-full">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p class="text-gray-500">Cargando gastos...</p>
      </div>
      }

      <!-- Content -->
      @if (!isLoading()) {
      <!-- Contenido scrolleable -->
      <div class="flex-1 overflow-y-auto pt-6 lg:pt-10 lg:px-4">
        @if (expenses().length === 0) {
        <!-- Empty state -->
        <div class="flex flex-col items-center justify-center h-full w-full text-center">
          <div class="max-w-md">
            <i class="pi pi-wallet" style="font-size: 3.5rem; padding: 1.5rem"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Gestiona tus gastos</h3>
            <p class="text-sm text-gray-500 mb-6">
              Registra gastos compartidos y mantén un control del presupuesto
            </p>
          </div>
        </div>
        } @else {
        <!-- Stats cards -->
        <div class="flex justify-around mb-4 lg:mb-10">
          <!-- Mis gastos -->
          <div class="flex flex-col justify-center items-center p-4">
            <p class="text-sm text-gray-600 mb-1 text-nowrap">Mis gastos</p>
            <p class="text-md lg:text-2xl font-semibold text-gray-900">
              {{ (stats().userTotalExpenses || 0) | currency:'EUR':'symbol':'1.2-2' }}
            </p>
          </div>

          <!-- Me deben / Debo -->
          <div class="flex flex-col justify-center items-center p-4">
            <p class="text-sm text-gray-600 mb-1 text-nowrap">{{ balanceLabel() }}</p>
            <p class="text-md lg:text-2xl font-semibold" [class]="balanceColor()">
              {{ balanceAmount() | currency:'EUR':'symbol':'1.2-2' }}
            </p>
          </div>

          <!-- Gasto total -->
          <div class="flex flex-col justify-center items-center p-4">
            <p class="text-sm text-gray-600 mb-1 text-nowrap">Gasto total</p>
            <p class="text-md lg:text-2xl font-semibold text-gray-900">
              {{ (stats().totalExpenses || 0) | currency:'EUR':'symbol':'1.2-2' }}
            </p>
          </div>
        </div>

        <!-- Lista de gastos -->
        <div class="space-y-3">
          @for (expense of expenses(); track expense.id) {
          <div
            class="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all"
            (mouseenter)="hoveredExpenseId.set(expense.id)"
            (mouseleave)="hoveredExpenseId.set(null)"
          >
            @if (editingExpense() === expense.id) {
            <!-- MODO EDICIÓN -->
            <div class="space-y-2">
              <div class="flex-col lg:flex-row items-center gap-3">
                <!-- Input título -->
                <input
                  type="text"
                  [(ngModel)]="editTitle"
                  class="flex-1 w-full lg:w-5xl px-2 py-1 text-sm border mb-2 lg:mb-0 lg:mr-10 border-gray-300 rounded focus:border-green-600 focus:outline-none placeholder-gray-400"
                  placeholder="Nombre del gasto"
                />
                <!-- Input importe -->
                <input
                  type="number"
                  [(ngModel)]="editAmount"
                  step="0.01"
                  min="0.01"
                  class="w-full lg:w-32 px-2 py-1 mb-2 lg:mb-0 lg:mr-10 text-sm border border-gray-300 rounded focus:border-green-600 focus:outline-none"
                  placeholder="Importe"
                />
                <!-- Select categoría -->
                <select
                  [(ngModel)]="editCategory"
                  class="w-full lg:w-40 px-2 py-1 text-sm border border-gray-300 rounded focus:border-green-600 focus:outline-none cursor-pointer"
                >
                  @for (category of categories; track category) {
                  <option [value]="category">{{ category }}</option>
                  }
                </select>
              </div>

              <!-- Botones de edición -->
              <div class="flex items-center justify-end gap-1 pt-1 lg:pt-0">
                <button
                  type="button"
                  (click)="saveEdit(expense)"
                  class="w-full lg:w-7 h-7 flex items-center justify-center gap-2 text-green-600 hover:bg-green-100 rounded transition-colors cursor-pointer"
                  title="Guardar cambios"
                >
                  <i class="pi pi-check" style="font-size: 0.85rem"></i>
                  <p class="flex lg:hidden">Guardar</p>
                </button>
                <button
                  type="button"
                  (click)="cancelEdit()"
                  class="w-full lg:w-7 h-7 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                  title="Cancelar"
                >
                  <i class="pi pi-times" style="font-size: 0.85rem"></i>
                  <p class="flex lg:hidden">Cancelar</p>
                </button>
              </div>
            </div>
            } @else {
            <!-- MODO VISTA -->
            <div class="flex items-center justify-between">
              <!-- Info del gasto -->
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 mb-0.5">{{ expense.title }}</h4>
                <div class="flex items-center gap-2 text-xs text-gray-600">
                  <span>
                    Pagado por
                    <strong class="font-medium">{{ expense.user_full_name || expense.user_email }}</strong>
                  </span>
                  @if (expense.category) {
                  <span class="text-gray-400">•</span>
                  <span class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs">
                    {{ expense.category }}
                  </span>
                  }
                </div>
              </div>

              <!-- Importe y botones -->
              <div class="flex items-center gap-3">
                <div class="flex-col gap-2 pl-4">
                  <p class="text-lg font-semibold text-gray-900">
                    {{ expense.amount | currency:'EUR':'symbol':'1.2-2' }}
                  </p>
                  @if (expense.is_editable) {
                  <div class="flex lg:hidden items-center gap-1 p-1">
                    <button
                      type="button"
                      (click)="startEdit(expense)"
                      class="flex items-center justify-center w-7 h-7 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                      title="Editar gasto"
                    >
                      <i class="pi pi-pencil" style="font-size: 0.75rem"></i>
                    </button>
                    <button
                      type="button"
                      (click)="deleteExpense(expense.id)"
                      class="flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-100 rounded-lg mr-1.5 cursor-pointer"
                      title="Eliminar gasto"
                    >
                      <i class="pi pi-trash" style="font-size: 0.875rem"></i>
                    </button>
                  </div>
                  }
                </div>

                <!-- Botones de acción (solo visible en hover si tiene permisos) -->
                @if (hoveredExpenseId() === expense.id && expense.is_editable) {
                <div
                  class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    type="button"
                    (click)="startEdit(expense)"
                    class="flex items-center justify-center w-7 h-7 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                    title="Editar gasto"
                  >
                    <i class="pi pi-pencil" style="font-size: 0.75rem"></i>
                  </button>
                  <button
                    type="button"
                    (click)="deleteExpense(expense.id)"
                    class="flex items-center justify-center w-7 h-7 text-red-600 hover:bg-red-100 rounded-lg mr-1.5 cursor-pointer"
                    title="Eliminar gasto"
                  >
                    <i class="pi pi-trash" style="font-size: 0.875rem"></i>
                  </button>
                </div>
                }
              </div>
            </div>
            }
          </div>
          }
        </div>
        }
      </div>

      }
      <!-- Formulario fijo en la parte inferior -->

      <div class="w-full py-4 border-t border-gray-200">
        <form (submit)="addExpense($event)" class="w-full flex flex-col gap-3">
          <!-- Grupo de inputs (en línea desde tablet) -->
          <div class="flex flex-col md:flex-row gap-3">
            <!-- Título del gasto -->
            <input
              type="text"
              [(ngModel)]="newExpense.title"
              name="title"
              placeholder="Nombre del gasto"
              class="flex-1 px-4 py-3 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 border border-gray-300 rounded-lg focus:outline-none placeholder-gray-500"
              required
            />

            <!-- Importe -->
            <input
              type="number"
              [(ngModel)]="newExpense.amount"
              name="amount"
              placeholder="Importe"
              step="0.01"
              min="0.01"
              class="flex-1 px-4 py-3 outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 border border-gray-300 rounded-lg focus:outline-none"
              required
            />

            <!-- Categoría -->
            <select
              [(ngModel)]="newExpense.category"
              name="category"
              class="flex-1 md:max-w-60 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-transparent focus:border-green-600 transition-all text-gray-900 border border-gray-300 rounded-lg focus:outline-none"
              required
            >
              <option value="" disabled selected>Categoría</option>
              @for (category of categories; track category) {
              <option [value]="category">{{ category }}</option>
              }
            </select>
          </div>

          <!-- Botón añadir (full width en tablet, auto en desktop) -->
          <button
            type="submit"
            [disabled]="isSubmitting()"
            class="w-full lg:w-auto lg:self-end px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Añadir gasto
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ExpensesComponent {
  readonly #tripExpenseStore = inject(TripExpenseStore);

  private notificationService = inject(NotificationService);
  private confirmModalService = inject(ConfirmModalService);

  // Signals del servicio
  expenses = this.#tripExpenseStore.expenses;
  stats = this.#tripExpenseStore.stats;
  isLoading = this.#tripExpenseStore.isLoading;

  // Signals locales
  isSubmitting = signal(false);
  hoveredExpenseId = signal<string | null>(null);

  // Estado de edición
  editingExpense = signal<string | null>(null);
  editTitle = '';
  editAmount: number | null = null;
  editCategory: ExpenseCategory | '' = '';

  // Categorías disponibles
  categories = EXPENSE_CATEGORIES;

  // Datos del nuevo gasto
  newExpense = {
    title: '',
    amount: null as number | null,
    category: '' as ExpenseCategory | '',
  };

  // Computed para saber si el usuario actual es owner
  private currentUserId = signal<string | null>(null);
  private isOwner = signal(false);

  /**
   * Computed para determinar si debemos o nos deben dinero
   */
  balanceLabel = computed(() => {
    const currentStats = this.stats();
    if (!currentStats) return 'Me deben';

    const userPaid = currentStats.userTotalExpenses;
    const shouldPay = currentStats.averagePerParticipant;

    return userPaid >= shouldPay ? 'Me deben' : 'Debo';
  });

  /**
   * Computed para obtener la cantidad de balance (positiva siempre)
   */
  balanceAmount = computed(() => {
    const currentStats = this.stats();
    if (!currentStats) return 0;

    const userPaid = currentStats.userTotalExpenses;
    const shouldPay = currentStats.averagePerParticipant;

    return Math.abs(userPaid - shouldPay);
  });

  /**
   * Computed para el color del balance
   */

  balanceColor = computed(() => {
    const amount = this.balanceAmount();
    const label = this.balanceLabel();

    if (amount === 0) {
      return 'text-gray-900';
    }

    return label === 'Me deben' ? 'text-green-600' : 'text-red-600';
  });

  /**
   * Inicia el modo de edición de un gasto
   */
  startEdit(expense: ExpenseWithUser): void {
    this.editingExpense.set(expense.id);
    this.editTitle = expense.title;
    this.editAmount = expense.amount;
    this.editCategory = (expense.category || 'Transporte') as ExpenseCategory;
  }

  /**
   * Cancela el modo de edición
   */
  cancelEdit(): void {
    this.editingExpense.set(null);
    this.editTitle = '';
    this.editAmount = null;
    this.editCategory = '';
  }

  /**
   * Guarda los cambios de la edición
   */
  async saveEdit(expense: ExpenseWithUser): Promise<void> {
    const title = this.editTitle.trim();
    if (!title) {
      this.notificationService.warning('El título no puede estar vacío');
      return;
    }

    if (!this.editAmount || this.editAmount <= 0) {
      this.notificationService.warning('El importe debe ser mayor que 0');
      return;
    }

    if (!this.editCategory) {
      this.notificationService.warning('Selecciona una categoría');
      return;
    }

    try {
      await this.#tripExpenseStore.updateExpense(expense.id, {
        title,
        amount: this.editAmount,
        category: this.editCategory as ExpenseCategory,
      });

      this.notificationService.success('Gasto actualizado correctamente');
      this.cancelEdit();
    } catch (error) {
      console.error('Error updating expense:', error);
      this.notificationService.error(error instanceof Error ? error.message : 'No se pudo actualizar el gasto');
    }
  }

  /**
   * Añade un nuevo gasto
   */
  async addExpense(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.newExpense.title?.trim() || !this.newExpense.amount || !this.newExpense.category) {
      this.notificationService.warning('Completa todos los campos');
      return;
    }

    this.isSubmitting.set(true);

    try {
      await this.#tripExpenseStore.createExpenseForSelectedTrip({
        title: this.newExpense.title.trim(),
        amount: this.newExpense.amount,
        category: this.newExpense.category as ExpenseCategory,
      });

      this.notificationService.success('Gasto añadido correctamente');

      // Limpiar formulario
      this.newExpense = {
        title: '',
        amount: null,
        category: '',
      };
    } catch (error) {
      console.error('Error al añadir gasto:', error);
      this.notificationService.error(error instanceof Error ? error.message : 'Error al añadir el gasto');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Elimina un gasto
   */
  async deleteExpense(expenseId: string): Promise<void> {
    this.confirmModalService.open(
      'Eliminar gasto',
      '¿Estás seguro de que deseas eliminar este gasto?',
      async () => {
        try {
          await this.#tripExpenseStore.deleteExpenseFromSelectedTrip(expenseId);
          this.notificationService.success('Gasto eliminado correctamente');

        } catch (error) {
          console.error('Error al eliminar gasto:', error);
          this.notificationService.error(error instanceof Error ? error.message : 'Error al eliminar el gasto');
        }
      },
      'Eliminar'
    );
  }
}
