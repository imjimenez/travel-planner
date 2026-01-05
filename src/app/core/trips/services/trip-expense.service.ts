import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase.service';
import { AuthService } from '@core/authentication/services/auth.service';
import { TripService } from '@core/trips/services/trip.service';
import { TripParticipantService } from '@core/trips/services/trip-participant.service';
import type { Expense, ExpenseWithUser, ExpenseStats, ExpenseCategory } from '../models';
import type { TablesInsert, TablesUpdate } from '@core/supabase/supabase.types';

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

  // Signal que guarda la lista de gastos de un viaje
  private expensesSignal = signal<ExpenseWithUser[]>([]);
  expenses = this.expensesSignal.asReadonly();

  private currentTripIdSignal = signal<string | null>(null);
  currentTripId = this.currentTripIdSignal.asReadonly();

  // Signal de estado de carga
  private loadingSignal = signal(false);
  isLoading = this.loadingSignal.asReadonly();

  // Signal para estadísticas
  private statsSignal = signal<ExpenseStats | null>(null);
  stats = this.statsSignal.asReadonly();

  /**
   * Carga todos los gastos de un viaje y actualiza el signal
   *
   * @param tripId - ID del viaje
   * @param showLoading - Si se debe mostrar el spinner (por defecto true)
   */
  async loadExpenses(tripId: string, showLoading: boolean = true): Promise<void> {
    this.currentTripIdSignal.set(tripId);

    if (showLoading) {
      this.loadingSignal.set(true);
      this.expensesSignal.set([]);
    }

    try {
      const expenses = await this.getExpenses(tripId);
      this.expensesSignal.set(expenses);

      // Calcular y actualizar estadísticas
      const stats = await this.calculateStats(tripId);
      this.statsSignal.set(stats);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      this.expensesSignal.set([]);
      this.statsSignal.set(null);
      throw error;
    } finally {
      if (showLoading) {
        this.loadingSignal.set(false);
      }
    }
  }

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
    const { data: expenses, error } = await this.supabaseService.client
      .from('expense')
      .select('*')
      .eq('trip_id', tripId)
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

    // Mapear gastos con información del usuario
    return expenses.map((expense): ExpenseWithUser => {
      const userInfo = usersMap.get(expense.user_id || '');
      return {
        ...expense,
        userFullName: userInfo?.full_name || 'Usuario',
        userEmail: userInfo?.email || undefined,
        userAvatarUrl: userInfo?.avatar_url || undefined,
      };
    });
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
  ): Promise<Expense> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verifica membresía
    await this.verifyMembership(tripId, user.id);

    // Validar datos
    if (!expenseData.title?.trim()) {
      throw new Error('El título del gasto es obligatorio');
    }

    if (expenseData.amount <= 0) {
      throw new Error('El importe debe ser mayor que 0');
    }

    const newExpense: TablesInsert<'expense'> = {
      trip_id: tripId,
      user_id: user.id,
      title: expenseData.title.trim(),
      amount: expenseData.amount,
      category: expenseData.category,
    };

    const { data, error } = await this.supabaseService.client
      .from('expense')
      .insert(newExpense)
      .select()
      .single();

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
   * Calcula las estadísticas de gastos de un viaje
   *
   * @param tripId - ID del viaje
   * @returns Estadísticas completas de gastos
   */
  async calculateStats(tripId: string): Promise<ExpenseStats> {
    const user = await this.authService.getAuthUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Verifica membresía
    await this.verifyMembership(tripId, user.id);

    // Obtener todos los gastos
    const { data: expenses, error: expensesError } = await this.supabaseService.client
      .from('expense')
      .select('*')
      .eq('trip_id', tripId);

    if (expensesError) {
      throw new Error(`Error al obtener gastos: ${expensesError.message}`);
    }

    // Obtener participantes y contar desde el resultado (reutiliza la llamada que ya bypasea RLS)
    const participants = await this.participantService.loadParticipantsByTripId(tripId);
    const participantCount = participants.length;

    console.log('🔍 DEBUG - Cálculo de estadísticas:');
    console.log('Usuario actual:', user.id);
    console.log('Gastos encontrados:', expenses?.length || 0);
    console.log('Participantes en el viaje:', participantCount);
    console.log(
      'Lista de participantes:',
      participants.map((p) => ({ user_id: p.user_id, name: p.fullName }))
    );

    if (participantCount === 0) {
      throw new Error('No hay participantes en el viaje');
    }

    // Calcular totales
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const userTotalExpenses =
      expenses?.filter((e) => e.user_id === user.id).reduce((sum, e) => sum + e.amount, 0) || 0;

    // Calcular cuánto debería pagar cada participante
    const averagePerParticipant = totalExpenses / participantCount;

    // Calcular cuánto le deben al usuario actual
    // Si pagó más de su parte, le deben la diferencia
    // Si pagó menos, debe dinero (retornamos 0 en ese caso)
    const amountOwedToUser = Math.max(0, userTotalExpenses - averagePerParticipant);

    console.log('Total gastos:', totalExpenses);
    console.log('Mis gastos:', userTotalExpenses);
    console.log('Promedio por participante:', averagePerParticipant);
    console.log('Me deben:', amountOwedToUser);
    console.log(
      'Detalle gastos:',
      expenses?.map((e) => ({ user_id: e.user_id, amount: e.amount }))
    );

    return {
      totalExpenses,
      userTotalExpenses,
      amountOwedToUser,
      totalExpenseCount: expenses?.length || 0,
      participantCount,
      averagePerParticipant,
    };
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
        userFullName: userInfo?.full_name || 'Usuario',
        userEmail: userInfo?.email || undefined,
        userAvatarUrl: userInfo?.avatar_url || undefined,
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
