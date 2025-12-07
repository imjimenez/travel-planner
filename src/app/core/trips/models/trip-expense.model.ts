import type { Tables } from '@core/supabase/supabase.types';

/**
 * Modelo de gasto (expense)
 */
export type Expense = Tables<'expense'>;

/**
 * Categorías disponibles para los gastos
 */
export const EXPENSE_CATEGORIES = [
  'Transporte',
  'Alojamiento',
  'Comida',
  'Actividades',
  'Compras',
  'Otros',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/**
 * Gasto con información del usuario que lo creó
 */
export interface ExpenseWithUser extends Expense {
  userFullName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

/**
 * Estadísticas de gastos de un viaje
 */
export interface ExpenseStats {
  /** Total gastado en el viaje por todos los participantes */
  totalExpenses: number;
  /** Total gastado por el usuario actual */
  userTotalExpenses: number;
  /** Importe que le deben al usuario actual (puede ser 0 si no le deben nada) */
  amountOwedToUser: number;
  /** Número total de gastos registrados */
  totalExpenseCount: number;
  /** Número de participantes en el viaje */
  participantCount: number;
  /** Gasto promedio por participante */
  averagePerParticipant: number;
}
