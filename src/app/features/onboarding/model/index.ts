import type { Trip } from "@core/trips";

export interface Destination {
	name: Trip["name"];
	latitude: NonNullable<Trip["latitude"]>;
	longitude: NonNullable<Trip["longitude"]>;
}


export interface TripDates {
	start_date: Trip["start_date"];
	end_date: Trip["end_date"];
}
