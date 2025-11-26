import { MapCoordinates } from './map-coordinates.model';

/**
 * Modos de interacción del componente de mapa.
 */
export type MapMode = 
  | 'view-only'           // Solo visualización, sin interacción
  | 'select-location'     // Seleccionar una ubicación (click o búsqueda)
  | 'add-marker'          // Añadir marcadores (múltiples clicks)
  | 'view-markers'        // Ver marcadores existentes
  | 'edit-markers';       // Editar/mover marcadores existentes

/**
 * Configuración del componente de mapa.
 */
export interface MapConfig {
  /** Modo de operación del mapa */
  mode: MapMode;
  /** Coordenadas iniciales del centro del mapa */
  center?: MapCoordinates;
  /** Nivel de zoom inicial (1-18) */
  zoom?: number;
  /** Zoom mínimo permitido */
  minZoom?: number;
  /** Zoom máximo permitido */
  maxZoom?: number;
  /** Altura del contenedor del mapa */
  height?: string;
  /** Mostrar control de zoom */
  showZoomControl?: boolean;
  /** Mostrar control de escala */
  showScaleControl?: boolean;
  /** Habilitar clustering de marcadores */
  enableClustering?: boolean;
  /** Mostrar líneas conectando los marcadores */
  showRoute?: boolean;
  /** Color de la línea de ruta */
  routeColor?: string;
  /** Grosor de la línea de ruta */
  routeWeight?: number;
  /** Estilo de la línea de ruta */
  routeStyle?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Configuración por defecto del mapa.
 */
export const DEFAULT_MAP_CONFIG: Partial<MapConfig> = {
  center: { lat: 42.847, lng: -2.673 }, // Vitoria-Gasteiz
  zoom: 12,
  minZoom: 2,
  maxZoom: 18,
  height: '500px',
  showZoomControl: true,
  showScaleControl: true,
  enableClustering: false,
  showRoute: false,
  routeColor: '#3388ff',
  routeWeight: 3,
  routeStyle: 'solid'
};
