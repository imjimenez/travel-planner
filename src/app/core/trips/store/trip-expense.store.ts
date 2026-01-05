import { computed, effect, inject } from "@angular/core";
import { AuthService } from "@core/authentication";
import { NotificationService } from "@core/notifications/notification.service";
import {
	patchState,
	signalStore,
	withComputed,
	withHooks,
	withMethods,
	withProps,
	withState,
} from "@ngrx/signals";
import type { Expense, ExpenseCategory, ExpenseWithUser } from "../models";
import { ExpenseService } from "../services";
import { TripStore } from "./trips.store";

type TripExpenseState = {
	isLoading: boolean;
	expenses: ExpenseWithUser[];
};

const initialState: TripExpenseState = {
	isLoading: false,
	expenses: [],
};

export const TripExpenseStore = signalStore(
	withState(initialState),
	withProps(() => ({
		selectedTrip: inject(TripStore).selectedTrip,
	})),
	withComputed((store, auth = inject(AuthService)) => ({
		stats: computed(() => {
			const expenses = store.expenses();
			const { participants, totalExpenses, userTotalExpenses } =
				expenses.reduce(
					(acc, { user_id, amount }) => ({
						participants:
							!user_id || acc.participants.includes(user_id)
								? acc.participants
								: acc.participants.concat(user_id),
						totalExpenses: acc.totalExpenses + amount,
						userTotalExpenses:
							acc.userTotalExpenses +
							(user_id === auth.currentUser?.id ? amount : 0),
					}),
					{
						participants: <string[]>[],
						totalExpenses: 0,
						userTotalExpenses: 0,
					},
				);
			const participantCount = participants.length;

			// Calcular cuánto debería pagar cada participante
			const averagePerParticipant = totalExpenses / participantCount;

			// Calcular cuánto le deben al usuario actual
			// Si pagó más de su parte, le deben la diferencia
			// Si pagó menos, debe dinero (retornamos 0 en ese caso)
			const amountOwedToUser = Math.max(
				0,
				userTotalExpenses - averagePerParticipant,
			);

			return {
				totalExpenses,
				userTotalExpenses,
				amountOwedToUser,
				totalExpenseCount: expenses.length ?? 0,
				participantCount,
				averagePerParticipant,
			};
		}),
	})),
	withMethods(
		(
			store,
			expenseService = inject(ExpenseService),
			notificationService = inject(NotificationService),
		) => ({
			async loadExpenses() {
				const selectedTrip = store.selectedTrip();
				if (!selectedTrip) return;
				patchState(store, { isLoading: true });
				try {
					const expenses = await expenseService.getExpenses(selectedTrip.id);
					patchState(store, { isLoading: false, expenses });
				} catch (error) {
					console.error(error);
					notificationService.error(
						"Se ha producido un error al cargar los gastos",
					);
				} finally {
					patchState(store, { isLoading: false });
				}
			},
			async createExpenseForSelectedTrip(expense: {
				title: string;
				amount: number;
				category: ExpenseCategory;
			}) {
				const selectedTrip = store.selectedTrip();
				if (!selectedTrip) return;
				patchState(store, { isLoading: true });
				try {
					const createdExpense = await expenseService.createExpense(
						selectedTrip.id,
						expense,
					);
					patchState(store, {
						expenses: [...store.expenses(), createdExpense],
					});
				} catch (error) {
					console.error(error);
					notificationService.error(
						"Se ha producido un error al crear el gasto",
					);
				} finally {
					patchState(store, { isLoading: false });
				}
			},
			async updateExpense(
				expenseId: string,
				updates: {
					title?: string;
					amount?: number;
					category?: ExpenseCategory;
				},
			) {
				const selectedTrip = store.selectedTrip();
				if (!selectedTrip) return;
				patchState(store, { isLoading: true });
				try {
					await expenseService.updateExpense(expenseId, updates);
					patchState(store, {
						expenses: [
							...store
								.expenses()
								.map((expense) =>
									expense.id === expenseId
										? { ...expense, ...updates }
										: expense,
								),
						],
					});
				} catch (error) {
					console.error(error);
					notificationService.error(
						"Se ha producido un error al actualizar el gasto",
					);
				} finally {
					patchState(store, { isLoading: false });
				}
			},
			async deleteExpenseFromSelectedTrip(expenseId: string) {
				const selectedTrip = store.selectedTrip();
				if (!selectedTrip) return;
				patchState(store, { isLoading: true });
				try {
					await expenseService.deleteExpense(selectedTrip.id, expenseId);
					patchState(store, {
						expenses: store
							.expenses()
							.filter((expense) => expense.id !== expenseId),
					});
				} catch (error) {
					console.error(error);
					notificationService.error(
						"Se ha producido un error al eliminar el gasto",
					);
				} finally {
					patchState(store, { isLoading: false });
				}
			},
		}),
	),
	withHooks((store) => ({
		onInit() {
			effect(() => {
				if (store.selectedTrip()) {
					store.loadExpenses();
				} else {
					patchState(store, initialState);
				}
			});
		},
	})),
);
