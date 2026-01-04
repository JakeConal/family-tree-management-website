import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';

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

		// Build query based on role
		const whereClause: any = { id: familyTreeId };

		if (sessionData.isGuest) {
			// Guest can only access their assigned family tree
			if (sessionData.guestFamilyTreeId !== familyTreeId) {
				return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
			}
		} else if (sessionData.isOwner) {
			// Owner can only access their own trees
			whereClause.treeOwner = {
				userId: sessionData.user.id,
			};
		}

		const familyTree = await prisma.familyTree.findFirst({
			where: whereClause,
			select: {
				id: true,
				familyName: true,
				origin: true,
				establishYear: true,
				createdAt: true,
				treeOwner: {
					select: {
						fullName: true,
					},
				},
			},
		});

		if (!familyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
		}

		return NextResponse.json(familyTree);
	} catch (error) {
		console.error('Error fetching family tree:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can update family tree
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id } = await params;
		const familyTreeId = parseInt(id);

		if (isNaN(familyTreeId)) {
			return NextResponse.json({ error: 'Invalid family tree ID' }, { status: 400 });
		}

		const body = await request.json();
		const { familyName, origin, establishYear } = body;

		if (!familyName || typeof familyName !== 'string' || familyName.trim().length === 0) {
			return NextResponse.json({ error: 'Family name is required' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the owner has access to this family tree
		const existingFamilyTree = await prisma.familyTree.findFirst({
			where: {
				id: familyTreeId,
				treeOwner: {
					userId: sessionData.user.id,
				},
			},
		});

		if (!existingFamilyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
		}

		// Get old values for change log
		const oldValues = {
			familyName: existingFamilyTree.familyName,
			origin: existingFamilyTree.origin,
			establishYear: existingFamilyTree.establishYear,
		};

		// Update the family tree
		const updatedFamilyTree = await prisma.familyTree.update({
			where: {
				id: familyTreeId,
			},
			data: {
				familyName: familyName.trim(),
				origin: origin?.trim() || null,
				establishYear: establishYear ? parseInt(establishYear) : null,
			},
			select: {
				id: true,
				familyName: true,
				origin: true,
				establishYear: true,
				createdAt: true,
				treeOwner: {
					select: {
						fullName: true,
					},
				},
			},
		});

		// Log the change
		const { logChange } = await import('../../../../lib/utils');
		await logChange('FamilyTree', familyTreeId, 'UPDATE', familyTreeId, sessionData.user.id, oldValues, {
			familyName: updatedFamilyTree.familyName,
			origin: updatedFamilyTree.origin,
			establishYear: updatedFamilyTree.establishYear,
		});

		return NextResponse.json(updatedFamilyTree);
	} catch (error) {
		console.error('Error updating family tree:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can delete family tree
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id } = await params;
		const familyTreeId = parseInt(id);

		if (isNaN(familyTreeId)) {
			return NextResponse.json({ error: 'Invalid family tree ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the owner has access to this family tree
		const existingFamilyTree = await prisma.familyTree.findFirst({
			where: {
				id: familyTreeId,
				treeOwner: {
					userId: sessionData.user.id,
				},
			},
		});

		if (!existingFamilyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
		}

		// Delete the family tree (cascade will handle related records)
		await prisma.familyTree.delete({
			where: {
				id: familyTreeId,
			},
		});

		return NextResponse.json({ message: 'Family tree deleted successfully' });
	} catch (error) {
		console.error('Error deleting family tree:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
