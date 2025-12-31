/**
 * Service class for Change Log API operations
 * Route: /api/change-logs
 */
class ChangeLogService {
	private static instance: ChangeLogService;

	private constructor() {}

	static getInstance(): ChangeLogService {
		if (!ChangeLogService.instance) {
			ChangeLogService.instance = new ChangeLogService();
		}
		return ChangeLogService.instance;
	}

	/**
	 * Get change logs for a family tree
	 */
	async getByFamilyTreeId(familyTreeId: string) {
		const response = await fetch(`/api/change-logs?familyTreeId=${familyTreeId}`);
		if (!response.ok) {
			throw new Error('Failed to fetch change logs');
		}
		return response.json();
	}
}

export default ChangeLogService.getInstance();
