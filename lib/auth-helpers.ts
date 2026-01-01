import { Session } from 'next-auth';

import { auth } from '@/auth';

export interface SessionWithRole {
	user: {
		id: string;
		email?: string | null;
		name?: string | null;
		image?: string | null;
	} | null;
	isGuest: boolean;
	isOwner: boolean;
	guestMemberId: number | null;
	guestFamilyTreeId: number | null;
	guestEditorId: number | null;
	role: 'owner' | 'guest' | null;
}

/**
 * Get the current session with role information
 * Used in API routes to check user permissions
 */
export async function getSessionWithRole(): Promise<SessionWithRole> {
	const session = await auth();

	if (!session || !session.user) {
		return {
			user: null,
			isGuest: false,
			isOwner: false,
			guestMemberId: null,
			guestFamilyTreeId: null,
			guestEditorId: null,
			role: null,
		};
	}

	const role = session.role || 'owner';
	const isGuest = role === 'guest';
	const isOwner = role === 'owner';

	return {
		user: session.user,
		isGuest,
		isOwner,
		guestMemberId: session.guestMemberId ?? null,
		guestFamilyTreeId: session.guestFamilyTreeId ?? null,
		guestEditorId: session.guestEditorId ?? null,
		role,
	};
}

/**
 * Check if the current session has access to a family tree
 * @param familyTreeId - The family tree ID to check access for
 * @param treeOwnerId - The user ID of the tree owner (for owner check)
 * @returns true if user has access, false otherwise
 */
export async function hasAccessToFamilyTree(
	familyTreeId: number,
	treeOwnerId: string
): Promise<{ hasAccess: boolean; reason?: string }> {
	const sessionData = await getSessionWithRole();

	if (!sessionData.user) {
		return { hasAccess: false, reason: 'Not authenticated' };
	}

	// Guest users can only access their specific family tree
	if (sessionData.isGuest) {
		if (sessionData.guestFamilyTreeId === familyTreeId) {
			return { hasAccess: true };
		}
		return { hasAccess: false, reason: 'Guest can only access assigned family tree' };
	}

	// Owner users can only access their own trees
	if (sessionData.isOwner) {
		if (sessionData.user.id === treeOwnerId) {
			return { hasAccess: true };
		}
		return { hasAccess: false, reason: 'Owner can only access their own family trees' };
	}

	return { hasAccess: false, reason: 'Unknown role' };
}

/**
 * Check if the current session can edit a specific family member
 * @param memberId - The family member ID to check edit permission for
 * @returns true if user can edit, false otherwise
 */
export async function canEditFamilyMember(memberId: number): Promise<{ canEdit: boolean; reason?: string }> {
	const sessionData = await getSessionWithRole();

	if (!sessionData.user) {
		return { canEdit: false, reason: 'Not authenticated' };
	}

	// Guest users can only edit their own profile
	if (sessionData.isGuest) {
		if (sessionData.guestMemberId === memberId) {
			return { canEdit: true };
		}
		return { canEdit: false, reason: 'Bạn chỉ có thể sửa hồ sơ của mình' };
	}

	// Owner users can edit any member in their trees (verified separately)
	if (sessionData.isOwner) {
		return { canEdit: true };
	}

	return { canEdit: false, reason: 'Unknown role' };
}

/**
 * Check if user is authenticated (either owner or guest)
 */
export async function isAuthenticated(): Promise<boolean> {
	const session = await auth();
	return !!session?.user;
}

/**
 * Get user display info
 */
export function getUserDisplayInfo(session: Session | null): {
	displayName: string;
	isGuest: boolean;
} {
	if (!session || !session.user) {
		return { displayName: 'Guest', isGuest: true };
	}

	const role = session.role || 'owner';
	const isGuest = role === 'guest';

	return {
		displayName: session.user.name || session.user.email || 'User',
		isGuest,
	};
}

