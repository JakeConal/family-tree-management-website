import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Guest editors cannot view change logs
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền xem lịch sử thay đổi' }, { status: 403 });
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

		// Verify the owner has access to this family tree
		const familyTree = await prisma.familyTree.findFirst({
			where: {
				id: treeId,
				treeOwner: {
					userId: sessionData.user.id,
				},
			},
		});

		if (!familyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
		}

		// Get change logs for this family tree with user information
		const changeLogs = await prisma.changeLog.findMany({
			where: {
				familyTreeId: treeId,
			},
			include: {
				user: {
					select: {
						name: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
			take: 100, // Limit to last 100 changes
		});

		// Enrich change logs with family member names
		const enrichedLogs = await Promise.all(
			changeLogs.map(async (log) => {
				let familyMemberName = undefined;

				// If entityType is FamilyMember, get the member's name
				if (log.entityType === 'FamilyMember') {
					try {
						const member = await prisma.familyMember.findUnique({
							where: { id: log.entityId },
							select: { fullName: true },
						});
						if (member) {
							familyMemberName = member.fullName;
						}
					} catch {
						// Ignore errors when fetching member name
					}
				} else {
					// For other entity types, try to extract from newValues or oldValues
					try {
						const newValues = log.newValues ? JSON.parse(log.newValues) : null;
						const oldValues = log.oldValues ? JSON.parse(log.oldValues) : null;

						if (newValues?.familyMemberName) {
							familyMemberName = newValues.familyMemberName;
						} else if (oldValues?.familyMemberName) {
							familyMemberName = oldValues.familyMemberName;
						}
					} catch {
						// Ignore JSON parsing errors
					}
				}

				return {
					...log,
					familyMemberName: familyMemberName || undefined,
				};
			})
		);

		console.log(`[CHANGELOG API] Found ${enrichedLogs.length} change logs for family tree ${treeId}`);
		console.log(
			`[CHANGELOG API] SpouseRelationship logs:`,
			enrichedLogs.filter((log) => log.entityType === 'SpouseRelationship')
		);

		return NextResponse.json(enrichedLogs);
	} catch (error) {
		console.error('Error fetching change logs:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
