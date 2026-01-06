import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/authentication/services/auth.service';
import { SupabaseService } from '@core/supabase/supabase.service';
import type { TablesUpdate } from '@core/supabase/supabase.types';
import { TripParticipantService } from '@core/trips/services/trip-participant.service';
import { TripService } from '@core/trips/services/trip.service';
import type { Expense, ExpenseCategory, ExpenseWithUser } from '../models';

/**
 * Servicio para gestión de gastos de viajes
 *
 * Permite:
 * - Crear, listar, actualizar y eliminar gastos
 * - Obtener estadísticas de gastos (total, por usuario, deudas)
 * - Filtrar gastos por categoría
 *
 * Permisos:
 * - Todos los participantes pueden añadir gastos
 * - El owner puede eliminar y editar cualquier gasto
 * - Los usuarios solo pueden eliminar y editar sus propios gastos
 * - Cualquier participante puede ver todos los gastos del viaje
 *
 */
@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private tripService = inject(TripService);
  private participantService = inject(TripParticipantService);


  /**
   * Obtiene todos los gastos de un viaje con información del usuario que los creó
   *
   * @param tripId - ID del viaje
   * @returns Lista de gastos con información del usuario
   * @throws Error si el usuario no está autenticado o no es miembro del viaje
   */
  async getExpenses(tripId: string): Promise<ExpenseWithUser[]> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verifica membresía
    await this.verifyMembership(tripId, user.id);

    // Obtener gastos del viaje
    const { data: expenses = [], error } = await this.supabaseService.client.rpc('get_expenses_with_user_and_editability', { p_trip_id: tripId });

    if (error) {
      throw new Error(`Error al obtener gastos: ${error.message}`);
    }

    return expenses ?? [];
  }

  /**
   * Crea un nuevo gasto
   *
   * El gasto se asocia automáticamente al usuario autenticado actual.
   *
   * @param tripId - ID del viaje
   * @param expenseData - Datos del gasto (título, cantidad, categoría)
   * @returns El gasto creado
   * @throws Error si el usuario no está autenticado o no es miembro del viaje
   *
   * @example
   * await expenseService.createExpense('trip-123', {
   *   title: 'Cena en restaurante',
   *   amount: 45.50,
   *   category: 'Comida'
   * });
   */
  async createExpense(
    tripId: string,
    expenseData: {
      title: string;
      amount: number;
      category: ExpenseCategory;
    }
  ): Promise<ExpenseWithUser> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Validar datos
    if (!expenseData.title?.trim()) {
      throw new Error('El título del gasto es obligatorio');
    }

    if (expenseData.amount <= 0) {
      throw new Error('El importe debe ser mayor que 0');
    }

    const { data, error } = await this.supabaseService.client.rpc('create_expense_with_details', {
      p_trip_id: tripId,
      p_title: expenseData.title.trim(),
      p_amount: expenseData.amount,
      p_category: expenseData.category,
    }).single();

    if (error) {
      throw new Error(`Error al crear gasto: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualiza un gasto existente
   *
   * Permisos:
   * - El owner del viaje puede actualizar cualquier gasto
   * - Los usuarios solo pueden actualizar sus propios gastos
   *
   * @param expenseId - ID del gasto
   * @param updates - Campos a actualizar
   * @throws Error si el usuario no tiene permisos
   */
  async updateExpense(
    expenseId: string,
    updates: {
      title?: string;
      amount?: number;
      category?: ExpenseCategory;
    }
  ): Promise<Expense> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener el gasto para verificar permisos
    const { data: expense, error: fetchError } = await this.supabaseService.client
      .from('expense')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (fetchError || !expense) {
      throw new Error('Gasto no encontrado');
    }

    // Obtener info del trip para verificar si es owner
    const trip = await this.tripService.getTripById(expense.trip_id!);
    const isOwner = user.id === trip.owner_user_id;

    // Verificar permisos: owner puede editar cualquier gasto, otros solo los suyos
    if (!isOwner && expense.user_id !== user.id) {
      throw new Error('No tienes permisos para actualizar este gasto');
    }

    // Validar datos si se proporcionan
    if (updates.title !== undefined && !updates.title.trim()) {
      throw new Error('El título del gasto es obligatorio');
    }

    if (updates.amount !== undefined && updates.amount <= 0) {
      throw new Error('El importe debe ser mayor que 0');
    }

    const updateData: TablesUpdate<'expense'> = {};

    if (updates.title !== undefined) {
      updateData.title = updates.title.trim();
    }
    if (updates.amount !== undefined) {
      updateData.amount = updates.amount;
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }

    const { data, error } = await this.supabaseService.client
      .from('expense')
      .update(updateData)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar gasto: ${error.message}`);
    }

    return data;
  }

  /**
   * Elimina un gasto
   *
   * Permisos:
   * - El owner del viaje puede eliminar cualquier gasto
   * - Los usuarios solo pueden eliminar sus propios gastos
   *
   * @param tripId - ID del viaje
   * @param expenseId - ID del gasto a eliminar
   * @throws Error si el usuario no tiene permisos
   */
  async deleteExpense(tripId: string, expenseId: string): Promise<void> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener info del trip
    const trip = await this.tripService.getTripById(tripId);
    const isOwner = user.id === trip.owner_user_id;

    // Obtener el gasto
    const { data: expense, error: fetchError } = await this.supabaseService.client
      .from('expense')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (fetchError || !expense) {
      throw new Error('Gasto no encontrado');
    }

    // Verificar permisos: owner puede eliminar cualquier gasto, otros solo los suyos
    if (!isOwner && expense.user_id !== user.id) {
      throw new Error('No tienes permisos para eliminar este gasto');
    }

    const { error } = await this.supabaseService.client
      .from('expense')
      .delete()
      .eq('id', expenseId);

    if (error) {
      throw new Error(`Error al eliminar gasto: ${error.message}`);
    }
  }

  /**
   * Obtiene gastos filtrados por categoría
   *
   * @param tripId - ID del viaje
   * @param category - Categoría por la que filtrar
   * @returns Lista de gastos de la categoría especificada
   */
  async getExpensesByCategory(
    tripId: string,
    category: ExpenseCategory
  ): Promise<ExpenseWithUser[]> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verifica membresía
    await this.verifyMembership(tripId, user.id);

    const { data: expenses, error } = await this.supabaseService.client
      .from('expense')
      .select('*')
      .eq('trip_id', tripId)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener gastos: ${error.message}`);
    }

    if (!expenses || expenses.length === 0) {
      return [];
    }

    // Obtener información de los participantes del viaje (reutiliza lógica existente)
    const participants = await this.participantService.loadParticipantsByTripId(tripId);

    // Crear mapa de userId -> info de usuario para búsqueda rápida
    const usersMap = new Map(
      participants.map((p) => [
        p.user_id,
        {
          full_name: p.fullName || 'Usuario',
          email: p.email || undefined,
          avatar_url: p.avatarUrl || undefined,
        },
      ])
    );

    return expenses.map((expense): ExpenseWithUser => {
      const userInfo = usersMap.get(expense.user_id || '');
      return {
        ...expense,
        user_full_name: userInfo?.full_name || 'Usuario',
        user_email: userInfo?.email || '',
        user_avatar_url: userInfo?.avatar_url || 'undefined',
      };
    });
  }

  /**
   * Obtiene el total gastado por categoría
   *
   * @param tripId - ID del viaje
   * @returns Mapa de categoría -> total gastado
   */
  async getTotalByCategory(tripId: string): Promise<Map<string, number>> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verifica membresía
    await this.verifyMembership(tripId, user.id);

    const { data: expenses, error } = await this.supabaseService.client
      .from('expense')
      .select('category, amount')
      .eq('trip_id', tripId);

    if (error) {
      throw new Error(`Error al obtener gastos: ${error.message}`);
    }

    const totals = new Map<string, number>();

    expenses?.forEach((expense) => {
      const category = expense.category || 'Sin categoría';
      const current = totals.get(category) || 0;
      totals.set(category, current + expense.amount);
    });

    return totals;
  }

  /**
   * Verifica que el usuario es miembro del viaje
   *
   * @private
   * @throws Error si el usuario no es miembro
   */
  private async verifyMembership(tripId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('trip_user')
      .select('trip_id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error('No tienes acceso a este viaje');
    }
  }
}
