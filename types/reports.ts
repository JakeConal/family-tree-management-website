/**
 * Report generation related types
 */

import jsPDF from 'jspdf';

import { FamilyMember } from './family';
import { PassingRecord, SpouseRelationship, Achievement } from './lifeEvents';

export interface jsPDFWithAutoTable extends jsPDF {
	autoTable: (options: unknown) => jsPDF;
	lastAutoTable?: {
		finalY: number;
	};
}

export interface FamilyMemberWithDetails extends FamilyMember {
	passingRecords?: Array<PassingRecord & { passingDate?: string }>;
	spouseRelationships?: SpouseRelationship[];
	spouse1?: SpouseRelationship[];
	spouse2?: SpouseRelationship[];
	achievements?: Array<Achievement & { achievementDate?: string; achieveDate?: string | Date | null }>;
	parent?: {
		id: number;
		fullName: string;
	} | null;
}

export interface ChartDataset {
	label: string;
	data: number[];
	backgroundColor?: string | string[];
	borderColor?: string;
	borderWidth?: number;
	borderRadius?: number;
	tension?: number;
	fill?: boolean;
	pointBackgroundColor?: string;
	pointBorderColor?: string;
	pointBorderWidth?: number;
	pointRadius?: number;
	pointHoverRadius?: number;
}

export interface ChartData {
	labels: string[];
	datasets: ChartDataset[];
}

export interface AchievementCategory {
	name?: string;
	category?: string;
	count: number;
	color?: string;
}
