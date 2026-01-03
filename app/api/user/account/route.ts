import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';

// Get user account information
export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const prisma = getPrisma();

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				password: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json({
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
			hasPassword: !!user.password,
		});
	} catch (error) {
		console.error('Error fetching user account:', error);
		return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
	}
}

// Update user account information (name/email)
export async function PATCH(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { name } = body;

		// Validate input
		if (!name) {
			return NextResponse.json({ error: 'Name is required' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Update user and TreeOwner in a transaction
		const updatedUser = await prisma.$transaction(async (tx) => {
			// Update user
			const user = await tx.user.update({
				where: { id: session.user.id },
				data: { name },
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					password: true,
					treeOwner: {
						select: {
							id: true,
						},
					},
				},
			});

			// Update TreeOwner fullName if TreeOwner exists
			if (user.treeOwner) {
				await tx.treeOwner.update({
					where: { id: user.treeOwner.id },
					data: { fullName: name },
				});
			}

			return user;
		});

		return NextResponse.json({
			id: updatedUser.id,
			name: updatedUser.name,
			email: updatedUser.email,
			image: updatedUser.image,
			hasPassword: !!updatedUser.password,
		});
	} catch (error) {
		console.error('Error updating user account:', error);
		return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
	}
}
