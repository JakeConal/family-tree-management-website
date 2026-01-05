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
			include: {
				spouse1: true,
				spouse2: true,
			},
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
			parentId: existingMember.parentId,
		};

		// Handle spouse relationship logic based on parentId changes
		const newParentId = parentId ? parseInt(parentId) : null;
		const oldParentId = existingMember.parentId;
		const parentIdChanged = newParentId !== oldParentId;

		// Get current spouse relationships
		const currentSpouseRel =
			existingMember.spouse1.length > 0
				? existingMember.spouse1[0]
				: existingMember.spouse2.length > 0
					? existingMember.spouse2[0]
					: null;

		// Get old spouse ID to potentially delete their record
		let oldSpouseId: number | null = null;
		if (currentSpouseRel) {
			// Determine which spouse is the "other" person
			oldSpouseId =
				existingMember.spouse1.length > 0 ? currentSpouseRel.familyMember2Id : currentSpouseRel.familyMember1Id;
		}

		// Check if member has spouse (divorced or not)
		const hasSpouse = currentSpouseRel !== null;
		const isDivorced = currentSpouseRel?.divorceDate !== null;
		const isMarried = hasSpouse && !isDivorced;

		// Track if we need to delete old spouse relationship
		let shouldDeleteOldSpouseRel = false;
		let shouldDeleteOldSpouseMember = false;

		if (spouseId) {
			const newSpouseId = parseInt(spouseId);

			// Get information about the new spouse
			const newSpouseMember = await prisma.familyMember.findUnique({
				where: { id: newSpouseId },
				include: {
					spouse1: true,
					spouse2: true,
				},
			});

			if (!newSpouseMember) {
				return NextResponse.json({ error: 'Spouse member not found' }, { status: 404 });
			}

			const newSpouseRel =
				newSpouseMember.spouse1.length > 0
					? newSpouseMember.spouse1[0]
					: newSpouseMember.spouse2.length > 0
						? newSpouseMember.spouse2[0]
						: null;
			const newSpouseHasRelationship = newSpouseRel !== null;
			const newSpouseIsDivorced = newSpouseRel?.divorceDate !== null;

			// Always delete old spouse relationship when changing spouses
			if (hasSpouse) {
				shouldDeleteOldSpouseRel = true;

				// Apply rules for additional cleanup (deleting old spouse member)
				// Rule 1: Member has non-null parentID and is in spouse relationship
				if (oldParentId !== null && hasSpouse) {
					// Check if other person has non-null parentID AND (not in spouse table OR is divorced)
					if (newSpouseMember.parentId === null) {
						return NextResponse.json(
							{
								error: 'Cannot create spouse relationship. The target member must have a parent.',
							},
							{ status: 400 }
						);
					}
					if (newSpouseHasRelationship && !newSpouseIsDivorced) {
						return NextResponse.json(
							{
								error: 'Cannot create spouse relationship. The target member is already married.',
							},
							{ status: 400 }
						);
					}

					// Mark for deletion - delete the spouse member too
					shouldDeleteOldSpouseMember = true;
				}
				// Rule 2: Member has spouse relationship (not divorced) with null parentID
				else if (oldParentId === null && isMarried) {
					// Check if other person has non-null parentID AND (not in spouse table OR is divorced)
					if (newSpouseMember.parentId === null) {
						return NextResponse.json(
							{
								error: 'Cannot create spouse relationship. The target member must have a parent.',
							},
							{ status: 400 }
						);
					}
					if (newSpouseHasRelationship && !newSpouseIsDivorced) {
						return NextResponse.json(
							{
								error: 'Cannot create spouse relationship. The target member is already married.',
							},
							{ status: 400 }
						);
					}

					// For Rule 2, only delete the spouse relationship (keep the member)
					// shouldDeleteOldSpouseMember remains false
				}
				// Rule 3: Member is a former spouse (divorced)
				else if (isDivorced) {
					// Only need to check that other person has non-null parentID
					if (newSpouseMember.parentId === null) {
						return NextResponse.json(
							{
								error: 'Cannot create spouse relationship. The target member must have a parent.',
							},
							{ status: 400 }
						);
					}

					// For Rule 3, only delete the spouse relationship (keep the member)
					// shouldDeleteOldSpouseMember remains false
				}
			}
		}

		// Delete old spouse relationship and member if needed (before creating new member update)
		if (shouldDeleteOldSpouseRel && currentSpouseRel) {
			await prisma.spouseRelationship.delete({
				where: { id: currentSpouseRel.id },
			});

			// Delete old spouse member if Rule 1 applies
			if (shouldDeleteOldSpouseMember && oldSpouseId) {
				try {
					// First, update any children to point to the current member as their parent
					await prisma.familyMember.updateMany({
						where: { parentId: oldSpouseId },
						data: { parentId: memberId },
					});

					// Delete all related records before deleting the member
					await prisma.$transaction([
						// Delete achievements
						prisma.achievement.deleteMany({
							where: { familyMemberId: oldSpouseId },
						}),
						// Delete occupations
						prisma.occupation.deleteMany({
							where: { familyMemberId: oldSpouseId },
						}),
						// Delete passing records
						prisma.passingRecord.deleteMany({
							where: { familyMemberId: oldSpouseId },
						}),
						// Delete causes of death
						prisma.causeOfDeath.deleteMany({
							where: { familyMemberId: oldSpouseId },
						}),
						// Delete birth places
						prisma.familyMember_has_PlaceOfOrigin.deleteMany({
							where: { familyMemberId: oldSpouseId },
						}),
						// Delete guest editors
						prisma.guestEditor.deleteMany({
							where: { familyMemberId: oldSpouseId },
						}),
					]);

					// Finally, delete the member
					await prisma.familyMember.delete({
						where: { id: oldSpouseId },
					});
				} catch (error) {
					console.error('Failed to delete old spouse member:', error);
					// Continue execution even if deletion fails
				}
			}
		}

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

			// Check if there's an existing spouse relationship (after potential deletion above)
			const existingSpouseRelationship = await prisma.spouseRelationship.findFirst({
				where: {
					OR: [
						{ familyMember1Id: memberId, familyMember2Id: spouseIdNum },
						{ familyMember1Id: spouseIdNum, familyMember2Id: memberId },
					],
				},
			});

			if (existingSpouseRelationship) {
				// Update existing relationship (only update marriage date if relationship still exists)
				await prisma.spouseRelationship.update({
					where: { id: existingSpouseRelationship.id },
					data: {
						marriageDate: marriageDateObj,
					},
				});
			} else {
				// Create new relationship (either first time or after deletion)
				const spouseRelationship = await prisma.spouseRelationship.create({
					data: {
						familyMember1Id: memberId,
						familyMember2Id: spouseIdNum,
						marriageDate: marriageDateObj,
					},
				});

				// Log the spouse relationship creation (marriage event)
				try {
					await logChange(
						'SpouseRelationship',
						spouseRelationship.id,
						'CREATE',
						existingMember.familyTreeId,
						sessionData.user.id,
						null,
						{
							marriageDate: spouseRelationship.marriageDate,
							familyMember1Id: spouseRelationship.familyMember1Id,
							familyMember2Id: spouseRelationship.familyMember2Id,
						}
					);
					console.log(`[CHANGELOG] Marriage log created - SpouseRelationship ID: ${spouseRelationship.id}`);
				} catch (logError) {
					console.error('Failed to log marriage event:', logError);
				}
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
					if (occ.jobTitle && occ.startDate) {
						await prisma.occupation.create({
							data: {
								jobTitle: occ.jobTitle,
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
