/**
 * Service class for Family Tree API operations
 * Route: /api/family-trees
 */
class FamilyTreeService {
	private static instance: FamilyTreeService;

	private constructor() {}

	static getInstance(): FamilyTreeService {
		if (!FamilyTreeService.instance) {
			FamilyTreeService.instance = new FamilyTreeService();
		}
		return FamilyTreeService.instance;
	}

	/**
	 * Get a family tree by ID
	 */
	async getById(id: string) {
		const response = await fetch(`/api/family-trees/${id}`);
		if (!response.ok) {
			throw new Error('Failed to fetch family tree');
		}
		return response.json();
	}

	/**
	 * Get members of a family tree
	 */
	async getMembers(id: string) {
		const response = await fetch(`/api/family-trees/${id}/members`);
		if (!response.ok) {
			throw new Error('Failed to fetch family tree members');
		}
		return response.json();
	}

	/**
	 * Update a family tree
	 */
	async update(id: string, data: { familyName: string; establishYear: number }) {
		const response = await fetch(`/api/family-trees/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error('Failed to update family tree');
		}
		return response.json();
	}

	/**
	 * Delete a family tree
	 */
	async delete(id: string) {
		const response = await fetch(`/api/family-trees/${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) {
			throw new Error('Failed to delete family tree');
		}
		return response.json();
	}

	/**
	 * Get achievement types for a family tree
	 */
	async getAchievementTypes(id: string) {
		const response = await fetch(`/api/family-trees/${id}/achievement-types`);
		if (!response.ok) {
			throw new Error('Failed to fetch achievement types');
		}
		return response.json();
	}

	/**
	 * Check if a member has passing records
	 */
	async checkPassingRecords(treeId: string, memberId: string) {
		const response = await fetch(`/api/family-trees/${treeId}/passing-records/check/${memberId}`);
		if (!response.ok) {
			throw new Error('Failed to check passing records');
		}
		return response.json();
	}

	/**
	 * Create an achievement for a family tree
	 */
	async createAchievement(
		treeId: string,
		data: {
			memberId: number;
			achievementTypeId: number;
			achieveDate: string;
			note?: string;
		}
	) {
		const response = await fetch(`/api/family-trees/${treeId}/achievements`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error('Failed to create achievement');
		}
		return response.json();
	}

	/**
	 * Create a passing record for a family tree
	 */
	async createPassingRecord(
		treeId: string,
		data: {
			familyMemberId: number;
			passingDate: string;
			causeOfDeath?: string;
			placeOfDeath?: string;
		}
	) {
		const response = await fetch(`/api/family-trees/${treeId}/passing-records`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error('Failed to create passing record');
		}
		return response.json();
	}
}

export default FamilyTreeService.getInstance();
