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
		const memberId = parseInt(id);

		if (isNaN(memberId)) {
			return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Build query based on role
		const whereClause: Record<string, unknown> = { id: memberId };

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
				relationshipEstablishedDate: true,
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
						marriageDate: true,
						divorceDate: true,
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
						marriageDate: true,
						divorceDate: true,
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
		const whereClause: Record<string, unknown> = { id: memberId };

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
		const parentId = formData.get('parentId') as string | null;
		const relationshipEstablishedDate = formData.get('relationshipEstablishedDate') as string | null;
		const spouseId = formData.get('spouseId') as string | null;
		const marriageDate = formData.get('marriageDate') as string | null;
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
				parentId: parentId ? parseInt(parentId) : null,
				relationshipEstablishedDate: relationshipEstablishedDate ? new Date(relationshipEstablishedDate) : null,
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
				relationshipEstablishedDate: true,
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
						marriageDate: true,
						divorceDate: true,
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
						marriageDate: true,
						divorceDate: true,
						familyMember1: {
							select: {
								id: true,
								fullName: true,
							},
						},
					},
				},
			},
		});

		// Handle spouse relationship updates
		if (spouseId) {
			const spouseIdNum = parseInt(spouseId);
			const marriageDateObj = marriageDate ? new Date(marriageDate) : new Date();

			// Check if there's an existing spouse relationship
			const existingSpouseRelationship = await prisma.spouseRelationship.findFirst({
				where: {
					OR: [
						{ familyMember1Id: memberId, familyMember2Id: spouseIdNum },
						{ familyMember1Id: spouseIdNum, familyMember2Id: memberId },
					],
				},
			});

			if (existingSpouseRelationship) {
				// Update existing relationship
				await prisma.spouseRelationship.update({
					where: { id: existingSpouseRelationship.id },
					data: {
						marriageDate: marriageDateObj,
					},
				});
			} else {
				// Create new relationship
				await prisma.spouseRelationship.create({
					data: {
						familyMember1Id: memberId,
						familyMember2Id: spouseIdNum,
						marriageDate: marriageDateObj,
					},
				});
			}
		}

		// Handle places of origin updates
		const placesOfOriginData = formData.get('placesOfOrigin') as string;
		if (placesOfOriginData) {
			try {
				// Remove existing places of origin
				await prisma.familyMember_has_PlaceOfOrigin.deleteMany({
					where: { familyMemberId: memberId },
				});

				// Add new places of origin
				const placesOfOrigin = JSON.parse(placesOfOriginData);
				for (const place of placesOfOrigin) {
					if (place.location && place.startDate) {
						// Find or create PlaceOfOrigin
						let placeOfOrigin = await prisma.placeOfOrigin.findFirst({
							where: { location: place.location },
						});

						if (!placeOfOrigin) {
							placeOfOrigin = await prisma.placeOfOrigin.create({
								data: { location: place.location },
							});
						}

						// Create FamilyMember_has_PlaceOfOrigin
						await prisma.familyMember_has_PlaceOfOrigin.create({
							data: {
								familyMemberId: memberId,
								placeOfOriginId: placeOfOrigin.id,
								startDate: new Date(place.startDate),
								endDate: place.endDate ? new Date(place.endDate) : null,
							},
						});
					}
				}
			} catch (error) {
				console.error('Error updating placesOfOrigin:', error);
			}
		}

		// Handle occupations updates
		const occupationsData = formData.get('occupations') as string;
		if (occupationsData) {
			try {
				// Remove existing occupations
				await prisma.occupation.deleteMany({
					where: { familyMemberId: memberId },
				});

				// Add new occupations
				const occupations = JSON.parse(occupationsData);
				for (const occ of occupations) {
					if ((occ.title || occ.jobTitle) && occ.startDate) {
						await prisma.occupation.create({
							data: {
								jobTitle: occ.title || occ.jobTitle,
								startDate: new Date(occ.startDate),
								endDate: occ.endDate ? new Date(occ.endDate) : null,
								familyMemberId: memberId,
							},
						});
					}
				}
			} catch (error) {
				console.error('Error updating occupations:', error);
			}
		}

		// Log the change
		await logChange(
			'FamilyMember',
			memberId,
			'UPDATE',
			existingMember.familyTreeId,
			sessionData.isGuest ? undefined : sessionData.user.id,
			oldValues,
			{
				fullName: updatedMember.fullName,
				gender: updatedMember.gender,
				birthday: updatedMember.birthday,
				address: updatedMember.address,
				generation: updatedMember.generation,
				isAdopted: updatedMember.isAdopted,
			}
		);

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
