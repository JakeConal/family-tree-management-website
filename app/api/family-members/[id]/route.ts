import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
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
		const memberId = parseInt(id);

		if (isNaN(memberId)) {
			return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Build query based on role
		let whereClause: any = { id: memberId };

		if (sessionData.isGuest) {
			// Guest can only view members in their assigned family tree
			whereClause.familyTreeId = sessionData.guestFamilyTreeId;
		} else if (sessionData.isOwner) {
			// Owner can only view members in their own trees
			whereClause.familyTree = {
				treeOwner: {
					userId: sessionData.user.id,
				},
			};
		}

		const familyMember = await prisma.familyMember.findFirst({
			where: whereClause,
			select: {
				id: true,
				fullName: true,
				gender: true,
				birthday: true,
				address: true,
				generation: true,
				isRootPerson: true,
				isAdopted: true,
				familyTreeId: true,
				parentId: true,
				parent: {
					select: {
						id: true,
						fullName: true,
					},
				},
				children: {
					select: {
						id: true,
						fullName: true,
					},
				},
				spouse1: {
					select: {
						familyMember2: {
							select: {
								id: true,
								fullName: true,
							},
						},
					},
				},
				spouse2: {
					select: {
						familyMember1: {
							select: {
								id: true,
								fullName: true,
							},
						},
					},
				},
				achievements: {
					include: {
						achievementType: {
							select: {
								typeName: true,
							},
						},
					},
				},
				occupations: true,
				birthPlaces: {
					include: {
						placeOfOrigin: {
							select: {
								location: true,
							},
						},
					},
				},
				passingRecords: {
					include: {
						causeOfDeath: true,
						buriedPlaces: true,
					},
				},
			},
		});

		if (!familyMember) {
			return NextResponse.json({ error: 'Family member not found or access denied' }, { status: 404 });
		}

		// Add hasProfilePicture field
		const profileData = await prisma.familyMember.findUnique({
			where: { id: memberId },
			select: { profilePicture: true },
		});

		const memberWithProfilePicture = {
			...familyMember,
			hasProfilePicture: !!profileData?.profilePicture,
		};

		return NextResponse.json(memberWithProfilePicture);
	} catch (error) {
		console.error('Error fetching family member:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;
		const memberId = parseInt(id);

		if (isNaN(memberId)) {
			return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Build query based on role
		let whereClause: any = { id: memberId };

		if (sessionData.isGuest) {
			// Guest can only edit their own profile
			if (sessionData.guestMemberId !== memberId) {
				return NextResponse.json({ error: 'Bạn chỉ có thể sửa hồ sơ của mình' }, { status: 403 });
			}
			whereClause.familyTreeId = sessionData.guestFamilyTreeId;
		} else if (sessionData.isOwner) {
			// Owner can edit any member in their trees
			whereClause.familyTree = {
				treeOwner: {
					userId: sessionData.user.id,
				},
			};
		}

		// Verify the user has access to this family member
		const existingMember = await prisma.familyMember.findFirst({
			where: whereClause,
		});

		if (!existingMember) {
			return NextResponse.json({ error: 'Family member not found or access denied' }, { status: 404 });
		}

		// Handle multipart form data
		const formData = await request.formData();
		const fullName = formData.get('fullName') as string;
		const gender = formData.get('gender') as string;
		const birthday = formData.get('birthday') as string;
		const address = formData.get('address') as string;
		const generation = formData.get('generation') as string;
		const isAdopted = formData.get('isAdopted') === 'true';
		const profilePictureFile = formData.get('profilePicture') as File | null;

		if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
			return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
		}

		// Handle profile picture upload
		let profilePicture: Buffer | null = existingMember.profilePicture;
		let profilePictureType: string | null = existingMember.profilePictureType;

		if (profilePictureFile) {
			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
			if (!allowedTypes.includes(profilePictureFile.type)) {
				return NextResponse.json(
					{
						error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
					},
					{ status: 400 }
				);
			}

			// Validate file size (max 5MB)
			if (profilePictureFile.size > 5 * 1024 * 1024) {
				return NextResponse.json({ error: 'File size too large. Maximum size is 5MB.' }, { status: 400 });
			}

			// Convert file to buffer
			const arrayBuffer = await profilePictureFile.arrayBuffer();
			profilePicture = Buffer.from(arrayBuffer);
			profilePictureType = profilePictureFile.type;
		}

		// Validate gender
		let validatedGender: 'MALE' | 'FEMALE' | null = null;
		if (gender) {
			const upperGender = gender.toUpperCase();
			if (['MALE', 'FEMALE'].includes(upperGender)) {
				validatedGender = upperGender as 'MALE' | 'FEMALE';
			} else {
				return NextResponse.json({ error: 'Invalid gender. Must be MALE or FEMALE.' }, { status: 400 });
			}
		}

		// Get old values for change log
		const oldValues = {
			fullName: existingMember.fullName,
			gender: existingMember.gender,
			birthday: existingMember.birthday,
			address: existingMember.address,
			generation: existingMember.generation,
			isAdopted: existingMember.isAdopted,
		};

		// Update the family member
		const updatedMember = await prisma.familyMember.update({
			where: { id: memberId },
			data: {
				fullName: fullName.trim(),
				gender: validatedGender,
				birthday: birthday ? new Date(birthday) : null,
				address: address?.trim() || null,
				profilePicture: profilePicture,
				profilePictureType: profilePictureType,
				generation: generation?.trim() || null,
				isAdopted: isAdopted || false,
			},
			select: {
				id: true,
				fullName: true,
				gender: true,
				birthday: true,
				address: true,
				generation: true,
				isRootPerson: true,
				isAdopted: true,
				familyTreeId: true,
				parentId: true,
				parent: {
					select: {
						id: true,
						fullName: true,
					},
				},
				children: {
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
			memberId,
			'UPDATE',
			existingMember.familyTreeId,
			sessionData.isGuest ? null : sessionData.user.id,
			oldValues,
			{
			fullName: updatedMember.fullName,
			gender: updatedMember.gender,
			birthday: updatedMember.birthday,
			address: updatedMember.address,
			generation: updatedMember.generation,
			isAdopted: updatedMember.isAdopted,
		});

		return NextResponse.json(updatedMember);
	} catch (error) {
		console.error('Error updating family member:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can delete members
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id } = await params;
		const memberId = parseInt(id);

		if (isNaN(memberId)) {
			return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the owner has access to this family member
		const existingMember = await prisma.familyMember.findFirst({
			where: {
				id: memberId,
				familyTree: {
					treeOwner: {
						userId: sessionData.user.id,
					},
				},
			},
		});

		if (!existingMember) {
			return NextResponse.json({ error: 'Family member not found or access denied' }, { status: 404 });
		}

		// Check if this is the root member
		if (existingMember.isRootPerson) {
			return NextResponse.json({ error: 'Cannot delete the root family member' }, { status: 400 });
		}

		// Log the deletion before deleting
		await logChange(
			'FamilyMember',
			existingMember.id,
			'DELETE',
			existingMember.familyTreeId,
			sessionData.user.id,
			{
				fullName: existingMember.fullName,
				gender: existingMember.gender,
				birthday: existingMember.birthday,
				address: existingMember.address,
				profilePicture: existingMember.profilePicture,
				generation: existingMember.generation,
				isAdopted: existingMember.isAdopted,
				parentId: existingMember.parentId,
			},
			null
		);

		// Delete the family member (cascade will handle related records)
		await prisma.familyMember.delete({
			where: { id: memberId },
		});

		return NextResponse.json({ message: 'Family member deleted successfully' });
	} catch (error) {
		console.error('Error deleting family member:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
