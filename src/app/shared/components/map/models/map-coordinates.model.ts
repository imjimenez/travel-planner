/**
 * Representa una coordenada geográfica con latitud y longitud.
 */
export interface MapCoordinates {
    /** Latitud (Norte-Sur) en grados decimales */
    lat: number;
    /** Longitud (Este-Oeste) en grados decimales */
    lng: number;
  }
  
  /**
   * Representa los límites de un área geográfica (bounding box).
   */
  export interface MapBounds {
    /** Coordenadas del extremo suroeste */
    southWest: MapCoordinates;
    /** Coordenadas del extremo noreste */
    northEast: MapCoordinates;
  }
  
  /**
   * Resultado de una búsqueda de geocodificación.
   */
  export interface GeocodingResult {
    /** Nombre formateado de la ubicación */
    displayName: string;
    /** Coordenadas de la ubicación */
    coordinates: MapCoordinates;
    /** Límites del área (opcional) */
    bounds?: MapBounds;
    /** Tipo de lugar (ciudad, calle, país, etc.) */
    type?: string;
    /** Datos adicionales del resultado */
    raw?: any;
  }
  