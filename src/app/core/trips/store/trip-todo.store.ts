import { effect, inject } from "@angular/core";
import {
	patchState,
	signalStore,
	withHooks,
	withMethods,
	withProps,
	withState,
} from "@ngrx/signals";
import type { CreateTodoData, TripTodo, UpdateTodoData } from "../models";
import { TripTodoService } from "../services";
import { TripStore } from "./trips.store";

type TripTodosState = {
	isLoading: boolean;
	todos: TripTodo[];
};

const initialState: TripTodosState = {
	isLoading: false,
	todos: [],
};

export const TripTodoStore = signalStore(
	{ providedIn: "root" },
	withState(initialState),
	withProps(() => ({
		selectedTrip: inject(TripStore).selectedTrip,
	})),
	withMethods((store, todoService = inject(TripTodoService)) => ({
		loadTodos: async () => {
			patchState(store, { isLoading: true });
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				const todos = await todoService.getTripTodos(trip.id);
				patchState(store, { todos });
			} finally {
				patchState(store, { isLoading: false });
			}
		},
		createTodoForSelectedTrip: async (data: Omit<CreateTodoData, "tripId">) => {
			patchState(store, { isLoading: true });
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				const todo = await todoService.createTodo({
					...data,
					tripId: trip.id,
				});
				patchState(store, { todos: [...store.todos(), todo] });
			} finally {
				patchState(store, { isLoading: false });
			}
		},
		updateTodo: async (todoId: string, updates: UpdateTodoData) => {
			patchState(store, { isLoading: true });
			try {
				const updatedTodo = await todoService.updateTodo(todoId, updates);
				patchState(store, {
					todos: store.todos().map((t) => (t.id === todoId ? updatedTodo : t)),
				});
			} finally {
				patchState(store, { isLoading: false });
			}
		},
		deleteTodoFromSelectedTrip: async (todoId: string) => {
			patchState(store, { isLoading: true });
			const trip = store.selectedTrip();
			if (!trip) return;
			try {
				await todoService.deleteTodo(todoId);
				patchState(store, {
					todos: store.todos().filter((t) => t.id !== todoId),
				});
			} finally {
				patchState(store, { isLoading: false });
			}
		},
	})),
	withHooks((store) => ({
		onInit() {
			effect(() => {
				if (store.selectedTrip()) {
					store.loadTodos();
				} else {
					patchState(store, initialState);
				}
			});
		},
	})),
);
