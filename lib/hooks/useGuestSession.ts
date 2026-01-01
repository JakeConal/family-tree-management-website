'use client';

import { useSession } from 'next-auth/react';

import { ExtendedSession } from '@/types/auth';

interface UseGuestSessionReturn {
	session: ExtendedSession | null;
	isGuest: boolean;
	isOwner: boolean;
	guestMemberId: number | null;
	guestFamilyTreeId: number | null;
	guestEditorId: number | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

/**
 * Hook to access guest session information
 * Used in client components to conditionally render UI based on user role
 */
export function useGuestSession(): UseGuestSessionReturn {
	const { data: session, status } = useSession();

	const extendedSession = session as ExtendedSession | null;
	const isLoading = status === 'loading';
	const isAuthenticated = !!extendedSession?.user;

	const role = extendedSession?.role || 'owner';
	const isGuest = role === 'guest';
	const isOwner = role === 'owner';

	return {
		session: extendedSession,
		isGuest,
		isOwner,
		guestMemberId: extendedSession?.guestMemberId ?? null,
		guestFamilyTreeId: extendedSession?.guestFamilyTreeId ?? null,
		guestEditorId: extendedSession?.guestEditorId ?? null,
		isLoading,
		isAuthenticated,
	};
}

