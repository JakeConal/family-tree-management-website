/**
 * Dashboard and statistics related types
 */

export interface FamilyTree {
	id: number;
	familyName: string;
	origin: string | null;
	establishYear: number | null;
	createdAt: string;
	treeOwner: {
		fullName: string;
	};
}

export interface FamilyStatistics {
	totalGenerations: number;
	totalMembers: number;
	livingMembers: number;
	memberGrowth: { count: number; percentage: number };
	deathTrend: { count: number; percentage: number };
	marriageTrend: { marriages: number; divorces: number };
	achievementGrowth: { count: number; percentage: number };
}
