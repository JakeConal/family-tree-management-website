import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';

// Delete user account
export async function DELETE(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { password } = body;

		const prisma = getPrisma();

		// Get user with password
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				password: true,
				treeOwner: {
					select: {
						familyTrees: {
							select: { id: true },
						},
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// If user has a password (credentials login), verify it
		if (user.password) {
			if (!password) {
				return NextResponse.json({ error: 'Password is required to delete account' }, { status: 400 });
			}

			const isPasswordValid = await bcrypt.compare(password, user.password);

			if (!isPasswordValid) {
				return NextResponse.json({ error: 'Password is incorrect' }, { status: 401 });
			}
		}
		// If user doesn't have a password (OAuth login), skip password verification

		// Delete user (cascade will handle related data)
		// Note: The schema has onDelete: Cascade for TreeOwner -> User relationship
		// This will automatically delete the TreeOwner and all associated FamilyTrees and FamilyMembers
		await prisma.user.delete({
			where: { id: session.user.id },
		});

		return NextResponse.json({
			message: 'Account deleted successfully',
			deletedTreesCount: user.treeOwner?.familyTrees.length || 0,
		});
	} catch (error) {
		console.error('Error deleting user account:', error);
		return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
	}
}
