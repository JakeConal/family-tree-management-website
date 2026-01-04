/**
 * Family-related types used across the application
 */

import { FamilyMember as PrismaFamilyMember } from '@prisma/client';

export interface FamilyMember {
	id: number;
	fullName: string;
	gender: string | null;
	birthday: Date | null;
	generation?: number | string | null;
	hasProfilePicture?: boolean | null;
	passingRecords?: unknown[];
	parent?: {
		id: number;
		fullName: string;
	} | null;
}

export interface ExtendedFamilyMember extends PrismaFamilyMember {
	parent?: {
		id: number;
		fullName: string;
	} | null;
	children?: {
		id: number;
		fullName: string;
	}[];
	divorceDate?: Date | null;
	hasProfilePicture?: boolean;
	spouse1?: {
		divorceDate: Date | null;
		familyMember2: {
			id: number;
			fullName: string;
		};
	}[];
	spouse2?: {
		divorceDate: Date | null;
		familyMember1: {
			id: number;
			fullName: string;
		};
	}[];
	passingRecords?: {
		id: number;
		dateOfPassing: Date;
	}[];
	achievements?: {
		id: number;
		title: string;
		achieveDate: Date | null;
		achievementType: {
			typeName: string;
		};
	}[];
	occupations?: {
		id: number;
		jobTitle: string;
		startDate: Date | null;
		endDate: Date | null;
	}[];
	birthPlaces?: {
		placeOfOrigin: {
			location: string;
		};
	}[];
}
