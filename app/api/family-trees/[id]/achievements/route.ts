import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';
import { logChange } from '@/lib/utils';

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

		// Fetch all achievements for this family tree
		const achievements = await prisma.achievement.findMany({
			where: {
				familyMember: {
					familyTreeId: familyTreeId,
				},
			},
			include: {
				familyMember: {
					select: {
						id: true,
						fullName: true,
					},
				},
				achievementType: {
					select: {
						id: true,
						typeName: true,
					},
				},
			},
			orderBy: {
				achieveDate: 'desc',
			},
		});

		return NextResponse.json(achievements);
	} catch (error) {
		console.error('Error fetching achievements:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

		const body = await request.json();
		const { familyMemberId, achievementTypeId, achieveDate, title, description } = body;

		// Validation
		if (!familyMemberId || typeof familyMemberId !== 'number') {
			return NextResponse.json({ error: 'Family member ID is required' }, { status: 400 });
		}

		if (!achievementTypeId || typeof achievementTypeId !== 'number') {
			return NextResponse.json({ error: 'Achievement type ID is required' }, { status: 400 });
		}

		if (!achieveDate) {
			return NextResponse.json({ error: 'Achievement date is required' }, { status: 400 });
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

		// Verify the family member belongs to this family tree
		const familyMember = await prisma.familyMember.findFirst({
			where: {
				id: familyMemberId,
				familyTreeId: familyTreeId,
			},
		});

		if (!familyMember) {
			return NextResponse.json({ error: 'Family member not found in this family tree' }, { status: 404 });
		}

		// Verify the achievement type exists (now global)
		const achievementType = await prisma.achievementType.findUnique({
			where: {
				id: achievementTypeId,
			},
		});

		if (!achievementType) {
			return NextResponse.json({ error: 'Achievement type not found in this family tree' }, { status: 404 });
		}

		// Create the achievement
		const achievement = await prisma.achievement.create({
			data: {
				familyMemberId: familyMemberId,
				achievementTypeId: achievementTypeId,
				achieveDate: new Date(achieveDate),
				title: title || null,
				description: description || null,
			},
			include: {
				familyMember: {
					select: {
						fullName: true,
					},
				},
				achievementType: {
					select: {
						typeName: true,
					},
				},
			},
		});

		// Log the achievement creation
		await logChange('Achievement', achievement.id, 'CREATE', familyTreeId, session.user.id, null, {
			familyMemberName: achievement.familyMember.fullName,
			achievementType: achievement.achievementType.typeName,
			achieveDate: achievement.achieveDate,
			title: achievement.title,
			description: achievement.description,
		});

		return NextResponse.json(achievement, { status: 201 });
	} catch (error) {
		console.error('Error creating achievement:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
