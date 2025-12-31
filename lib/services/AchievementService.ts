/**
 * Service class for Achievement API operations
 * Routes: /api/achievements, /api/achievement-types
 */
class AchievementService {
	private static instance: AchievementService;

	private constructor() {}

	static getInstance(): AchievementService {
		if (!AchievementService.instance) {
			AchievementService.instance = new AchievementService();
		}
		return AchievementService.instance;
	}

	/**
	 * Get achievements with filters
	 */
	async getAll(params: { treeId?: string; typeId?: string; memberId?: string; startDate?: string; endDate?: string }) {
		const queryParams = new URLSearchParams();
		if (params.treeId) queryParams.append('treeId', params.treeId);
		if (params.typeId) queryParams.append('typeId', params.typeId);
		if (params.memberId) queryParams.append('memberId', params.memberId);
		if (params.startDate) queryParams.append('startDate', params.startDate);
		if (params.endDate) queryParams.append('endDate', params.endDate);

		const response = await fetch(`/api/achievements?${queryParams.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch achievements');
		}
		return response.json();
	}

	/**
	 * Delete an achievement
	 */
	async delete(id: string) {
		const response = await fetch(`/api/achievements?id=${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) {
			throw new Error('Failed to delete achievement');
		}
		return response.json();
	}

	/**
	 * Get achievement types
	 */
	async getTypes(treeId?: string) {
		const url = treeId ? `/api/achievement-types?treeId=${treeId}` : '/api/achievement-types';
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error('Failed to fetch achievement types');
		}
		return response.json();
	}
}

export default AchievementService.getInstance();
