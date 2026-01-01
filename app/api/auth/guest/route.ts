import { NextRequest, NextResponse } from 'next/server';

import { signIn } from '@/auth';
import { getPrisma } from '@/lib/prisma';

/**
 * Guest login API endpoint
 * Validates access code and initiates guest session
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { accessCode } = body;

		if (!accessCode || typeof accessCode !== 'string') {
			return NextResponse.json({ error: 'Mã truy cập là bắt buộc' }, { status: 400 });
		}

		// Validate access code format (45 characters)
		if (accessCode.length !== 45) {
			return NextResponse.json({ error: 'Mã truy cập không hợp lệ' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Check if access code exists
		// Using findFirst until Prisma client is regenerated after migration
		const guestEditor = await prisma.guestEditor.findFirst({
			where: { accessCode },
			include: {
				familyMember: {
					select: {
						id: true,
						fullName: true,
					},
				},
				familyTree: {
					select: {
						id: true,
						familyName: true,
					},
				},
			},
		});

		if (!guestEditor) {
			return NextResponse.json({ error: 'Mã truy cập không tồn tại' }, { status: 404 });
		}

		// Check if code has expired (48 hours)
		const fortyEightHoursAgo = new Date();
		fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

		if (guestEditor.createDate < fortyEightHoursAgo) {
			return NextResponse.json({ error: 'Mã đã hết hạn, vui lòng liên hệ quản trị viên' }, { status: 401 });
		}

		// Return success with redirect URL
		// The actual authentication will be handled by NextAuth signIn on client side
		return NextResponse.json({
			success: true,
			message: 'Mã truy cập hợp lệ',
			redirectUrl: `/family-trees/${guestEditor.familyTreeId}`,
			guestInfo: {
				memberName: guestEditor.familyMember.fullName,
				familyTreeName: guestEditor.familyTree.familyName,
				familyTreeId: guestEditor.familyTreeId,
			},
		});
	} catch (error) {
		console.error('Error validating guest access code:', error);
		return NextResponse.json({ error: 'Đã xảy ra lỗi, vui lòng thử lại' }, { status: 500 });
	}
}
