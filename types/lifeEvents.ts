/**
 * Life events related types
 */

export interface AchievementType {
	id: number;
	typeName: string;
}

export interface Achievement {
	id: number;
	title: string;
	achieveDate: Date | null;
	description: string | null;
	familyMember: {
		id: number;
		fullName: string;
	};
	achievementType: {
		id: number;
		typeName: string;
	};
}

export interface GroupedAchievements {
	[year: string]: Achievement[];
}

export interface PassingRecord {
	id: number;
	dateOfPassing: Date;
	familyMember: {
		id: number;
		fullName: string;
	};
	causeOfDeath: {
		id: number;
		causeName: string;
	} | null;
	buriedPlaces: {
		id: number;
		location: string;
		startDate: Date | null;
		endDate: Date | null;
	}[];
}

export interface GroupedPassingRecords {
	[year: string]: PassingRecord[];
}

export interface SpouseRelationship {
	id: number;
	marriageDate: Date;
	relationshipEstablished?: Date | string;
	divorceDate: Date | null;
	familyMember1: {
		id: number;
		fullName: string;
	};
	familyMember2: {
		id: number;
		fullName: string;
	};
}

export interface LifeEvent {
	id: string;
	title: string;
	description: string;
	relationshipId: number;
	date: Date;
	type: 'Married' | 'Divorce' | 'Birth Event';
	person1?: string;
	person2?: string;
}

export interface GroupedLifeEvents {
	[year: string]: LifeEvent[];
}

export type LifeEventType = 'Married' | 'Divorce' | 'Birth Event';
