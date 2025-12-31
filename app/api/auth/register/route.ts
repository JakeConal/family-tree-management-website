import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
	try {
		const { fullName, email, password } = await req.json();

		if (!fullName || !email || !password) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
		}

		const existingUser = await getPrisma().user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await getPrisma().user.create({
			data: {
				name: fullName,
				email,
				password: hashedPassword,
				treeOwner: {
					create: { fullName },
				},
			},
		});

		return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
	} catch (error) {
		console.error('REGISTER_ERROR:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
