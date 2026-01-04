import type { FamilyTree } from '@prisma/client';

interface SpouseRelationship {
	id: number;
	marriageDate: Date;
	divorceDate: Date | null;
	familyMember1: {
		id: number;
		fullName: string;
	};
	familyMember2: {
		id: number;
		fullName: string;
	};
}

class DivorceService {
	async recordDivorce(familyTreeId: string, member1Id: number, member2Id: number, divorceDate: string) {
		const response = await fetch(`/api/family-trees/${familyTreeId}/divorces`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				member1Id,
				member2Id,
				divorceDate,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to record divorce');
		}

		return response.json();
	}

	async getMarriedCouples(familyTreeId: string): Promise<SpouseRelationship[]> {
		const response = await fetch(`/api/family-trees/${familyTreeId}/divorces`);

		if (!response.ok) {
			throw new Error('Failed to fetch married couples');
		}

		return response.json();
	}
}

export default new DivorceService();
