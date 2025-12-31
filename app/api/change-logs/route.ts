import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const familyTreeId = searchParams.get('familyTreeId');

		if (!familyTreeId) {
			return NextResponse.json({ error: 'Family tree ID is required' }, { status: 400 });
		}

		const treeId = parseInt(familyTreeId);
		if (isNaN(treeId)) {
			return NextResponse.json({ error: 'Invalid family tree ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the user has access to this family tree
		const familyTree = await prisma.familyTree.findFirst({
			where: {
				id: treeId,
				treeOwner: {
					userId: session.user.id,
				},
			},
		});

		if (!familyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
		}

		// Get change logs for this family tree
		const changeLogs = await prisma.changeLog.findMany({
			where: {
				familyTreeId: treeId,
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 100, // Limit to last 100 changes
		});

		return NextResponse.json(changeLogs);
	} catch (error) {
		console.error('Error fetching change logs:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
