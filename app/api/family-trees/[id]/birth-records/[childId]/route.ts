import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';
import { logChange } from '@/lib/utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; childId: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, childId } = await params;
		const familyTreeId = parseInt(id);
		const childMemberId = parseInt(childId);

		if (isNaN(familyTreeId) || isNaN(childMemberId)) {
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

		// Fetch the child member with parent info
		const childMember = await prisma.familyMember.findFirst({
			where: {
				id: childMemberId,
				familyTreeId: familyTreeId,
			},
			select: {
				id: true,
				fullName: true,
				parentId: true,
				relationshipEstablishedDate: true,
				parent: {
					select: {
						id: true,
						fullName: true,
						birthday: true,
					},
				},
			},
		});

		if (!childMember) {
			return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
		}

		if (!childMember.parentId) {
			return NextResponse.json({ error: 'Family member does not have a parent' }, { status: 400 });
		}

		return NextResponse.json({
			parent: childMember.parent,
			child: {
				id: childMember.id,
				fullName: childMember.fullName,
			},
			birthDate: childMember.relationshipEstablishedDate,
		});
	} catch (error) {
		console.error('Error fetching birth record:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; childId: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can update birth records
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id, childId } = await params;
		const familyTreeId = parseInt(id);
		const childMemberId = parseInt(childId);

		if (isNaN(familyTreeId) || isNaN(childMemberId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const body = await request.json();
		const { birthDate } = body;

		if (!birthDate) {
			return NextResponse.json({ error: 'Birth date is required' }, { status: 400 });
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

		// Fetch the child member with parent info
		const childMember = await prisma.familyMember.findFirst({
			where: {
				id: childMemberId,
				familyTreeId: familyTreeId,
			},
			select: {
				id: true,
				fullName: true,
				parentId: true,
				relationshipEstablishedDate: true,
				parent: {
					select: {
						id: true,
						fullName: true,
						birthday: true,
					},
				},
			},
		});

		if (!childMember) {
			return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
		}

		if (!childMember.parentId) {
			return NextResponse.json({ error: 'Family member does not have a parent' }, { status: 400 });
		}

		// Validate birth date
		const parsedBirthDate = new Date(birthDate);
		const today = new Date();

		if (isNaN(parsedBirthDate.getTime())) {
			return NextResponse.json({ error: 'Invalid birth date format' }, { status: 400 });
		}

		if (parsedBirthDate > today) {
			return NextResponse.json({ error: 'Birth date cannot be in the future' }, { status: 400 });
		}

		// Validate birth date is after parent's birthday
		if (childMember.parent?.birthday) {
			const parentBirthday = new Date(childMember.parent.birthday);
			if (parsedBirthDate < parentBirthday) {
				return NextResponse.json({ error: "Birth date must be after parent's birthday" }, { status: 400 });
			}
		}

		// Update the family member
		const updatedMember = await prisma.familyMember.update({
			where: {
				id: childMemberId,
			},
			data: {
				relationshipEstablishedDate: parsedBirthDate,
			},
			select: {
				id: true,
				fullName: true,
				relationshipEstablishedDate: true,
				parent: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
		});

		// Log the change
		await logChange(
			'FamilyMember',
			childMemberId,
			'UPDATE',
			familyTreeId,
			sessionData.user.id,
			{ relationshipEstablishedDate: childMember.relationshipEstablishedDate },
			{ relationshipEstablishedDate: updatedMember.relationshipEstablishedDate }
		);

		return NextResponse.json({
			parent: updatedMember.parent,
			child: {
				id: updatedMember.id,
				fullName: updatedMember.fullName,
			},
			birthDate: updatedMember.relationshipEstablishedDate,
		});
	} catch (error) {
		console.error('Error updating birth record:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
