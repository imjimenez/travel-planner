// src/app/features/trips/components/expenses/expense-empty-state.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Estado vacío de gastos
 * Se muestra cuando no hay gastos registrados
 */
@Component({
  selector: 'app-expense-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center h-full text-center">
      <div class="max-w-md">
        <i class="pi pi-wallet" style="font-size: 3.5rem; padding: 1.5rem"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Gestiona tus gastos</h3>
        <p class="text-sm text-gray-500 mb-6">
          Registra gastos compartidos y mantén un control del presupuesto
        </p>
        <button
          type="button"
          (click)="addExpenseClicked.emit()"
          class="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors font-medium cursor-pointer"
        >
          Añadir primer gasto
        </button>
      </div>
    </div>
  `,
})
export class ExpenseEmptyStateComponent {
  @Output() addExpenseClicked = new EventEmitter<void>();
}
