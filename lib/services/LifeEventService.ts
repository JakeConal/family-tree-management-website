/**
 * Service class for Life Event API operations
 * Route: /api/life-events
 */
class LifeEventService {
	private static instance: LifeEventService;

	private constructor() {}

	static getInstance(): LifeEventService {
		if (!LifeEventService.instance) {
			LifeEventService.instance = new LifeEventService();
		}
		return LifeEventService.instance;
	}

	/**
	 * Get life events with filters
	 */
	async getAll(params: { treeId?: string; memberId?: string; startDate?: string; endDate?: string }) {
		const queryParams = new URLSearchParams();
		if (params.treeId) queryParams.append('treeId', params.treeId);
		if (params.memberId) queryParams.append('memberId', params.memberId);
		if (params.startDate) queryParams.append('startDate', params.startDate);
		if (params.endDate) queryParams.append('endDate', params.endDate);

		const response = await fetch(`/api/life-events?${queryParams.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch life events');
		}
		return response.json();
	}
}

export default LifeEventService.getInstance();
