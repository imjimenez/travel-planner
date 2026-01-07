// src/app/features/trips/components/itinerary/itinerary-detail.component.ts

import { Component, computed, inject } from "@angular/core";
import { DialogService } from "@core/dialog/services/dialog.service";
import type { ItineraryItem, ItineraryItemWithDetails } from "@core/trips";
import { TripItineraryStore } from "@core/trips/store/trip-itinerary.store";
import { MapComponent } from "@shared/components/map/map.component";
import type { MapMarker } from "@shared/components/map/models";
import {
	ItineraryModalComponent,
	ItineraryModalHeader,
} from "./itinerary-modal.component";

/**
 * Grupo de paradas por fecha
 */
interface DateGroup {
	date: string; // YYYY-MM-DD
	items: ItineraryItemWithDetails[];
}

/**
 * Componente para visualizar el itinerario de un viaje
 *
 * Muestra:
 * - Vista dividida: Timeline a la izquierda con paradas agrupadas por fecha
 * - Mapa a la derecha mostrando todas las paradas con markers clicables
 * - Línea de ruta conectando todas las paradas
 * - Sincronización entre lista y mapa (click en uno resalta en el otro)
 *
 * Características:
 * - Click en parada del timeline: resalta en mapa y abre modal view
 * - Click en marker del mapa: resalta en timeline y abre modal view
 * - Línea verde conectando todas las paradas en orden cronológico
 */
@Component({
	selector: "app-itinerary-detail",
	imports: [MapComponent],
	template: `
    <div class="h-full flex flex-col overflow-hidden">
      <!-- Loading state -->
      @if (isLoading()) {
      <div class="flex flex-col gap-4 items-center justify-center h-full">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p class="text-gray-500">Cargando itinerario...</p>
      </div>
      }

      <!-- Content -->
      @if (!isLoading()) { @if (items().length === 0) {
      <!-- Empty state -->
      <div class="flex flex-col items-center justify-center h-full text-center py-4">
        <div class="max-w-md">
          <i class="pi pi-map-marker" style="font-size: 3.5rem; padding: 1.5rem"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Planifica tu itinerario</h3>
          <p class="text-sm text-gray-500 mb-6">
            Añade paradas, lugares de interés y organiza tu ruta día a día
          </p>
          <button
            type="button"
            (click)="createFirstStop()"
            class="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium cursor-pointer"
          >
            Crear primera parada
          </button>
        </div>
      </div>
      } @else {
      <!-- Vista dividida: Timeline + Mapa -->
      <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        <!-- Columna izquierda: Timeline con scroll -->
        <div class="flex-1 flex flex-col min-h-0">
          <!-- Timeline scrolleable -->
          <div class="flex-1 overflow-y-auto pt-6 lg:pt-10 lg:px-4 hide-scrollbar">
            <div class="space-y-12 pb-6">
              @for (dateGroup of groupedItems(); track dateGroup.date) {
              <div class="">
                <!-- Contador de paradas y fecha -->
                <div class="flex items-center gap-6 lg:gap-8 mb-6">
                  <!-- Círculo contador con línea vertical -->
                  <div class="flex flex-col items-start">
                    <!-- Círculo contador -->
                    <div
                      class="w-10 h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center text-sm font-semibold text-gray-900 shadow-sm z-10"
                    >
                      {{ dateGroup.items.length }}
                    </div>
                  </div>

                  <!-- Fecha -->
                  <div
                    class="flex-1 flex justify-center px-6 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-medium text-gray-900"
                  >
                    {{ formatGroupDate(dateGroup.date) }}
                  </div>
                </div>

                <!-- Lista de paradas del día -->
                <div class="space-y-6 expand">
                  @for (item of dateGroup.items; track item.id; let idx = $index) {
                  <div
                    class="flex group gap-6 lg:gap-8 items-center justify-center transition-all cursor-pointer"
                    (click)="selectItem(item)"
                  >
                    <!-- Icono del tipo de parada -->
                    <div
                      class="min-w-10 min-h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm z-10 relative
             group-hover:bg-black group-hover:text-white transition-colors"
                    >
                      <i
                        [class]="getItemIcon(item)"
                        class="text-gray-700 group-hover:text-white"
                        style="font-size: 1rem"
                      ></i>
                    </div>

                    <!-- Contenido de la parada -->
                    <div class="flex w-full items-start justify-between">
                      <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                          {{ item.name }}
                        </h4>
                        @if (item.city || item.country) {
                        <p class="text-sm text-gray-600">{{ item.city }}, {{ item.country }}</p>
                        }
                      </div>

                      <!-- Hora -->
                      <div class="ml-4 text-right">
                        <p class="text-lg font-semibold text-gray-900">
                          {{ extractTime(item.start_date) }}
                        </p>

                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>
              }
            </div>
          </div>
        </div>

        <!-- Columna derecha: Mapa FIJO -->
        <div class="w-full lg:w-2/5 shrink-0 py-6 rounded-xl overflow-hidden">
          <app-map
            [config]="{
              mode: 'view-markers',
              height: '100%',
              showRoute: false,
              routeColor: '#FF3437',
              routeWeight: 3,
              routeStyle: 'dotted'
            }"
            [markers]="mapMarkers()"
            (markerClicked)="onMarkerClicked($event)"
          >
          </app-map>
        </div>
      </div>

      <!-- Botón fijo en la parte inferior -->
      <div class="py-4 lg:px-4 border-t border-gray-200 shrink-0">
        <button
          type="button"
          (click)="createStop()"
          class="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium cursor-pointer"
        >
          Añadir parada
        </button>
      </div>
      } }
    </div>
  `,
	styles: `
  /* Ocultar scrollbars en todos los navegadores */
.hide-scrollbar {
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* IE + Edge antiguo */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;                /* Chrome, Safari, Edge */
}
`,
})
export class ItineraryDetailComponent {
	readonly #itineraryStore = inject(TripItineraryStore);
	readonly #dialogService = inject(DialogService);

