/**
 * Change log related types
 */

export interface ChangeLog {
	id: number;
	entityType: string;
	entityId: number;
	action: string;
	userId: string | null;
	familyTreeId: number;
	oldValues: string | null;
	newValues: string | null;
	createdAt: string;
	user?: {
		name: string | null;
		email: string | null;
	} | null;
}

export interface ChangeDetail {
	field: string;
	oldValue: string | null | undefined;
	newValue: string | null | undefined;
	type?: string;
}

export interface FamilyMemberData {
	fullName?: string;
	gender?: string;
	birthday?: string;
	address?: string;
	isAdopted?: boolean;
	parentId?: number;
	generation?: number;
	[key: string]: unknown;
}

export interface AchievementData {
	title?: string;
	achieveDate?: string;
	description?: string;
	note?: string;
	familyMemberId?: number;
	familyMemberName?: string;
	achievementTypeId?: number;
	achievementTypeName?: string;
	[key: string]: unknown;
}

export interface SpouseRelationshipData {
	familyMember1Id?: number;
	familyMember2Id?: number;
	relationshipEstablished?: string;
	relationshipEnd?: string;
	relationshipType?: string;
	marriageDate?: string;
	divorceDate?: string;
	[key: string]: unknown;
}

export interface OccupationData {
	title?: string;
	jobTitle?: string;
	startDate?: string;
	endDate?: string;
	familyMemberId?: number;
	[key: string]: unknown;
}

export interface BurialPlace {
	location: string;
	startDate?: string;
	endDate?: string | null;
}

export interface PassingRecordData {
	dateOfPassing?: string;
	passingDate?: string;
	familyMemberId?: number;
	familyMemberName?: string;
	causeOfDeath?: string;
	causeOfDeathId?: number;
	placeOfDeath?: string;
	buriedPlaces?: BurialPlace[];
	[key: string]: unknown;
}

export type ChangeLogData = (
	| FamilyMemberData
	| AchievementData
	| SpouseRelationshipData
	| OccupationData
	| PassingRecordData
) &
	Record<string, unknown>;
