import { NextRequest, NextResponse } from 'next/server';

import { getSessionWithRole } from '@/lib/auth-helpers';
import { getPrisma } from '@/lib/prisma';
import { logChange } from '@/lib/utils';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; passingRecordId: string }> }
) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, passingRecordId } = await params;
		const familyTreeId = parseInt(id);
		const recordId = parseInt(passingRecordId);

		if (isNaN(familyTreeId) || isNaN(recordId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify access based on role
		if (sessionData.isGuest) {
			// Guest can only access their assigned family tree
			if (sessionData.guestFamilyTreeId !== familyTreeId) {
				return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
			}
		} else if (sessionData.isOwner) {
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
		}

		// Fetch the passing record
		const passingRecord = await prisma.passingRecord.findFirst({
			where: {
				id: recordId,
				familyMember: {
					familyTreeId: familyTreeId,
				},
			},
			include: {
				familyMember: {
					select: {
						id: true,
						fullName: true,
					},
				},
				causeOfDeath: {
					select: {
						id: true,
						causeName: true,
					},
				},
				buriedPlaces: {
					select: {
						id: true,
						location: true,
						startDate: true,
						endDate: true,
					},
					orderBy: {
						startDate: 'asc',
					},
				},
			},
		});

		if (!passingRecord) {
			return NextResponse.json({ error: 'Passing record not found' }, { status: 404 });
		}

		return NextResponse.json(passingRecord);
	} catch (error) {
		console.error('Error fetching passing record:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; passingRecordId: string }> }
) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can update passing records
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id, passingRecordId } = await params;
		const familyTreeId = parseInt(id);
		const recordId = parseInt(passingRecordId);

		if (isNaN(familyTreeId) || isNaN(recordId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const body = await request.json();
		const { dateOfPassing, causesOfDeath, burialPlaces } = body;

		// Validation
		if (!dateOfPassing) {
			return NextResponse.json({ error: 'Date of passing is required' }, { status: 400 });
		}

		// Causes of death are optional, but if provided must be valid
		if (causesOfDeath && !Array.isArray(causesOfDeath)) {
			return NextResponse.json({ error: 'Causes of death must be an array' }, { status: 400 });
		}

		if (!burialPlaces || burialPlaces.length === 0) {
			return NextResponse.json({ error: 'At least one burial place is required' }, { status: 400 });
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

		// Verify the passing record exists and belongs to this family tree
		const existingRecord = await prisma.passingRecord.findFirst({
			where: {
				id: recordId,
				familyMember: {
					familyTreeId: familyTreeId,
				},
			},
			include: {
				familyMember: true,
				causeOfDeath: true,
				buriedPlaces: true,
			},
		});

		if (!existingRecord) {
			return NextResponse.json({ error: 'Passing record not found in this family tree' }, { status: 404 });
		}

		// Store old data for logging
		const oldData = {
			dateOfPassing: existingRecord.dateOfPassing,
			causeOfDeath: existingRecord.causeOfDeath.map((c) => c.causeName),
			burialPlacesCount: existingRecord.buriedPlaces.length,
		};

		// Update passing record in a transaction
		const updatedRecord = await prisma.$transaction(async (tx) => {
			// Update the passing record
			const updated = await tx.passingRecord.update({
				where: {
					id: recordId,
				},
				data: {
					dateOfPassing: new Date(dateOfPassing),
				},
			});

			// Handle cause of death
			if (causesOfDeath && causesOfDeath.length > 0) {
				// Delete existing causes of death
				await tx.causeOfDeath.deleteMany({
					where: {
						passingRecordId: recordId,
					},
				});

				// Create new causes of death
				for (const cause of causesOfDeath) {
					await tx.causeOfDeath.create({
						data: {
							causeName: cause,
							familyMemberId: existingRecord.familyMemberId,
							passingRecordId: recordId,
						},
					});
				}
			} else {
				// If no cause of death provided, delete all existing ones
				await tx.causeOfDeath.deleteMany({
					where: {
						passingRecordId: recordId,
					},
				});
			}

			// Delete existing burial places
			await tx.buriedPlace.deleteMany({
				where: {
					passingRecordId: recordId,
				},
			});

			// Create new burial places
			if (burialPlaces && burialPlaces.length > 0) {
				for (const place of burialPlaces) {
					if (place.location && place.startDate) {
						await tx.buriedPlace.create({
							data: {
								location: place.location,
								startDate: new Date(place.startDate),
								endDate: place.endDate ? new Date(place.endDate) : null,
								passingRecordId: recordId,
							},
						});
					}
				}
			}

			return updated;
		});

		// Log the update
		await logChange('PassingRecord', updatedRecord.id, 'UPDATE', familyTreeId, sessionData.user.id, oldData, {
			dateOfPassing: updatedRecord.dateOfPassing,
			causeOfDeath: causesOfDeath,
		});

		// Fetch the complete updated record
		const completeRecord = await prisma.passingRecord.findUnique({
			where: {
				id: recordId,
			},
			include: {
				familyMember: {
					select: {
						id: true,
						fullName: true,
					},
				},
				causeOfDeath: {
					select: {
						id: true,
						causeName: true,
					},
				},
				buriedPlaces: {
					select: {
						id: true,
						location: true,
						startDate: true,
						endDate: true,
					},
					orderBy: {
						startDate: 'asc',
					},
				},
			},
		});

		return NextResponse.json(completeRecord);
	} catch (error) {
		console.error('Error updating passing record:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; passingRecordId: string }> }
) {
	try {
		const sessionData = await getSessionWithRole();

		if (!sessionData.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Only owners can delete passing records
		if (sessionData.isGuest) {
			return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 });
		}

		const { id, passingRecordId } = await params;
		const familyTreeId = parseInt(id);
		const recordId = parseInt(passingRecordId);

		if (isNaN(familyTreeId) || isNaN(recordId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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

		// Verify the passing record exists and belongs to this family tree
		const existingRecord = await prisma.passingRecord.findFirst({
			where: {
				id: recordId,
				familyMember: {
					familyTreeId: familyTreeId,
				},
			},
			include: {
				familyMember: {
					select: {
						fullName: true,
					},
				},
				causeOfDeath: true,
			},
		});

		if (!existingRecord) {
			return NextResponse.json({ error: 'Passing record not found in this family tree' }, { status: 404 });
		}

		// Store old data for logging
		const oldData = {
			familyMemberName: existingRecord.familyMember.fullName,
			dateOfPassing: existingRecord.dateOfPassing,
			causeOfDeath: existingRecord.causeOfDeath.map((c) => c.causeName),
		};

		// Delete the passing record (burial places will be cascade deleted)
		await prisma.passingRecord.delete({
			where: {
				id: recordId,
			},
		});

		// Log the deletion
		await logChange('PassingRecord', recordId, 'DELETE', familyTreeId, sessionData.user.id, oldData, null);

		return NextResponse.json({ message: 'Passing record deleted successfully' });
	} catch (error) {
		console.error('Error deleting passing record:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
