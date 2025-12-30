import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { logChange } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const familyTreeId = parseInt(id);
    if (isNaN(familyTreeId)) {
      return NextResponse.json(
        { error: "Invalid family tree ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { familyMemberId, dateOfPassing, causesOfDeath, burialPlaces } = body;

    // Validation
    if (!familyMemberId || typeof familyMemberId !== "number") {
      return NextResponse.json(
        { error: "Family member ID is required" },
        { status: 400 }
      );
    }

    if (!dateOfPassing) {
      return NextResponse.json(
        { error: "Date of passing is required" },
        { status: 400 }
      );
    }

    if (
      !causesOfDeath ||
      !Array.isArray(causesOfDeath) ||
      causesOfDeath.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one cause of death is required" },
        { status: 400 }
      );
    }

    if (
      !burialPlaces ||
      !Array.isArray(burialPlaces) ||
      burialPlaces.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one burial place is required" },
        { status: 400 }
      );
    }

    // Validate causes of death
    for (const cause of causesOfDeath) {
      if (!cause || typeof cause !== "string" || cause.trim() === "") {
        return NextResponse.json(
          { error: "All causes of death must be non-empty strings" },
          { status: 400 }
        );
      }
    }

    // Validate burial places
    for (const place of burialPlaces) {
      if (!place.location || !place.startDate) {
        return NextResponse.json(
          { error: "All burial places must have location and start date" },
          { status: 400 }
        );
      }
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
      return NextResponse.json(
        { error: "Family tree not found or access denied" },
        { status: 404 }
      );
    }

    // Verify the family member belongs to this family tree
    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: familyMemberId,
        familyTreeId: familyTreeId,
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: "Family member not found in this family tree" },
        { status: 404 }
      );
    }

    // Check if the family member already has a passing record
    const existingPassingRecord = await prisma.passingRecord.findFirst({
      where: {
        familyMemberId: familyMemberId,
      },
    });

    if (existingPassingRecord) {
      return NextResponse.json(
        { error: "This family member already has a passing record" },
        { status: 400 }
      );
    }

    // Create the passing record with related data
    const passingRecord = await prisma.passingRecord.create({
      data: {
        familyMemberId: familyMemberId,
        dateOfPassing: new Date(dateOfPassing),
        causeOfDeath: {
          create: {
            causeName: causesOfDeath[0], // First cause becomes the main one
            familyMemberId: familyMemberId,
          },
        },
        buriedPlaces: {
          create: burialPlaces.map((place: any) => ({
            location: place.location,
            startDate: new Date(place.startDate),
          })),
        },
      },
      include: {
        familyMember: {
          select: {
            fullName: true,
          },
        },
        causeOfDeath: {
          select: {
            causeName: true,
          },
        },
        buriedPlaces: {
          select: {
            location: true,
            startDate: true,
          },
        },
      },
    });

    // Create additional causes of death if there are more than one
    if (causesOfDeath.length > 1) {
      for (let i = 1; i < causesOfDeath.length; i++) {
        await prisma.causeOfDeath.create({
          data: {
            causeName: causesOfDeath[i],
            passingRecordId: passingRecord.id,
            familyMemberId: familyMemberId,
          },
        });
      }
    }

    // Log the passing record creation
    await logChange(
      "PassingRecord",
      passingRecord.id,
      "CREATE",
      familyTreeId,
      session.user.id,
      null,
      {
        familyMemberName: passingRecord.familyMember.fullName,
        dateOfPassing: passingRecord.dateOfPassing,
        causesOfDeath: causesOfDeath,
        burialPlaces: burialPlaces.map((place: any) => ({
          location: place.location,
          startDate: place.startDate,
        })),
      }
    );

    return NextResponse.json(passingRecord, { status: 201 });
  } catch (error) {
    console.error("Error creating passing record:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
