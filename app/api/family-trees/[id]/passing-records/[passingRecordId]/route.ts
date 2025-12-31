import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { getPrisma } from '@/lib/prisma';
import { logChange } from '@/lib/utils';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; passingRecordId: string }> }
) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, passingRecordId } = await params;
		const familyTreeId = parseInt(id);
		const recordId = parseInt(passingRecordId);

		if (isNaN(familyTreeId) || isNaN(recordId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the user has access to this family tree
		const familyTree = await prisma.familyTree.findFirst({
			where: {
				id: familyTreeId,
				treeOwner: {
					userId: session.user.id,
				},
			},
		});

		if (!familyTree) {
			return NextResponse.json({ error: 'Family tree not found or access denied' }, { status: 404 });
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
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

		if (!causesOfDeath || causesOfDeath.length === 0) {
			return NextResponse.json({ error: 'At least one cause of death is required' }, { status: 400 });
		}

		if (!burialPlaces || burialPlaces.length === 0) {
			return NextResponse.json({ error: 'At least one burial place is required' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the user has access to this family tree
		const familyTree = await prisma.familyTree.findFirst({
			where: {
				id: familyTreeId,
				treeOwner: {
					userId: session.user.id,
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
			causeOfDeath: existingRecord.causeOfDeath?.causeName,
			burialPlacesCount: existingRecord.buriedPlaces.length,
		};

		// Update passing record in a transaction
		const updatedRecord = await prisma.$transaction(async (tx) => {
			// Handle cause of death
			let causeOfDeathId = existingRecord.causeOfDeathId;

			if (causesOfDeath && causesOfDeath.length > 0) {
				const primaryCause = causesOfDeath[0];
				
				// Find or create cause of death
				let cause = await tx.causeOfDeath.findFirst({
					where: {
						causeName: primaryCause,
					},
				});

				if (!cause) {
					cause = await tx.causeOfDeath.create({
						data: {
							causeName: primaryCause,
						},
					});
				}

				causeOfDeathId = cause.id;
			}

			// Update the passing record
			const updated = await tx.passingRecord.update({
				where: {
					id: recordId,
				},
				data: {
					dateOfPassing: new Date(dateOfPassing),
					causeOfDeathId: causeOfDeathId,
				},
			});

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
		await logChange('PassingRecord', updatedRecord.id, 'UPDATE', familyTreeId, session.user.id, oldData, {
			dateOfPassing: updatedRecord.dateOfPassing,
			causeOfDeathId: updatedRecord.causeOfDeathId,
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
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id, passingRecordId } = await params;
		const familyTreeId = parseInt(id);
		const recordId = parseInt(passingRecordId);

		if (isNaN(familyTreeId) || isNaN(recordId)) {
			return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
		}

		const prisma = getPrisma();

		// Verify the user has access to this family tree
		const familyTree = await prisma.familyTree.findFirst({
			where: {
				id: familyTreeId,
				treeOwner: {
					userId: session.user.id,
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
			causeOfDeath: existingRecord.causeOfDeath?.causeName,
		};

		// Delete the passing record (burial places will be cascade deleted)
		await prisma.passingRecord.delete({
			where: {
				id: recordId,
			},
		});

		// Log the deletion
		await logChange('PassingRecord', recordId, 'DELETE', familyTreeId, session.user.id, oldData, null);

		return NextResponse.json({ message: 'Passing record deleted successfully' });
	} catch (error) {
		console.error('Error deleting passing record:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

