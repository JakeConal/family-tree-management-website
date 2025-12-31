import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const familyTreeId = parseInt(id);
		if (isNaN(familyTreeId)) {
			return NextResponse.json({ error: 'Invalid family tree ID' }, { status: 400 });
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

		// Fetch all spouse relationships for this family tree
		const spouseRelationships = await prisma.spouseRelationship.findMany({
			where: {
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
			orderBy: {
				marriageDate: 'desc',
			},
		});

		return NextResponse.json(spouseRelationships);
	} catch (error) {
		console.error('Error fetching life events:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

