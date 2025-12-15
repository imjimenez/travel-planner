import type { Trip } from "@core/trips";

export interface Destination {
	name: Trip["name"];
	latitude: NonNullable<Trip["latitude"]>;
	longitude: NonNullable<Trip["longitude"]>;
}

export const INVALID_COORDINATE = 999;
export const DEFAULT_COORDINATES = { lat: 42.847, lng: -2.673 };

export interface TripDates {
	start_date: Trip["start_date"];
	end_date: Trip["end_date"];
}
