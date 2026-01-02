import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';
import { logChange } from '@/lib/utils';

export async function GET(request: NextRequest) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const familyTreeId = searchParams.get('familyTreeId');

		if (!familyTreeId) {
			return NextResponse.json({ error: 'Family tree ID is required' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify access based on role
		if (sessionData.isGuest) {
			// Guest can only access their assigned family tree
			if (sessionData.guestFamilyTreeId !== parseInt(familyTreeId)) {
				return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
			}
		} else if (sessionData.isOwner) {
			// Verify the owner has access to this family tree
			const familyTree = await prisma.familyTree.findFirst({
				where: {
					id: parseInt(familyTreeId),
					treeOwner: {
						userId: sessionData.user.id,
					},
				},
			});

			if (!familyTree) {
				return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
			}
		}

		const familyMembers = await prisma.familyMember.findMany({
			where: { familyTreeId: parseInt(familyTreeId) },
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
						divorceDate: true,
						familyMember1: {
							select: {
								id: true,
								fullName: true,
							},
						},
					},
				},
				passingRecords: {
					select: {
						id: true,
						dateOfPassing: true,
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
			},
			orderBy: { id: 'asc' },
		});

		// Add hasProfilePicture field to each member
		const membersWithProfilePicture = await Promise.all(
			familyMembers.map(async (member) => {
				const profileData = await prisma.familyMember.findUnique({
					where: { id: member.id },
					select: { profilePicture: true },
				});
				return {
					...member,
					hasProfilePicture: !!profileData?.profilePicture,
				};
			})
		);

		return NextResponse.json(membersWithProfilePicture);
	} catch (error) {
		console.error('Error fetching family members:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can create new family members
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		// Handle multipart form data
		const formData = await request.formData();
		const fullName = formData.get('fullName') as string;
		const gender = formData.get('gender') as string;
		const birthday = formData.get('birthday') as string;
		const address = formData.get('address') as string;
		// const generation = formData.get('generation') as string;
		const isAdopted = formData.get('isAdopted') === 'true';
		const familyTreeId = formData.get('familyTreeId') as string;
		const parentId = formData.get('parentId') as string;
		const spouseId = formData.get('spouseId') as string;
		const relationshipEstablishedDate = formData.get('relationshipEstablishedDate') as string;
		const marriageDate = formData.get('marriageDate') as string;
		const profilePictureFile = formData.get('profilePicture') as File | null;

		if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
			return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
		}

		if (!familyTreeId || isNaN(parseInt(familyTreeId))) {
			return NextResponse.json({ error: 'Valid family tree ID is required' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the owner has access to this family tree
		const familyTree = await prisma.familyTree.findFirst({
			where: {
				id: parseInt(familyTreeId),
				treeOwner: {
					userId: sessionData.user.id,
				},
			},
		});

		if (!familyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
		}

		// If parentId is provided, verify it exists and belongs to the same family tree
		if (parentId) {
			const parent = await prisma.familyMember.findFirst({
				where: {
					id: parseInt(parentId),
					familyTreeId: parseInt(familyTreeId),
				},
			});

			if (!parent) {
				return NextResponse.json({ error: 'Parent not found in this family tree' }, { status: 400 });
			}
		}

		// Validate relationship dates based on relationship type
		if (birthday && (relationshipEstablishedDate || marriageDate)) {
			const birthDate = new Date(birthday);
			let relationshipDate: Date;

			if (parentId && relationshipEstablishedDate) {
				// Parent relationship validation
				relationshipDate = new Date(relationshipEstablishedDate);
				if (relationshipDate < birthDate) {
					return NextResponse.json(
						{
							error: 'Relationship date must be on or after birth date for parent relationships',
						},
						{ status: 400 }
					);
				}
			} else if (spouseId && marriageDate) {
				// Spouse relationship validation
				relationshipDate = new Date(marriageDate);
				const minSpouseDate = new Date(birthDate);
				minSpouseDate.setFullYear(minSpouseDate.getFullYear() + 7);

				if (relationshipDate < minSpouseDate) {
					return NextResponse.json(
						{
							error: 'Marriage date must be at least 7 years after birth date',
						},
						{ status: 400 }
					);
				}
			}
		}

		// Calculate generation based on relationship
		let calculatedGeneration: number | null = null;

		if (!parentId && !spouseId) {
			// Root member
			calculatedGeneration = 0;
		} else if (parentId) {
			// Parent relationship - get parent's generation + 1
			const parent = await prisma.familyMember.findUnique({
				where: { id: parseInt(parentId) },
				select: { generation: true },
			});

			if (parent?.generation !== null && parent?.generation !== undefined) {
				const parentGen = parseInt(parent.generation);
				calculatedGeneration = isNaN(parentGen) ? 1 : parentGen + 1;
			} else {
				// If parent has no generation, assume it's 0 and add 1
				calculatedGeneration = 1;
			}
		} else if (spouseId) {
			// Spouse relationship - use spouse's generation
			const spouse = await prisma.familyMember.findUnique({
				where: { id: parseInt(spouseId) },
				select: { generation: true },
			});

			if (spouse?.generation !== null && spouse?.generation !== undefined) {
				const spouseGen = parseInt(spouse.generation);
				calculatedGeneration = isNaN(spouseGen) ? 0 : spouseGen;
			} else {
				// If spouse has no generation, assume it's 0
				calculatedGeneration = 0;
			}
		}

		// Handle profile picture upload
		let profilePicture: Buffer | null = null;
		let profilePictureType: string | null = null;

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

		// Create the family member
		const familyMember = await prisma.familyMember.create({
			data: {
				fullName: fullName.trim(),
				gender: validatedGender,
				birthday: birthday ? new Date(birthday) : null,
				address: address?.trim() || null,
				profilePicture: profilePicture,
				profilePictureType: profilePictureType,
				generation: calculatedGeneration?.toString() || null,
				isAdopted: isAdopted || false,
				familyTreeId: parseInt(familyTreeId),
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
				familyTreeId: true,
				parentId: true,
				relationshipEstablishedDate: true,
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

		// If spouseId is provided, create the spouse relationship
		if (spouseId && marriageDate) {
			await prisma.spouseRelationship.create({
				data: {
					familyMember1Id: parseInt(spouseId),
					familyMember2Id: familyMember.id,
					marriageDate: new Date(marriageDate),
				},
			});
		}

		// Handle places of origin
		const placesOfOriginData = formData.get('placesOfOrigin') as string;
		if (placesOfOriginData) {
			try {
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
								familyMemberId: familyMember.id,
								placeOfOriginId: placeOfOrigin.id,
								startDate: new Date(place.startDate),
								endDate: place.endDate ? new Date(place.endDate) : null,
							},
						});
					}
				}
			} catch (error) {
				console.error('Error parsing placesOfOrigin:', error);
			}
		}

		// Handle occupations
		const occupationsData = formData.get('occupations') as string;
		if (occupationsData) {
			try {
				const occupations = JSON.parse(occupationsData);
				for (const occ of occupations) {
					if (occ.title && occ.startDate) {
						await prisma.occupation.create({
							data: {
								jobTitle: occ.title,
								startDate: new Date(occ.startDate),
								endDate: occ.endDate ? new Date(occ.endDate) : null,
								familyMemberId: familyMember.id,
							},
						});
					}
				}
			} catch (error) {
				console.error('Error parsing occupations:', error);
			}
		}

		// Log the creation
		await logChange('FamilyMember', familyMember.id, 'CREATE', parseInt(familyTreeId), sessionData.user.id, null, {
			fullName: familyMember.fullName,
			gender: familyMember.gender,
			birthday: familyMember.birthday,
			address: familyMember.address,
			generation: familyMember.generation,
			isAdopted: familyMember.isAdopted,
			parentId: familyMember.parentId,
			relationshipEstablishedDate: familyMember.relationshipEstablishedDate,
			spouseId: spouseId ? parseInt(spouseId) : null,
			marriageDate: marriageDate ? new Date(marriageDate) : null,
		});

		return NextResponse.json(
			{
				...familyMember,
				hasProfilePicture: !!profilePicture,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating family member:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Guests cannot use this endpoint - they use the specific [id] route
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		// Get member ID from URL
		const url = new URL(request.url);
		const memberId = url.pathname.split('/').pop();

		if (!memberId || isNaN(parseInt(memberId))) {
			return NextResponse.json({ error: 'Valid member ID is required' }, { status: 400 });
		}

		// Handle multipart form data
		const formData = await request.formData();
		const fullName = formData.get('fullName') as string;
		const gender = formData.get('gender') as string;
		const birthday = formData.get('birthday') as string;
		const address = formData.get('address') as string;
		const isAdopted = formData.get('isAdopted') === 'true';
		const familyTreeId = formData.get('familyTreeId') as string;
		const parentId = formData.get('parentId') as string;
		const spouseId = formData.get('spouseId') as string;
		const relationshipEstablishedDate = formData.get('relationshipEstablishedDate') as string;
		const marriageDate = formData.get('marriageDate') as string;
		const profilePictureFile = formData.get('profilePicture') as File | null;

		if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
			return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
		}

		if (!familyTreeId || isNaN(parseInt(familyTreeId))) {
			return NextResponse.json({ error: 'Valid family tree ID is required' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the owner has access to this family tree and member exists
		const existingMember = await prisma.familyMember.findFirst({
			where: {
				id: parseInt(memberId),
				familyTreeId: parseInt(familyTreeId),
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

		// If parentId is provided, verify it exists and belongs to the same family tree
		if (parentId) {
			const parent = await prisma.familyMember.findFirst({
				where: {
					id: parseInt(parentId),
					familyTreeId: parseInt(familyTreeId),
				},
			});

			if (!parent) {
				return NextResponse.json({ error: 'Parent not found in this family tree' }, { status: 400 });
			}
		}

		// If spouseId is provided, verify it exists and belongs to the same family tree
		if (spouseId) {
			const spouse = await prisma.familyMember.findFirst({
				where: {
					id: parseInt(spouseId),
					familyTreeId: parseInt(familyTreeId),
				},
			});

			if (!spouse) {
				return NextResponse.json({ error: 'Spouse not found in this family tree' }, { status: 400 });
			}
		}

		// Handle profile picture upload
		let profilePicture: Buffer | null = null;
		let profilePictureType: string | null = null;

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

		// Calculate generation based on relationship
		let calculatedGeneration: number | null = null;

		if (!parentId && !spouseId) {
			// Root member
			calculatedGeneration = 0;
		} else if (parentId) {
			// Parent relationship - get parent's generation + 1
			const parent = await prisma.familyMember.findUnique({
				where: { id: parseInt(parentId) },
				select: { generation: true },
			});

			if (parent?.generation !== null && parent?.generation !== undefined) {
				const parentGen = parseInt(parent.generation);
				calculatedGeneration = isNaN(parentGen) ? 1 : parentGen + 1;
			} else {
				// If parent has no generation, assume it's 0 and add 1
				calculatedGeneration = 1;
			}
		} else if (spouseId) {
			// Spouse relationship - use spouse's generation
			const spouse = await prisma.familyMember.findUnique({
				where: { id: parseInt(spouseId) },
				select: { generation: true },
			});

			if (spouse?.generation !== null && spouse?.generation !== undefined) {
				const spouseGen = parseInt(spouse.generation);
				calculatedGeneration = isNaN(spouseGen) ? 0 : spouseGen;
			} else {
				// If spouse has no generation, assume it's 0
				calculatedGeneration = 0;
			}
		}

		// Validate relationship dates based on relationship type
		if (birthday && (relationshipEstablishedDate || marriageDate)) {
			const birthDate = new Date(birthday);
			let relationshipDate: Date;

			if (parentId && relationshipEstablishedDate) {
				// Parent relationship validation
				relationshipDate = new Date(relationshipEstablishedDate);
				if (relationshipDate < birthDate) {
					return NextResponse.json(
						{
							error: 'Relationship date must be on or after birth date for parent relationships',
						},
						{ status: 400 }
					);
				}
			} else if (spouseId && marriageDate) {
				// Spouse relationship validation
				relationshipDate = new Date(marriageDate);
				const minSpouseDate = new Date(birthDate);
				minSpouseDate.setFullYear(minSpouseDate.getFullYear() + 7);

				if (relationshipDate < minSpouseDate) {
					return NextResponse.json(
						{
							error: 'Marriage date must be at least 7 years after birth date',
						},
						{ status: 400 }
					);
				}
			}
		}

		// Update the family member
		const updatedMember = await prisma.familyMember.update({
			where: { id: parseInt(memberId) },
			data: {
				fullName: fullName.trim(),
				gender: validatedGender,
				birthday: birthday ? new Date(birthday) : null,
				address: address?.trim() || null,
				profilePicture: profilePicture || undefined,
				profilePictureType: profilePictureType || undefined,
				generation: calculatedGeneration?.toString() || null,
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
				familyTreeId: true,
				parentId: true,
				relationshipEstablishedDate: true,
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

		// Handle spouse relationship updates
		if (spouseId && marriageDate) {
			// Remove existing spouse relationships for this member
			await prisma.spouseRelationship.deleteMany({
				where: {
					OR: [{ familyMember1Id: parseInt(memberId) }, { familyMember2Id: parseInt(memberId) }],
				},
			});

			// Create new spouse relationship
			await prisma.spouseRelationship.create({
				data: {
					familyMember1Id: parseInt(spouseId),
					familyMember2Id: updatedMember.id,
					marriageDate: new Date(marriageDate),
				},
			});
		} else if (!spouseId) {
			// Remove existing spouse relationships if no spouse specified
			await prisma.spouseRelationship.deleteMany({
				where: {
					OR: [{ familyMember1Id: parseInt(memberId) }, { familyMember2Id: parseInt(memberId) }],
				},
			});
		}

		// Handle places of origin updates
		const placesOfOriginData = formData.get('placesOfOrigin') as string;
		if (placesOfOriginData) {
			try {
				// Remove existing places of origin
				await prisma.familyMember_has_PlaceOfOrigin.deleteMany({
					where: { familyMemberId: parseInt(memberId) },
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
								familyMemberId: parseInt(memberId),
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
					where: { familyMemberId: parseInt(memberId) },
				});

				// Add new occupations
				const occupations = JSON.parse(occupationsData);
				for (const occ of occupations) {
					if (occ.title && occ.startDate) {
						await prisma.occupation.create({
							data: {
								jobTitle: occ.title || occ.jobTitle,
								startDate: new Date(occ.startDate),
								endDate: occ.endDate ? new Date(occ.endDate) : null,
								familyMemberId: parseInt(memberId),
							},
						});
					}
				}
			} catch (error) {
				console.error('Error updating occupations:', error);
			}
		}

		// Log the update
		await logChange('FamilyMember', updatedMember.id, 'UPDATE', parseInt(familyTreeId), sessionData.user.id, null, {
			fullName: updatedMember.fullName,
			gender: updatedMember.gender,
			birthday: updatedMember.birthday,
			address: updatedMember.address,
			generation: updatedMember.generation,
			isAdopted: updatedMember.isAdopted,
			parentId: updatedMember.parentId,
			relationshipEstablishedDate: updatedMember.relationshipEstablishedDate,
			spouseId: spouseId ? parseInt(spouseId) : null,
			marriageDate: marriageDate ? new Date(marriageDate) : null,
		});

		return NextResponse.json(
			{
				...updatedMember,
				hasProfilePicture: !!profilePicture || !!existingMember.profilePicture,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating family member:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
