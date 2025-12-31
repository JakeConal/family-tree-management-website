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

		// Get all achievement types (now global)
		let achievementTypes = await prisma.achievementType.findMany({
			orderBy: {
				typeName: 'asc',
			},
		});

		// If no achievement types exist globally, create the default ones
		if (achievementTypes.length === 0) {
			const defaultAchievementTypes = [
				'Academic',
				'Career',
				'Sport',
				'Health',
				'Artistic',
				'Environment',
				'Community',
				'Financial',
				'Skill Development',
				'Travel',
			];

			for (const typeName of defaultAchievementTypes) {
				await prisma.achievementType.create({
					data: {
						typeName,
					},
				});
			}

			// Fetch the newly created types
			achievementTypes = await prisma.achievementType.findMany({
				orderBy: {
					typeName: 'asc',
				},
			});
		}

		return NextResponse.json(achievementTypes);
	} catch (error) {
		console.error('Error fetching achievement types:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
