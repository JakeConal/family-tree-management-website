import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';

/**
 * Generate guest invitation code for a family member
 * POST /api/family-trees/[id]/guest-invites
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can create guest invitations
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id } = await params;
		const familyTreeId = parseInt(id);

		if (isNaN(familyTreeId)) {
			return NextResponse.json({ error: 'Invalid family tree ID' }, { status: 400 });
		}

		const body = await request.json();
		const { familyMemberId } = body;

		if (!familyMemberId || isNaN(parseInt(familyMemberId))) {
			return NextResponse.json({ error: 'Valid family member ID is required' }, { status: 400 });
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

		// Verify the family member exists and belongs to this tree
		const familyMember = await prisma.familyMember.findFirst({
			where: {
				id: parseInt(familyMemberId),
				familyTreeId: familyTreeId,
			},
			select: {
				id: true,
				fullName: true,
			},
		});

		if (!familyMember) {
			return NextResponse.json({ error: 'Family member not found in this tree' }, { status: 404 });
		}

		// Check if there's an existing valid access code for this member
		const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
		const now = new Date();
		const expirationThreshold = new Date(now.getTime() - fortyEightHoursInMs);

		// Find the most recent access code for this member
		const existingGuestEditor = await prisma.guestEditor.findFirst({
			where: {
				familyMemberId: familyMember.id,
				familyTreeId: familyTreeId,
				createDate: {
					gte: expirationThreshold, // Only get codes created within the last 48 hours
				},
			},
			include: {
				familyMember: {
					select: {
						fullName: true,
					},
				},
			},
			orderBy: {
				createDate: 'desc',
			},
		});

		// If there's a valid existing code, return it
		if (existingGuestEditor) {
			const expiresAt = new Date(existingGuestEditor.createDate.getTime() + fortyEightHoursInMs);
			return NextResponse.json(
				{
					success: true,
					accessCode: existingGuestEditor.accessCode,
					familyMember: {
						id: familyMember.id,
						fullName: familyMember.fullName,
					},
					expiresAt: expiresAt.toISOString(),
					message: 'Mã truy cập còn hạn',
					isNew: false,
				},
				{ status: 200 }
			);
		}

		// No valid code found, create a new one
		// Generate 45-character access code
		// Using base64url encoding: 33 bytes -> 44 chars, we take 45 to be safe
		const accessCode = randomBytes(34).toString('base64url').slice(0, 45);

		// Create guest editor record
		const guestEditor = await prisma.guestEditor.create({
			data: {
				accessCode,
				familyMemberId: familyMember.id,
				familyTreeId: familyTreeId,
			},
			include: {
				familyMember: {
					select: {
						fullName: true,
					},
				},
			},
		});

		return NextResponse.json(
			{
				success: true,
				accessCode: guestEditor.accessCode,
				familyMember: {
					id: familyMember.id,
					fullName: familyMember.fullName,
				},
				expiresAt: new Date(guestEditor.createDate.getTime() + fortyEightHoursInMs).toISOString(),
				message: 'Mã truy cập đã được tạo thành công',
				isNew: true,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating guest invitation:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

/**
 * Get all guest invitations for a family tree
 * GET /api/family-trees/[id]/guest-invites
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can view guest invitations
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

		// Get all guest invitations for this tree
		const guestEditors = await prisma.guestEditor.findMany({
			where: {
				familyTreeId: familyTreeId,
			},
			include: {
				familyMember: {
					select: {
						id: true,
						fullName: true,
					},
				},
			},
			orderBy: {
				createDate: 'desc',
			},
		});

		// Calculate expiration status
		const now = new Date();
		const fortyEightHoursInMs = 48 * 60 * 60 * 1000;

		const invitations = guestEditors.map((ge) => {
			const expiresAt = new Date(ge.createDate.getTime() + fortyEightHoursInMs);
			const isExpired = now > expiresAt;

			return {
				id: ge.id,
				accessCode: ge.accessCode,
				familyMember: ge.familyMember,
				createdAt: ge.createDate.toISOString(),
				expiresAt: expiresAt.toISOString(),
				isExpired,
			};
		});

		return NextResponse.json(invitations);
	} catch (error) {
		console.error('Error fetching guest invitations:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

