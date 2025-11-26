import { MapCoordinates } from './map-coordinates.model';

/**
 * Representa un marcador en el mapa.
 */
export interface MapMarker {
  /** Identificador único del marcador */
  id: string;
  /** Coordenadas del marcador */
  coordinates: MapCoordinates;
  /** Título o nombre del marcador */
  title?: string;
  /** Descripción o información adicional */
  description?: string;
  /** URL del icono personalizado (opcional) */
  iconUrl?: string;
  /** Tamaño del icono [ancho, alto] */
  iconSize?: [number, number];
  /** Si el marcador es arrastrable */
  draggable?: boolean;
  /** Color del marcador (para iconos por defecto) */
  color?: 'blue' | 'red' | 'green' | 'orange' | 'yellow' | 'violet' | 'grey' | 'black';
  /** Datos personalizados adicionales */
  data?: any;
}

/**
 * Opciones para el popup de un marcador.
 */
export interface MarkerPopupOptions {
  /** Contenido HTML del popup */
  content: string;
  /** Ancho máximo del popup */
  maxWidth?: number;
  /** Si el popup se abre automáticamente */
  autoOpen?: boolean;
  /** Si el popup se cierra al hacer click en el mapa */
  closeOnClick?: boolean;
}
