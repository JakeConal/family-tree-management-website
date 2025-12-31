/**
 * Family-related types used across the application
 */

export interface FamilyMember {
	id: number;
	fullName: string;
	gender: string | null;
	birthday: Date | null;
	generation?: number | string | null;
	hasProfilePicture?: boolean | null;
	passingRecords?: unknown[];
	parent?: {
		fullName: string;
	} | null;
}

export interface AchievementType {
	id: number;
	typeName: string;
}
