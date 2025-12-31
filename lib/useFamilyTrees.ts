'use client';

import { useState, useEffect, useCallback } from 'react';

interface FamilyTree {
	id: number;
	familyName: string;
	createdAt: string;
}

const FAMILY_TREES_REFRESH_KEY = 'family-trees-refresh';

export function useFamilyTrees(session?: any) {
	const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Use stable session ID instead of entire session object to prevent refetches
	const userId = session?.user?.id;

	const fetchFamilyTrees = useCallback(async () => {
		// Don't fetch if no session
		if (!userId) {
			setFamilyTrees([]);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);

			// Add timeout to prevent hanging
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			const response = await fetch('/api/family-trees', {
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				const trees = await response.json();
				setFamilyTrees(trees);
			} else {
				console.error('Failed to fetch family trees');
				setFamilyTrees([]);
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				console.error('Fetch timeout - API call took too long');
			} else {
				console.error('Error fetching family trees:', error);
			}
			setFamilyTrees([]);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	const refreshFamilyTrees = useCallback(() => {
		// Update localStorage to trigger refresh in other components
		localStorage.setItem(FAMILY_TREES_REFRESH_KEY, Date.now().toString());
		setRefreshTrigger((prev) => prev + 1);
	}, []);

	// Listen for refresh triggers from localStorage (for cross-component communication)
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === FAMILY_TREES_REFRESH_KEY && e.newValue) {
				setRefreshTrigger((prev) => prev + 1);
			}
		};

		const handleCustomEvent = () => {
			setRefreshTrigger((prev) => prev + 1);
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener(FAMILY_TREES_REFRESH_KEY, handleCustomEvent);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener(FAMILY_TREES_REFRESH_KEY, handleCustomEvent);
		};
	}, []);

	useEffect(() => {
		fetchFamilyTrees();
	}, [fetchFamilyTrees, refreshTrigger]);

	return {
		familyTrees,
		loading,
		refreshFamilyTrees,
		refetch: fetchFamilyTrees,
	};
}

// Utility function to trigger family trees refresh from anywhere in the app
export function triggerFamilyTreesRefresh() {
	localStorage.setItem(FAMILY_TREES_REFRESH_KEY, Date.now().toString());
	// Also dispatch a custom event for same-tab updates
	window.dispatchEvent(new CustomEvent(FAMILY_TREES_REFRESH_KEY));
}
