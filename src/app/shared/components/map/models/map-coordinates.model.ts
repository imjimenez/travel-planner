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
	raw: NominatimBoundary;
}
export interface Address {
	village: string;
	city: string;
	county: string;
	state: string;
	"ISO3166-2-lvl4": string;
	country: string;
	country_code: string;
	town: string;
	municipality: string;
}
export interface NominatimBoundary {
	place_id: number;
	licence: string;
	osm_type: string;
	osm_id: number;
	lat: string;
	lon: string;
	class: string;
	type: string;
	place_rank: number;
	importance: number;
	addresstype: string;
	name: string;
	display_name: string;
	boundingbox: string[];
	address?: Address;
}
export type NominatimResponse = NominatimBoundary[];
