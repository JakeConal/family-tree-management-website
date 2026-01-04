import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, relationshipId } = await params;
		const familyTreeId = parseInt(id);
		const relId = parseInt(relationshipId);

		if (isNaN(familyTreeId) || isNaN(relId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; relationshipId: string }> }
) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can update life events
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id, relationshipId } = await params;
		const familyTreeId = parseInt(id);
		const relId = parseInt(relationshipId);

		if (isNaN(familyTreeId) || isNaN(relId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const body = await request.json();
		const { marriageDate } = body;

		if (!marriageDate) {
			return NextResponse.json({ error: 'Marriage date is required' }, { status: 400 });
		}

		const prisma = getPrisma();

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

		// Fetch the spouse relationship with member details
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
						birthday: true,
					},
				},
				familyMember2: {
					select: {
						id: true,
						fullName: true,
						birthday: true,
					},
				},
			},
		});

		if (!relationship) {
			return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
		}

		// Validate marriage date
		const parsedMarriageDate = new Date(marriageDate);
		const today = new Date();

		if (isNaN(parsedMarriageDate.getTime())) {
			return NextResponse.json({ error: 'Invalid marriage date format' }, { status: 400 });
		}

		if (parsedMarriageDate > today) {
			return NextResponse.json({ error: 'Marriage date cannot be in the future' }, { status: 400 });
		}

		// Validate marriage date is after both members' birthdays
		if (relationship.familyMember1?.birthday) {
			const member1Birthday = new Date(relationship.familyMember1.birthday);
			if (parsedMarriageDate < member1Birthday) {
				return NextResponse.json({ error: "Marriage date must be after first member's birthday" }, { status: 400 });
			}
		}

		if (relationship.familyMember2?.birthday) {
			const member2Birthday = new Date(relationship.familyMember2.birthday);
			if (parsedMarriageDate < member2Birthday) {
				return NextResponse.json({ error: "Marriage date must be after second member's birthday" }, { status: 400 });
			}
		}

		// Update the spouse relationship
		const updatedRelationship = await prisma.spouseRelationship.update({
			where: {
				id: relId,
			},
			data: {
				marriageDate: parsedMarriageDate,
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

		return NextResponse.json(updatedRelationship);
	} catch (error) {
		console.error('Error updating relationship:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
