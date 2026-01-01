// Extended session types are declared in auth.ts module augmentation
// This file exports utility types for use in components

export type UserRole = 'owner' | 'guest';

export interface GuestSessionData {
	guestMemberId: number;
	guestFamilyTreeId: number;
	guestEditorId: number;
}

export interface ExtendedSession {
	user: {
		id: string;
		email?: string | null;
		name?: string | null;
		image?: string | null;
	};
	role?: UserRole;
	guestMemberId?: number;
	guestFamilyTreeId?: number;
	guestEditorId?: number;
}

