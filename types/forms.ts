/**
 * Form-specific types used across the application
 */

export interface PlaceOfOriginForm {
	id: string | number;
	location: string;
	startDate: string;
	endDate: string;
}

export interface OccupationForm {
	id: string | number;
	title: string;
	startDate: string;
	endDate: string;
}
