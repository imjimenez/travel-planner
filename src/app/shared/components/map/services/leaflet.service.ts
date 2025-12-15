import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import * as L from "leaflet";
import { catchError, from, map, type Observable } from "rxjs";
import {
	DEFAULT_MAP_CONFIG,
	NominatimResponse,
	type GeocodingResult,
	type MapConfig,
	type MapCoordinates,
	type MapMarker,
} from "../models";

/**
 * Servicio para gestionar mapas con Leaflet y Nominatim.
 *
 * Funcionalidades:
 * - Crear y configurar mapas con Leaflet
 * - Gestionar marcadores
 * - Búsqueda de ubicaciones con Nominatim (geocoding directo)
 * - Geocoding inverso (coordenadas → nombre)
 * - Calcular distancias y rutas
 */
@Injectable({
	providedIn: "root",
})
export class LeafletService {
	#http = inject(HttpClient);
	readonly #DEFAULT_ICON = L.icon({
		iconUrl: "assets/leaflet/marker-icon.png",
		iconRetinaUrl: "assets/leaflet/marker-icon-2x.png",
		shadowUrl: "assets/leaflet/marker-shadow.png",
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41],
	});

	readonly #NOMINATIM_URL = "https://nominatim.openstreetmap.org";

	constructor() {
		this.fixLeafletIconPaths();
	}

	/**
	 * Corrige las rutas de los iconos por defecto de Leaflet.
	 */
	private fixLeafletIconPaths(): void {
		delete (L.Icon.Default.prototype as any)._getIconUrl;
		L.Icon.Default.mergeOptions({
			iconRetinaUrl: "assets/leaflet/marker-icon-2x.png",
			iconUrl: "assets/leaflet/marker-icon.png",
			shadowUrl: "assets/leaflet/marker-shadow.png",
		});
	}

	/**
	 * Crea un nuevo mapa en el elemento especificado.
	 *
	 * @param elementId ID del elemento HTML donde se renderizará el mapa
	 * @param config Configuración del mapa
	 * @returns Instancia del mapa de Leaflet
	 */
	createMap(elementId: string, config: Partial<MapConfig> = {}): L.Map {
		const finalConfig = { ...DEFAULT_MAP_CONFIG, ...config };

		const map = L.map(elementId, {
			center: [finalConfig.center!.lat, finalConfig.center!.lng],
			zoom: finalConfig.zoom,
			minZoom: finalConfig.minZoom,
			maxZoom: finalConfig.maxZoom,
			zoomControl: finalConfig.showZoomControl,
		});

		// Añadir capa de OpenStreetMap
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "© OpenStreetMap contributors",
			maxZoom: 19,
		}).addTo(map);

		// Añadir controles adicionales
		if (finalConfig.showScaleControl) {
			L.control.scale({ imperial: false, metric: true }).addTo(map);
		}

		return map;
	}

	/**
	 * Busca ubicaciones por nombre o dirección usando Nominatim.
	 *
	 * @param query Texto de búsqueda (ej: "Madrid", "Calle Gran Vía, Madrid")
	 * @returns Observable con los resultados
	 *
	 * @example
	 * this.leafletService.searchLocation('Vitoria').subscribe(results => {
	 *   console.log(results);
	 * });
	 */
	searchLocation(query: string): Observable<GeocodingResult[]> {
		const url = `${this.#NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(
			query,
		)}&accept-language=es&limit=5`;

		return from(
			fetch(url)
				.then((response) => response.json())
				.then((data: any[]) => {
					return data.map((item) => ({
						displayName: item.display_name,
						coordinates: {
							lat: parseFloat(item.lat),
							lng: parseFloat(item.lon),
						},
						bounds: item.boundingbox
							? {
									southWest: {
										lat: parseFloat(item.boundingbox[0]),
										lng: parseFloat(item.boundingbox[2]),
									},
									northEast: {
										lat: parseFloat(item.boundingbox[1]),
										lng: parseFloat(item.boundingbox[3]),
									},
								}
							: undefined,
						type: item.type,
						raw: item,
					}));
				})
				.catch((error) => {
					console.error("Error en búsqueda de ubicación:", error);
					return [];
				}),
		);
	}

	searchFirstLocation(query: string): Observable<GeocodingResult | null> {
		const url = `${this.#NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(
			query,
		)}&accept-language=es&limit=1`;

		return this.#http.get<NominatimResponse>(url).pipe(
			map((data) => {
				if (!data.length) {
					return null;
				}
				const [item] = data
				return  {
					displayName: item.display_name,
					coordinates: {
						lat: parseFloat(item.lat),
						lng: parseFloat(item.lon),
					},
					bounds: item.boundingbox
						? {
								southWest: {
									lat: parseFloat(item.boundingbox[0]),
									lng: parseFloat(item.boundingbox[2]),
								},
								northEast: {
									lat: parseFloat(item.boundingbox[1]),
									lng: parseFloat(item.boundingbox[3]),
								},
							}
						: undefined,
					type: item.type,
					raw: item,
				};
			}),
			catchError((error) => {
				console.error("Error en búsqueda de ubicación:", error);
				return [];
			}),
		);
	}

	/**
	 * Obtiene el nombre de un lugar a partir de sus coordenadas (geocoding inverso).
	 *
	 * @param coordinates Coordenadas de la ubicación
	 * @returns Observable con el resultado
	 *
	 * @example
	 * this.leafletService.reverseGeocode({ lat: 42.5, lng: -1.6 }).subscribe(result => {
	 *   console.log(result.displayName);
	 * });
	 */
	reverseGeocode(
		coordinates: MapCoordinates,
	): Observable<GeocodingResult | null> {
		const url = `${this.#NOMINATIM_URL}/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&accept-language=es`;

		return from(
			fetch(url)
				.then((response) => response.json())
				.then((data: any) => {
					if (data && data.display_name) {
						return {
							displayName: data.display_name,
							coordinates: {
								lat: parseFloat(data.lat),
								lng: parseFloat(data.lon),
							},
							type: data.type,
							raw: data,
						};
					}
					return null;
				})
				.catch((error) => {
					console.error("Error en geocoding inverso:", error);
					return null;
				}),
		);
	}

	/**
	 * Añade un marcador al mapa.
	 *
	 * @param map Instancia del mapa
	 * @param marker Datos del marcador
	 * @param onClick Callback al hacer click
	 * @param onDragEnd Callback al arrastrar
	 * @returns Instancia del marcador de Leaflet
	 */
	addMarker(
		map: L.Map,
		marker: MapMarker,
		onClick?: (marker: MapMarker) => void,
		onDragEnd?: (marker: MapMarker, newCoordinates: MapCoordinates) => void,
	): L.Marker {
		const leafletMarker = L.marker(
			[marker.coordinates.lat, marker.coordinates.lng],
			{
				icon: this.createIcon(marker),
				draggable: marker.draggable || false,
				title: marker.title,
			},
		);

		if (marker.title || marker.description) {
			const popupContent = this.createPopupContent(marker);
			leafletMarker.bindPopup(popupContent);
		}

		if (onClick) {
			leafletMarker.on("click", () => onClick(marker));
		}

		if (onDragEnd && marker.draggable) {
			leafletMarker.on("dragend", (event: any) => {
				const position = event.target.getLatLng();
				const newCoordinates: MapCoordinates = {
					lat: position.lat,
					lng: position.lng,
				};
				onDragEnd(marker, newCoordinates);
			});
		}

		leafletMarker.addTo(map);
		return leafletMarker;
	}

	// leaflet.service.ts
	/**
	 * Centra el mapa en unas coordenadas específicas con un zoom opcional.
	 *
	 * @param map Instancia del mapa
	 * @param coordinates Coordenadas donde centrar
	 * @param zoom Nivel de zoom (opcional, usa el actual si no se especifica)
	 */
	centerMap(map: L.Map, coordinates: MapCoordinates, zoom?: number): void {
		const currentZoom = map.getZoom();
		map.setView([coordinates.lat, coordinates.lng], zoom || currentZoom);
	}

	/**
	 * Crea un icono Leaflet para un marcador.
	 * Si el marcador incluye una URL personalizada, la usa; de lo contrario aplica el icono por defecto.
	 *
	 * @param marker Datos del marcador
	 * @returns Instancia del icono Leaflet
	 */
	private createIcon(marker: MapMarker): L.Icon {
		if (marker.iconUrl) {
			return L.icon({
				iconUrl: marker.iconUrl,
				iconSize: marker.iconSize || [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
			});
		}
		return this.#DEFAULT_ICON;
	}

	/**
	 * Genera el contenido HTML que se mostrará en el popup del marcador.
	 * Combina título y descripción si están disponibles.
	 *
	 * @param marker Datos del marcador
	 * @returns Cadena HTML para el popup
	 */
	private createPopupContent(marker: MapMarker): string {
		let content = "";
		if (marker.title) {
			content += `<strong>${marker.title}</strong>`;
		}
		if (marker.description) {
			content += marker.title
				? `<br>${marker.description}`
				: marker.description;
		}
		return content;
	}

	/**
	 * Elimina un marcador específico del mapa.
	 *
	 * @param map Instancia del mapa
	 * @param leafletMarker Marcador a eliminar
	 */
	removeMarker(map: L.Map, leafletMarker: L.Marker): void {
		map.removeLayer(leafletMarker);
	}

	/**
	 * Elimina todos los marcadores del mapa sin afectar capas base.
	 * Recorre todas las capas y borra únicamente los objetos de tipo Marker.
	 *
	 * @param map Instancia del mapa
	 */
	clearMarkers(map: L.Map): void {
		map.eachLayer((layer) => {
			if (layer instanceof L.Marker) {
				map.removeLayer(layer);
			}
		});
	}

	/**
	 * Dibuja una ruta en el mapa conectando múltiples coordenadas.
	 * Los puntos se ordenan por proximidad para generar un trazado coherente.
	 *
	 * @param map Mapa Leaflet donde se dibuja la ruta.
	 * @param coordinates Lista de puntos a conectar.
	 * @param options Configuración visual de la ruta (color, grosor y estilo).
	 * @returns La polyline generada o null si no hay suficientes puntos.
	 */
	drawRoute(
		map: L.Map,
		coordinates: MapCoordinates[],
		options: {
			color?: string;
			weight?: number;
			style?: "solid" | "dashed" | "dotted";
		} = {},
	): L.Polyline | null {
		if (coordinates.length < 2) return null;

		const orderedCoordinates = this.orderPointsByProximity(coordinates);
		const latLngs: L.LatLngExpression[] = orderedCoordinates.map((coord) => [
			coord.lat,
			coord.lng,
		]);

		let dashArray: string | undefined;
		if (options.style === "dashed") dashArray = "10, 10";
		else if (options.style === "dotted") dashArray = "2, 6";

		const polyline = L.polyline(latLngs, {
			color: options.color || "#3388ff",
			weight: options.weight || 3,
			dashArray,
			opacity: 0.7,
		});

		polyline.addTo(map);
		return polyline;
	}

	/**
	 * Ordena una lista de coordenadas según su proximidad.
	 * Comienza por el primer punto y selecciona siempre el siguiente más cercano.
	 *
	 * @param coordinates Lista de coordenadas
	 * @returns Lista ordenada por distancia progresiva
	 */
	private orderPointsByProximity(
		coordinates: MapCoordinates[],
	): MapCoordinates[] {
		if (coordinates.length <= 2) return [...coordinates];

		const ordered: MapCoordinates[] = [coordinates[0]];
		const remaining = coordinates.slice(1);

		while (remaining.length > 0) {
			const current = ordered[ordered.length - 1];
			let nearestIndex = 0;
			let minDistance = this.calculateDistance(current, remaining[0]);

			for (let i = 1; i < remaining.length; i++) {
				const distance = this.calculateDistance(current, remaining[i]);
				if (distance < minDistance) {
					minDistance = distance;
					nearestIndex = i;
				}
			}

			ordered.push(remaining[nearestIndex]);
			remaining.splice(nearestIndex, 1);
		}

		return ordered;
	}

	/**
	 * Calcula la distancia entre dos coordenadas (fórmula de Haversine).
	 * @returns Distancia en kilómetros
	 */
	calculateDistance(coord1: MapCoordinates, coord2: MapCoordinates): number {
		const R = 6371;
		const dLat = this.toRadians(coord2.lat - coord1.lat);
		const dLng = this.toRadians(coord2.lng - coord1.lng);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(this.toRadians(coord1.lat)) *
				Math.cos(this.toRadians(coord2.lat)) *
				Math.sin(dLng / 2) *
				Math.sin(dLng / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	/**
	 * Convierte grados a radianes.
	 *
	 * @param degrees Valor en grados
	 * @returns Valor en radianes
	 */
	private toRadians(degrees: number): number {
		return degrees * (Math.PI / 180);
	}

	/**
	 * Ajusta el mapa para mostrar todas las coordenadas dadas dentro del área visible.
	 * Aplica un padding para evitar que queden pegadas al borde.
	 *
	 * @param map Instancia del mapa
	 * @param coordinates Lista de coordenadas a encuadrar
	 * @param padding Espaciado adicional alrededor de los límites
	 */
	fitBounds(
		map: L.Map,
		coordinates: MapCoordinates[],
		padding: [number, number] = [50, 50],
	): void {
		if (coordinates.length === 0) return;

		if (coordinates.length === 1) {
			map.setView([coordinates[0].lat, coordinates[0].lng], 13);
			return;
		}

		const bounds = L.latLngBounds(
			coordinates.map((coord) => [coord.lat, coord.lng] as L.LatLngExpression),
		);

		map.fitBounds(bounds, { padding });
	}

	/**
	 * Registra un callback que se ejecuta cuando el usuario hace click en el mapa.
	 * Devuelve las coordenadas del punto donde se hizo click.
	 *
	 * @param map Instancia del mapa
	 * @param callback Función que recibe las coordenadas del click
	 */
	onMapClick(
		map: L.Map,
		callback: (coordinates: MapCoordinates) => void,
	): void {
		map.on("click", (event: L.LeafletMouseEvent) => {
			callback({
				lat: event.latlng.lat,
				lng: event.latlng.lng,
			});
		});
	}

	/**
	 * Elimina todas las capas del mapa excepto las capas base (TileLayer).
	 * Limpia líneas, rutas, marcadores, polígonos y cualquier overlay visual.
	 *
	 * @param map Instancia del mapa
	 */
	clearAllOverlays(map: L.Map): void {
		map.eachLayer((layer) => {
			if (!(layer instanceof L.TileLayer)) {
				map.removeLayer(layer);
			}
		});
	}

	/**
	 * Destruye completamente la instancia del mapa y libera sus recursos.
	 *
	 * @param map Instancia del mapa
	 */
	destroyMap(map: L.Map): void {
		map.remove();
	}
}
