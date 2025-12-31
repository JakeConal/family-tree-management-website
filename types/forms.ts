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

/**
 * API response types that may differ from form types
 */
export interface OccupationApiResponse {
	id: string | number;
	jobTitle: string;
	startDate: string;
	endDate: string;
}