	// Signals del servicio
	items = this.#itineraryStore.itinerary;
	isLoading = this.#itineraryStore.isLoading;

	/**
	 * Agrupa las paradas por fecha y las ordena por hora
	 */
	groupedItems = computed(() => {
		const allItems = this.items();
		if (!allItems || allItems.length === 0) return [];

		// Agrupar por fecha de inicio
		const groups = new Map<string, ItineraryItemWithDetails[]>();

		allItems.forEach((item) => {
			const dateKey = item.start_date.split("T")[0];

			if (!groups.has(dateKey)) {
				groups.set(dateKey, []);
			}
			groups.get(dateKey)!.push(item);
		});

		// Convertir a array y ordenar
		const dateGroups: DateGroup[] = Array.from(groups.entries())
			.map(([date, items]) => ({
				date,
				items: items.sort((a, b) => {
					const timeA = new Date(a.start_date).getTime();
					const timeB = new Date(b.start_date).getTime();
					return timeA - timeB;
				}),
			}))
			.sort((a, b) => {
				return new Date(a.date).getTime() - new Date(b.date).getTime();
			});

		return dateGroups;
	});

	/**
	 * Convierte las paradas en markers para el mapa
	 */
	mapMarkers = computed(() => {
		const allItems = this.items();
		if (!allItems || allItems.length === 0) return [];

		return allItems
			.filter((item) => item.latitude && item.longitude)
			.map((item) => ({
				id: item.id,
				coordinates: {
					lat: item.latitude!,
					lng: item.longitude!,
				},
				title: item.name,
				description: `
          <div class="text-sm">
            <p class="font-semibold mb-1">${item.city}, ${item.country}</p>
            <p class="text-gray-600">${this.extractTime(item.start_date)}</p>
            ${item.description ? `<p class="mt-2 text-gray-700">${item.description}</p>` : ""}
          </div>
        `,
			}));
	});

