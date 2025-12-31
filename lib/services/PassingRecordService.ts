/**
 * Service class for Passing Record API operations
 * Route: /api/passing-records
 */
class PassingRecordService {
	private static instance: PassingRecordService;

	private constructor() {}

	static getInstance(): PassingRecordService {
		if (!PassingRecordService.instance) {
			PassingRecordService.instance = new PassingRecordService();
		}
		return PassingRecordService.instance;
	}

	/**
	 * Get passing records with filters
	 */
	async getAll(params: { treeId?: string; memberId?: string; startDate?: string; endDate?: string }) {
		const queryParams = new URLSearchParams();
		if (params.treeId) queryParams.append('treeId', params.treeId);
		if (params.memberId) queryParams.append('memberId', params.memberId);
		if (params.startDate) queryParams.append('startDate', params.startDate);
		if (params.endDate) queryParams.append('endDate', params.endDate);

		const response = await fetch(`/api/passing-records?${queryParams.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch passing records');
		}
		return response.json();
	}
}

export default PassingRecordService.getInstance();
