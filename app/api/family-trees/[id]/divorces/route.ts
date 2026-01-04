import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';
import { logChange } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const familyTreeId = parseInt(id);
		if (isNaN(familyTreeId)) {
			return NextResponse.json({ error: 'Invalid family tree ID' }, { status: 400 });
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

		// Get all undivored spouse relationships
		const spouseRelationships = await prisma.spouseRelationship.findMany({
			where: {
				familyMember1: {
					familyTreeId: familyTreeId,
				},
				divorceDate: null,
			},
			select: {
				id: true,
				marriageDate: true,
				divorceDate: true,
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

		return NextResponse.json(spouseRelationships);
	} catch (error) {
		console.error('Error fetching marriages:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can record divorces
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id } = await params;
		const familyTreeId = parseInt(id);
		if (isNaN(familyTreeId)) {
			return NextResponse.json({ error: 'Invalid family tree ID' }, { status: 400 });
		}

		const body = await request.json();
		const { member1Id, member2Id, divorceDate } = body;

		// Validation
		if (!member1Id || !member2Id) {
			return NextResponse.json({ error: 'Both members are required' }, { status: 400 });
		}

		if (!divorceDate) {
			return NextResponse.json({ error: 'Divorce date is required' }, { status: 400 });
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

		// Verify both family members exist in this family tree
		const member1 = await prisma.familyMember.findFirst({
			where: {
				id: member1Id,
				familyTreeId: familyTreeId,
			},
		});

		if (!member1) {
			return NextResponse.json({ error: 'Member 1 not found' }, { status: 404 });
		}

		const member2 = await prisma.familyMember.findFirst({
			where: {
				id: member2Id,
				familyTreeId: familyTreeId,
			},
		});

		if (!member2) {
			return NextResponse.json({ error: 'Member 2 not found' }, { status: 404 });
		}

		// Find the spouse relationship
		// The relationship is stored with the smaller ID as member1
		const minId = Math.min(member1Id, member2Id);
		const maxId = Math.max(member1Id, member2Id);

		const spouseRelationship = await prisma.spouseRelationship.findFirst({
			where: {
				familyMember1Id: minId,
				familyMember2Id: maxId,
			},
		});

		if (!spouseRelationship) {
			return NextResponse.json({ error: 'No marriage found between these members' }, { status: 404 });
		}

		// Check if already divorced
		if (spouseRelationship.divorceDate) {
			return NextResponse.json({ error: 'This couple is already divorced' }, { status: 400 });
		}

		// Validate divorce date is after marriage date
		const divorceDateObj = new Date(divorceDate);
		if (divorceDateObj <= spouseRelationship.marriageDate) {
			return NextResponse.json({ error: 'Divorce date must be after the marriage date' }, { status: 400 });
		}

		// Update the spouse relationship with divorce date
		const updatedRelationship = await prisma.spouseRelationship.update({
			where: {
				id: spouseRelationship.id,
			},
			data: {
				divorceDate: divorceDateObj,
			},
		});

		// Log the divorce event
		try {
			await logChange(
				'SpouseRelationship',
				spouseRelationship.id,
				'UPDATE',
				familyTreeId,
				sessionData.user.id,
				{
					divorceDate: null,
				},
				{
					divorceDate: updatedRelationship.divorceDate,
				}
			);
			console.log('Divorce event logged successfully for SpouseRelationship ID:', spouseRelationship.id);
		} catch (logError) {
			console.error('Failed to log divorce event:', logError);
			// Continue execution even if logging fails
		}

		return NextResponse.json(updatedRelationship, { status: 200 });
	} catch (error) {
		console.error('Error recording divorce:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
