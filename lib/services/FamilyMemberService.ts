/**
 * Service class for Family Member API operations
 * Route: /api/family-members
 */
class FamilyMemberService {
	private static instance: FamilyMemberService;

	private constructor() {}

	static getInstance(): FamilyMemberService {
		if (!FamilyMemberService.instance) {
			FamilyMemberService.instance = new FamilyMemberService();
		}
		return FamilyMemberService.instance;
	}

	/**
	 * Get family members with optional filters
	 */
	async getAll(params: { familyTreeId?: string; excludeDeceased?: boolean }) {
		const queryParams = new URLSearchParams();
		if (params.familyTreeId) queryParams.append('familyTreeId', params.familyTreeId);
		if (params.excludeDeceased) queryParams.append('excludeDeceased', 'true');

		const response = await fetch(`/api/family-members?${queryParams.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch family members');
		}
		return response.json();
	}

	/**
	 * Get a family member by ID
	 */
	async getById(id: string) {
		const response = await fetch(`/api/family-members/${id}`);
		if (!response.ok) {
			throw new Error('Failed to fetch family member');
		}
		return response.json();
	}

	/**
	 * Get profile picture for a family member
	 */
	async getProfilePicture(id: string) {
		const response = await fetch(`/api/family-members/${id}/profile-picture`);
		if (!response.ok) {
			return null;
		}
		return response;
	}

	/**
	 * Create a new family member
	 */
	async create(formData: FormData) {
		const response = await fetch(`/api/family-members`, {
			method: 'POST',
			body: formData,
		});
		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to create family member');
		}
		return response.json();
	}

	/**
	 * Update a family member
	 */
	async update(id: string, formData: FormData) {
		const response = await fetch(`/api/family-members/${id}`, {
			method: 'PUT',
			body: formData,
		});
		if (!response.ok) {
			throw new Error('Failed to update family member');
		}
		return response.json();
	}

	/**
	 * Delete a family member
	 */
	async delete(id: string) {
		const response = await fetch(`/api/family-members/${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) {
			throw new Error('Failed to delete family member');
		}
		return response.json();
	}
}

export default FamilyMemberService.getInstance();
