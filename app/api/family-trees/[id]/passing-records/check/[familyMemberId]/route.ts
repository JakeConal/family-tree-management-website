import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; familyMemberId: string }> }
) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, familyMemberId } = await params;
		const familyTreeId = parseInt(id);
		const memberId = parseInt(familyMemberId);

		if (isNaN(familyTreeId) || isNaN(memberId)) {
			return NextResponse.json({ error: 'Invalid family tree ID or family member ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify access based on role
		if (sessionData.isGuest) {
			// Guest can only access their assigned family tree
			if (sessionData.guestFamilyTreeId !== familyTreeId) {
				return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
			}
		} else if (sessionData.isOwner) {
			// Verify the owner has access to this family tree
			const familyTree = await prisma.familyTree.findFirst({
				where: {
					id: familyTreeId,
					treeOwner: {
						userId: sessionData.user.id,
					},
				},
			});

			if (!familyTree) {
				return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
			}
		}

		// Check if the family member already has a passing record
		const existingPassingRecord = await prisma.passingRecord.findFirst({
			where: {
				familyMemberId: memberId,
			},
		});

		return NextResponse.json({
			hasRecord: !!existingPassingRecord,
			passingRecord: existingPassingRecord
				? {
						id: existingPassingRecord.id,
						dateOfPassing: existingPassingRecord.dateOfPassing,
					}
				: null,
		});
	} catch (error) {
		console.error('Error checking passing record:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
