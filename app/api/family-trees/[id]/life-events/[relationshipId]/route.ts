import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, relationshipId } = await params;
		const familyTreeId = parseInt(id);
		const relId = parseInt(relationshipId);

		if (isNaN(familyTreeId) || isNaN(relId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the user has access to this family tree
		const familyTree = await prisma.familyTree.findFirst({
			where: {
				id: familyTreeId,
				treeOwner: {
					userId: session.user.id,
				},
			},
		});

		if (!familyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
		}

		// Fetch the spouse relationship
		const relationship = await prisma.spouseRelationship.findFirst({
			where: {
				id: relId,
				OR: [
					{
						familyMember1: {
							familyTreeId: familyTreeId,
						},
					},
					{
						familyMember2: {
							familyTreeId: familyTreeId,
						},
					},
				],
			},
			include: {
				familyMember1: {
					select: {
						id: true,
						fullName: true,
					},
				},
				familyMember2: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		if (!relationship) {
			return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
		}

		return NextResponse.json(relationship);
	} catch (error) {
		console.error('Error fetching relationship:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

