import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';
import { logChange } from '@/lib/utils';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; achievementId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, achievementId } = await params;
		const familyTreeId = parseInt(id);
		const achId = parseInt(achievementId);

		if (isNaN(familyTreeId) || isNaN(achId)) {
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

		// Fetch the achievement
		const achievement = await prisma.achievement.findFirst({
			where: {
				id: achId,
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
		});

		if (!achievement) {
			return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
		}

		return NextResponse.json(achievement);
	} catch (error) {
		console.error('Error fetching achievement:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; achievementId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, achievementId } = await params;
		const familyTreeId = parseInt(id);
		const achId = parseInt(achievementId);

		if (isNaN(familyTreeId) || isNaN(achId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const body = await request.json();
		const { achievementTypeId, achieveDate, title, description } = body;

		// Validation
		if (achievementTypeId && typeof achievementTypeId !== 'number') {
			return NextResponse.json({ error: 'Invalid achievement type ID' }, { status: 400 });
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

		// Verify the achievement exists and belongs to this family tree
		const existingAchievement = await prisma.achievement.findFirst({
			where: {
				id: achId,
				familyMember: {
					familyTreeId: familyTreeId,
				},
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

		if (!existingAchievement) {
			return NextResponse.json({ error: 'Achievement not found in this family tree' }, { status: 404 });
		}

		// Verify the achievement type exists if provided
		if (achievementTypeId) {
			const achievementType = await prisma.achievementType.findUnique({
				where: {
					id: achievementTypeId,
				},
			});

			if (!achievementType) {
				return NextResponse.json({ error: 'Achievement type not found' }, { status: 404 });
			}
		}

		// Store old data for logging
		const oldData = {
			achievementType: existingAchievement.achievementType.typeName,
			achieveDate: existingAchievement.achieveDate,
			title: existingAchievement.title,
			description: existingAchievement.description,
		};

		// Update the achievement
		const updatedAchievement = await prisma.achievement.update({
			where: {
				id: achId,
			},
			data: {
				achievementTypeId: achievementTypeId || existingAchievement.achievementTypeId,
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

		// Log the achievement update
		await logChange('Achievement', updatedAchievement.id, 'UPDATE', familyTreeId, session.user.id, oldData, {
			familyMemberName: updatedAchievement.familyMember.fullName,
			achievementType: updatedAchievement.achievementType.typeName,
			achieveDate: updatedAchievement.achieveDate,
			title: updatedAchievement.title,
			description: updatedAchievement.description,
		});

		return NextResponse.json(updatedAchievement);
	} catch (error) {
		console.error('Error updating achievement:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; achievementId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, achievementId } = await params;
		const familyTreeId = parseInt(id);
		const achId = parseInt(achievementId);

		if (isNaN(familyTreeId) || isNaN(achId)) {
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

		// Verify the achievement exists and belongs to this family tree
		const existingAchievement = await prisma.achievement.findFirst({
			where: {
				id: achId,
				familyMember: {
					familyTreeId: familyTreeId,
				},
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

		if (!existingAchievement) {
			return NextResponse.json({ error: 'Achievement not found in this family tree' }, { status: 404 });
		}

		// Store old data for logging
		const oldData = {
			familyMemberName: existingAchievement.familyMember.fullName,
			achievementType: existingAchievement.achievementType.typeName,
			achieveDate: existingAchievement.achieveDate,
			title: existingAchievement.title,
			description: existingAchievement.description,
		};

		// Delete the achievement
		await prisma.achievement.delete({
			where: {
				id: achId,
			},
		});

		// Log the achievement deletion
		await logChange('Achievement', achId, 'DELETE', familyTreeId, session.user.id, oldData, null);

		return NextResponse.json({ message: 'Achievement deleted successfully' });
	} catch (error) {
		console.error('Error deleting achievement:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
