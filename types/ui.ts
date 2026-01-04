/**
 * UI component prop types
 */

import type { ExtNode } from 'relatives-tree/lib/types';

import { ChangeLog } from './changelog';
import { FamilyMember, ExtendedFamilyMember } from './family';
import { LifeEventType } from './lifeEvents';

// Modal Props
export interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
}

export interface AllChangeLogsModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	onLogClick: (log: ChangeLog) => void;
}

export interface ChangeLogDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	changeLog: ChangeLog | null;
}

export interface EditFamilyTreeModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTree: {
		id: number;
		familyName: string;
		origin: string | null;
		establishYear: number | null;
	};
	onFamilyTreeUpdated: () => void;
}

export interface InviteGuestModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	familyTreeName: string;
	onCodeGenerated: (code: string) => void;
}

export interface GenerateAccessCodeModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	familyTreeName: string;
	onCodeGenerated: (code: string) => void;
}

export interface RecordAchievementModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	existingMembers: FamilyMember[];
	onAchievementRecorded: () => void;
}

export interface RecordPassingModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	existingMembers: FamilyMember[];
	onPassingRecorded: () => void;
}

export interface RecordDivorceModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	existingMembers: FamilyMember[];
	onDivorceRecorded: () => void;
}

export interface AddMemberModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	existingMembers: FamilyMember[];
	onMemberAdded: () => void;
}

export interface DivorcedSpousesModalProps {
	isOpen: boolean;
	onClose: () => void;
	spouses: ExtendedFamilyMember[];
	memberName: string;
	onSpouseClick: (spouseId: number) => void;
}

// Panel Props
export interface PanelRendererProps {
	pushMode?: boolean;
	className?: string;
}

export interface ExistingMember {
	id: number;
	fullName: string;
	gender: 'MALE' | 'FEMALE' | null;
	birthday: string | null;
	address: string | null;
	generation: string | null;
	isRootPerson: boolean | null;
	isAdopted: boolean | null;
	relationshipEstablishedDate?: string | null;
	hasProfilePicture?: boolean;
	birthPlaces?: {
		startDate: string;
		endDate: string;
		placeOfOrigin: {
			location: string;
		};
	}[];
	occupations?: {
		id: number;
		jobTitle: string;
		startDate: string | null;
		endDate: string | null;
	}[];
	parent?: {
		id: number;
		fullName: string;
	} | null;
	spouse1?: Array<{
		marriageDate?: string | null;
		divorceDate: Date | null;
		familyMember2: {
			id: number;
			fullName: string;
		};
	}>;
	spouse2?: Array<{
		marriageDate?: string | null;
		divorceDate: Date | null;
		familyMember1: {
			id: number;
			fullName: string;
		};
	}>;
}

export interface OccupationApiResponse {
	id: string | number;
	jobTitle: string;
	startDate: string;
	endDate: string;
}

export interface MemberPanelProps {
	mode: 'add' | 'view' | 'edit';
	memberId?: number;
	familyTreeId: string;
	existingMembers: FamilyMember[];
	selectedMemberId?: string;
	onClose: () => void;
}

export interface AchievementPanelProps {
	mode: 'add' | 'view' | 'edit';
	achievementId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
	onSuccess: () => void;
}

export interface PassingPanelProps {
	mode: 'add' | 'view' | 'edit';
	passingRecordId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
	onSuccess: () => void;
}

export interface BirthPanelProps {
	mode: 'view' | 'edit';
	childMemberId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
}

export interface MarriagePanelProps {
	mode: 'view' | 'edit';
	relationshipId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
}

export interface DivorcePanelProps {
	mode: 'add' | 'view' | 'edit';
	divorceId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
}

export interface CreateFamilyTreePanelProps {
	onClose: () => void;
	onFamilyTreeCreated: () => void;
}

// Component Props
export interface LoadingScreenProps {
	message?: string;
}

export interface FamilyNodeProps {
	node: ExtNode;
	member: ExtendedFamilyMember;
	style: React.CSSProperties;
	onClick: () => void;
}

export interface ExSpouseCardProps {
	spouse: FamilyMember;
	onClick: () => void;
}

// Life Events UI Props
export interface YearSectionProps {
	year: number;
}

export interface TabNavigationProps {
	activeTab: 'achievement' | 'passing' | 'life-event';
	onTabChange: (tab: 'achievement' | 'passing' | 'life-event') => void;
}

export interface PassingCardProps {
	id: number;
	person: string;
	date: string;
	cause: string;
	onClick: (id: number) => void;
}

export interface LifeEventCardProps {
	id: number;
	title: string;
	person1: string;
	person2?: string;
	date: string;
	type: LifeEventType;
	onClick: (id: number) => void;
}

export interface EventCardProps {
	id: number;
	title: string;
	person: string;
	date: string;
	description: string;
	type: string;
	onClick: (id: number) => void;
}

// Sidebar
export interface NavigationItem {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	href: string;
	active?: boolean;
}

export interface NavigationButtonProps {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	href: string;
	isActive: boolean;
}

// Table Props
export interface MemberControlsProps {
	onAddMember: () => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	selectedGeneration: string;
	onGenerationChange: (value: string) => void;
	availableGenerations: number[];
}

export interface MemberTableProps {
	members: FamilyMember[];
	onMemberClick: (memberId: number) => void;
}
