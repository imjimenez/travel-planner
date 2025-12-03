// src/shared/components/map/map.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { LeafletService } from './services/leaflet.service';
import { MapConfig, MapCoordinates, MapMarker, DEFAULT_MAP_CONFIG } from './models';

/**
 * Componente reutilizable de mapa con Leaflet.
 *
 * Soporta múltiples modos de operación:
 * - view-only: Solo visualización
 * - select-location: Seleccionar una ubicación (click o búsqueda)
 * - add-marker: Añadir múltiples marcadores
 * - view-markers: Visualizar marcadores existentes
 * - edit-markers: Editar/mover marcadores
 *
 * @example
 * // Modo selección de ubicación
 * <app-map
 *   [config]="{ mode: 'select-location', showSearchControl: true }"
 *   (locationSelected)="onLocationSelected($event)">
 * </app-map>
 *
 * @example
 * // Modo visualización de múltiples paradas con ruta
 * <app-map
 *   [config]="{ mode: 'view-markers', showRoute: true }"
 *   [markers]="tripStops"
 *   (markerClicked)="onStopClicked($event)">
 * </app-map>
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <div
        #mapContainer
        [id]="mapId"
        class="map-container"
        [style.height]="config.height || '500px'"
      ></div>
    </div>
  `,
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  /**
   * Configuración del mapa.
   */
  @Input() config: Partial<MapConfig> = {};

  /**
   * Marcadores a mostrar en el mapa.
   * Se utiliza en los modos: view-markers, edit-markers
   */
  @Input() markers: MapMarker[] = [];

  /**
   * Coordenadas iniciales para centrar el mapa.
   * Si se proporciona, sobrescribe el center del config.
   */
  @Input() initialCoordinates?: MapCoordinates;

  /**
   * Se emite cuando el usuario selecciona una ubicación.
   * Modos: select-location, add-marker
   */
  @Output() locationSelected = new EventEmitter<MapCoordinates>();

  /**
   * Se emite cuando el usuario hace click en un marcador.
   * Modos: view-markers, edit-markers
   */
  @Output() markerClicked = new EventEmitter<MapMarker>();

  /**
   * Se emite cuando el usuario añade un nuevo marcador.
   * Modo: add-marker
   */
  @Output() markerAdded = new EventEmitter<MapCoordinates>();

  /**
   * Se emite cuando el usuario arrastra un marcador a una nueva posición.
   * Modo: edit-markers
   */
  @Output() markerMoved = new EventEmitter<{ marker: MapMarker; newCoordinates: MapCoordinates }>();

  private map!: L.Map;
  private leafletMarkers: Map<string, L.Marker> = new Map();
  private routeLine?: L.Polyline;
  private finalConfig!: MapConfig;
  private currentMarker?: L.Marker; // Marcador temporal para select-location

  /**
   * ID único para el contenedor del mapa.
   */
  mapId: string = 'map-' + Date.now();

  constructor(private leafletService: LeafletService) {}

  ngOnInit(): void {
    // Combinar configuración por defecto con la proporcionada
    this.finalConfig = {
      ...DEFAULT_MAP_CONFIG,
      ...this.config,
    } as MapConfig;

    // Si se proporcionan coordenadas iniciales, sobrescribir el center
    if (this.initialCoordinates) {
      this.finalConfig.center = this.initialCoordinates;
    }
  }

  ngAfterViewInit(): void {
    // Esperar un tick para que el contenedor esté completamente renderizado
    setTimeout(() => {
      this.initializeMap();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.leafletService.destroyMap(this.map);
    }
  }

  /**
   * Inicializa el mapa con la configuración proporcionada.
   * @private
   */
  private initializeMap(): void {
    // Crear el mapa
    this.map = this.leafletService.createMap(this.mapContainer.nativeElement.id, this.finalConfig);

    // Configurar eventos según el modo
    this.setupModeInteractions();

    // Cargar marcadores existentes
    if (this.markers.length > 0) {
      this.loadMarkers();
    }
  }

  /**
   * Configura las interacciones según el modo del mapa.
   * @private
   */
  private setupModeInteractions(): void {
    switch (this.finalConfig.mode) {
      case 'select-location':
        this.setupSelectLocationMode();
        break;
      case 'add-marker':
        this.setupAddMarkerMode();
        break;
      case 'view-markers':
        // Solo visualización, sin interacciones adicionales
        break;
      case 'edit-markers':
        // Los marcadores serán draggables
        break;
      case 'view-only':
        // Sin interacciones
        this.map.dragging.disable();
        this.map.touchZoom.disable();
        this.map.doubleClickZoom.disable();
        this.map.scrollWheelZoom.disable();
        break;
    }
  }

  /**
   * Configura el modo de selección de ubicación.
   * @private
   */
  private setupSelectLocationMode(): void {
    this.leafletService.onMapClick(this.map, (coordinates) => {
      // Eliminar marcador anterior si existe
      if (this.currentMarker) {
        this.map.removeLayer(this.currentMarker);
      }

      // Añadir nuevo marcador usando el método simple
      this.currentMarker = L.marker([coordinates.lat, coordinates.lng]).addTo(this.map);

      // Emitir evento
      this.locationSelected.emit(coordinates);
    });
  }

  /**
   * Configura el modo de añadir marcadores.
   * @private
   */
  private setupAddMarkerMode(): void {
    this.leafletService.onMapClick(this.map, (coordinates) => {
      // Añadir marcador
      const markerId = `marker-${Date.now()}`;
      const marker: MapMarker = {
        id: markerId,
        coordinates,
      };

      const leafletMarker = this.leafletService.addMarker(this.map, marker);
      this.leafletMarkers.set(markerId, leafletMarker);

      // Emitir evento
      this.markerAdded.emit(coordinates);
    });
  }

  /**
   * Carga los marcadores en el mapa.
   * @private
   */
  private loadMarkers(): void {
    // Limpiar marcadores anteriores
    this.clearMarkers();

    // Añadir nuevos marcadores
    this.markers.forEach((marker) => {
      const isDraggable = this.finalConfig.mode === 'edit-markers' || marker.draggable;

      const leafletMarker = this.leafletService.addMarker(
        this.map,
        { ...marker, draggable: isDraggable },
        (clickedMarker) => this.markerClicked.emit(clickedMarker),
        (movedMarker, newCoordinates) => {
          this.markerMoved.emit({ marker: movedMarker, newCoordinates });
        }
      );

      this.leafletMarkers.set(marker.id, leafletMarker);
    });

    // Dibujar ruta si está habilitado
    if (this.finalConfig.showRoute && this.markers.length > 1) {
      this.drawRoute();
    }

    // Ajustar vista para mostrar todos los marcadores
    const coordinates = this.markers.map((m) => m.coordinates);
    this.leafletService.fitBounds(this.map, coordinates);
  }

  /**
   * Dibuja una línea de ruta conectando los marcadores.
   * @private
   */
  private drawRoute(): void {
    // Eliminar ruta anterior si existe
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
    }

    const coordinates = this.markers.map((m) => m.coordinates);
    this.routeLine =
      this.leafletService.drawRoute(this.map, coordinates, {
        color: this.finalConfig.routeColor,
        weight: this.finalConfig.routeWeight,
        style: this.finalConfig.routeStyle,
      }) || undefined;
  }

  /**
   * Limpia todos los marcadores del mapa.
   * @private
   */
  private clearMarkers(): void {
    this.leafletMarkers.forEach((marker) => {
      this.leafletService.removeMarker(this.map, marker);
    });
    this.leafletMarkers.clear();

    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = undefined;
    }
  }

  /**
   * Actualiza los marcadores del mapa (llamar desde el componente padre).
   * @public
   */
  updateMarkers(newMarkers: MapMarker[]): void {
    this.markers = newMarkers;
    if (this.map) {
      this.loadMarkers();
    }
  }

  /**
   * Centra el mapa en unas coordenadas específicas.
   * @public
   */
  centerMap(coordinates: MapCoordinates, zoom?: number): void {
    if (this.map) {
      this.leafletService.centerMap(this.map, coordinates, zoom);
    }
  }

  /**
   * Añade un marcador completo programáticamente.
   * Usado cuando necesitas control total sobre el marcador (con ID, popup, etc.)
   * @public
   */
  addMarker(marker: MapMarker): void {
    if (this.map) {
      const leafletMarker = this.leafletService.addMarker(this.map, marker);
      this.leafletMarkers.set(marker.id, leafletMarker);
      this.markers.push(marker);
    }
  }

  /**
   * Añade un marcador simple en las coordenadas especificadas.
   * Usado en modo select-location para mostrar la ubicación seleccionada.
   * Si ya existe un marcador temporal, lo reemplaza.
   * @public
   */
  addSimpleMarker(coordinates: MapCoordinates): void {
    if (!this.map) return;

    // Si ya existe un marcador temporal, eliminarlo
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    // Crear nuevo marcador simple
    this.currentMarker = L.marker([coordinates.lat, coordinates.lng]).addTo(this.map);
  }

  /**
   * Elimina un marcador por su ID.
   * @public
   */
  removeMarker(markerId: string): void {
    const leafletMarker = this.leafletMarkers.get(markerId);
    if (leafletMarker && this.map) {
      this.leafletService.removeMarker(this.map, leafletMarker);
      this.leafletMarkers.delete(markerId);
      this.markers = this.markers.filter((m) => m.id !== markerId);
    }
  }

  /**
   * Limpia todos los marcadores y overlays del mapa.
   * @public
   */
  clear(): void {
    if (this.map) {
      this.clearMarkers();

      // También limpiar el marcador temporal si existe
      if (this.currentMarker) {
        this.map.removeLayer(this.currentMarker);
        this.currentMarker = undefined;
      }

      this.leafletService.clearAllOverlays(this.map);
    }
  }
}
