import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';

// Update user password
export async function PATCH(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { currentPassword, newPassword } = body;

		// Validate input
		if (!currentPassword || !newPassword) {
			return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
		}

		// Validate new password length
		if (newPassword.length < 8) {
			return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Get user with password
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, password: true },
		});

		if (!user || !user.password) {
			return NextResponse.json({ error: 'User not found or no password set' }, { status: 404 });
		}

		// Verify current password
		const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

		if (!isPasswordValid) {
			return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		await prisma.user.update({
			where: { id: session.user.id },
			data: { password: hashedPassword },
		});

		return NextResponse.json({ message: 'Password updated successfully' });
	} catch (error) {
		console.error('Error updating password:', error);
		return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
	}
}
