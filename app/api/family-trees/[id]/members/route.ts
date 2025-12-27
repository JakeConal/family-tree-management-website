import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getPrisma } from "../../../../../lib/prisma";
import { logChange } from "../../../../../lib/utils";

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
    const {
      fullName,
      gender,
      birthDate,
      address,
      relatedMemberId,
      relationship,
      relationshipDate,
      placesOfOrigin,
      occupations,
      profilePicture,
    } = body;

    // Validation
    if (
      !fullName ||
      typeof fullName !== "string" ||
      fullName.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!gender || !["male", "female", "other"].includes(gender)) {
      return NextResponse.json(
        { error: "Valid gender is required" },
        { status: 400 }
      );
    }

    if (!birthDate) {
      return NextResponse.json(
        { error: "Birth date is required" },
        { status: 400 }
      );
    }

    if (
      !address ||
      typeof address !== "string" ||
      address.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Verify the family tree exists and belongs to the user
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

    // Calculate generation based on relationship
    let generation = "2"; // Default generation
    let parentId = null;

    if (relatedMemberId && relationship) {
      const relatedMember = await prisma.familyMember.findFirst({
        where: {
          id: parseInt(relatedMemberId),
          familyTreeId: familyTreeId,
        },
      });

      if (!relatedMember) {
        return NextResponse.json(
          { error: "Related family member not found" },
          { status: 400 }
        );
      }

      // Determine generation and parent relationship
      switch (relationship.toLowerCase()) {
        case "parent":
          generation = (
            parseInt(relatedMember.generation || "1") + 1
          ).toString();
          parentId = relatedMember.id;
          break;
        case "spouse":
          generation = relatedMember.generation || "1";
          // Spouse relationship - no parent-child relationship
          break;
        default:
          generation = "2";
      }
    }

    // Create the family member
    const familyMember = await prisma.familyMember.create({
      data: {
        fullName: fullName.trim(),
        gender:
          gender === "male" ? "MALE" : gender === "female" ? "FEMALE" : "OTHER",
        birthday: new Date(birthDate),
        address: address.trim(),
        profilePicture: profilePicture || null,
        generation: generation,
        isRootPerson: false,
        familyTreeId: familyTreeId,
        parentId: parentId,
      },
    });

    // Log the creation
    await logChange(
      "FamilyMember",
      familyMember.id,
      "CREATE",
      familyTreeId,
      session.user.id,
      null,
      {
        fullName: familyMember.fullName,
        gender: familyMember.gender,
        birthday: familyMember.birthday,
        address: familyMember.address,
        generation: familyMember.generation,
        parentId: familyMember.parentId,
      }
    );

    // Create places of origin if provided
    if (placesOfOrigin && Array.isArray(placesOfOrigin)) {
      for (const place of placesOfOrigin) {
        if (place.location?.trim()) {
          // Find or create the place of origin
          let placeOfOrigin = await prisma.placeOfOrigin.findFirst({
            where: { location: place.location.trim() },
          });

          if (!placeOfOrigin) {
            placeOfOrigin = await prisma.placeOfOrigin.create({
              data: { location: place.location.trim() },
            });
          }

          // Create the junction record
          await prisma.familyMember_has_PlaceOfOrigin.create({
            data: {
              familyMemberId: familyMember.id,
              placeOfOriginId: placeOfOrigin.id,
              startDate: place.startDate ? new Date(place.startDate) : null,
              endDate: place.endDate ? new Date(place.endDate) : null,
            },
          });
        }
      }
    }

    // Create occupations if provided
    if (occupations && Array.isArray(occupations)) {
      for (const occupation of occupations) {
        if (occupation.title?.trim()) {
          await prisma.occupation.create({
            data: {
              jobTitle: occupation.title.trim(),
              startDate: occupation.startDate
                ? new Date(occupation.startDate)
                : null,
              endDate: occupation.endDate ? new Date(occupation.endDate) : null,
              familyMemberId: familyMember.id,
            },
          });
        }
      }
    }

    // Handle spouse relationships
    if (relatedMemberId && relationship?.toLowerCase() === "spouse") {
      const spouseRelationship = await prisma.spouseRelationship.create({
        data: {
          marriageDate: relationshipDate
            ? new Date(relationshipDate)
            : new Date(),
          familyMember1Id: Math.min(familyMember.id, parseInt(relatedMemberId)),
          familyMember2Id: Math.max(familyMember.id, parseInt(relatedMemberId)),
        },
      });

      // Log the spouse relationship creation
      await logChange(
        "SpouseRelationship",
        spouseRelationship.id,
        "CREATE",
        familyTreeId,
        session.user.id,
        null,
        {
          marriageDate: spouseRelationship.marriageDate,
          familyMember1Id: spouseRelationship.familyMember1Id,
          familyMember2Id: spouseRelationship.familyMember2Id,
        }
      );
    }

    return NextResponse.json(familyMember, { status: 201 });
  } catch (error) {
    console.error("Error creating family member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    const prisma = getPrisma();

    // Verify the family tree exists and belongs to the user
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

    // Get all family members for this tree
    const members = await prisma.familyMember.findMany({
      where: { familyTreeId: familyTreeId },
      select: {
        id: true,
        fullName: true,
        gender: true,
        birthday: true,
        generation: true,
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching family members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