	/**
	 * Abre el modal para crear la primera parada
	 */
	createFirstStop(): void {
		this.#itineraryStore.setMode("create");
		this.#dialogService.openCustomDialog(ItineraryModalComponent, {
			styleClass:
				"w-screen h-screen lg:w-[85vw] lg:h-[85vh] lg:max-w-5xl lg:max-h-[90vh]",
			contentStyle: {
				height: "100%",
			},
			data: {
				mode: "create",
			},
			closable: true,
			draggable: false,
			dismissableMask: true,
			templates: {
				header: ItineraryModalHeader,
			},
		});
	}

	/**
	 * Abre el modal para crear una nueva parada
	 */
	createStop(): void {
		this.#itineraryStore.setMode("create");
		this.#dialogService.openCustomDialog(ItineraryModalComponent, {
			styleClass:
				"w-screen h-screen lg:w-[85vw] lg:h-[85vh] lg:max-w-5xl lg:max-h-[90vh]",
			contentStyle: {
				height: "100%",
			},
			data: {
				mode: "create",
			},
			closable: true,
			draggable: false,
			dismissableMask: true,
			templates: {
				header: ItineraryModalHeader,
			},
		});
	}

	/**
	 * Selecciona una parada desde el timeline
	 */
	selectItem(item: ItineraryItemWithDetails): void {
		this.#itineraryStore.setMode("view");
		this.#dialogService.openCustomDialog(ItineraryModalComponent, {
			styleClass:
				"w-screen h-screen lg:w-[85vw] lg:h-[85vh] lg:max-w-5xl lg:max-h-[90vh]",
			contentStyle: {
				height: "100%",
			},
			data: {
				item,
			},
			closable: true,
			draggable: false,
			dismissableMask: true,
			templates: {
				header: ItineraryModalHeader,
			},
		});
	}

	/**
	 * Maneja el click en un marker del mapa
	 * Resalta en el timeline y abre el modal
	 */
	onMarkerClicked(marker: MapMarker): void {
		const item = this.items().find((i) => i.id === marker.id);
		if (item) {
			//this.selectedItemId.set(item.id);
			//this.modalService.openView(item);
		}
	}

	/**
	 * Formatea la fecha del grupo
	 */
	formatGroupDate(dateString: string): string {
		const date = new Date(dateString + "T00:00:00");
		return date.toLocaleDateString("es-ES", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	}

	/**
	 * Extrae la hora de un datetime
	 */
	extractTime(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleTimeString("es-ES", {
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	/**
	 * Calcula la duración entre dos fechas en días
	 */
	// calculateDuration(startDate: string, endDate: string): number {
	// 	return this.#itineraryStore.calculateDuration(startDate, endDate);
	// }

	/**
	 * Devuelve el icono apropiado según el tipo de parada
	 */
	getItemIcon(item: ItineraryItem): string {
		const text = `${item.name ?? ""} ${item.description ?? ""}`.toLowerCase();

		const iconMap: { icon: string; keywords: string[] }[] = [
			{
				icon: "pi pi-home",
				keywords: ["hotel", "hostal", "alojamiento", "airbnb"],
			},
			{
				icon: "pi pi-users",
				keywords: ["restaurante", "comida", "dinner", "lunch", "food"],
			},
			{
				icon: "pi pi-briefcase",
				keywords: ["work", "negocio", "empresa", "oficina"],
			},
			{
				icon: "pi pi-shopping-bag",
				keywords: ["tienda", "shopping", "compras"],
			},
			{
				icon: "pi pi-car",
				keywords: [
					"coche",
					"car",
					"parking",
					"aparcamiento",
					"transporte",
					"autobus",
					"autobús",
				],
			},
			{
				icon: "pi pi-ticket",
				keywords: ["evento", "concierto", "espectáculo", "entrada"],
			},
		];

		for (const entry of iconMap) {
			if (entry.keywords.some((keyword) => text.includes(keyword))) {
				return entry.icon;
			}
		}

		return "pi pi-map-marker";
	}

	/**
	 * Calcula la altura de la línea vertical
	 */
	getLineHeight(itemCount: number): number {
		if (itemCount === 0) return 0;

		const gapBetweenItems = 44; // 20px círculo + 24px gap
		const halfCircle = 10; // hasta centro último círculo

		return (itemCount - 1) * gapBetweenItems + halfCircle;
	}
}
