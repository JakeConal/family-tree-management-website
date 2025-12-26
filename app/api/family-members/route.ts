import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getPrisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const familyTreeId = searchParams.get("familyTreeId");

    if (!familyTreeId) {
      return NextResponse.json(
        { error: "Family tree ID is required" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Verify the user has access to this family tree
    const familyTree = await prisma.familyTree.findFirst({
      where: {
        id: parseInt(familyTreeId),
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

    const familyMembers = await prisma.familyMember.findMany({
      where: { familyTreeId: parseInt(familyTreeId) },
      include: {
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
          include: {
            familyMember2: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        spouse2: {
          include: {
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
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(familyMembers);
  } catch (error) {
    console.error("Error fetching family members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      gender,
      birthday,
      address,
      profilePicture,
      generation,
      isAdopted,
      familyTreeId,
      parentId,
    } = body;

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

    if (!familyTreeId || isNaN(parseInt(familyTreeId))) {
      return NextResponse.json(
        { error: "Valid family tree ID is required" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Verify the user has access to this family tree
    const familyTree = await prisma.familyTree.findFirst({
      where: {
        id: parseInt(familyTreeId),
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

    // If parentId is provided, verify it exists and belongs to the same family tree
    if (parentId) {
      const parent = await prisma.familyMember.findFirst({
        where: {
          id: parseInt(parentId),
          familyTreeId: parseInt(familyTreeId),
        },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent not found in this family tree" },
          { status: 400 }
        );
      }
    }

    // Create the family member
    const familyMember = await prisma.familyMember.create({
      data: {
        fullName: fullName.trim(),
        gender: gender || null,
        birthday: birthday ? new Date(birthday) : null,
        address: address?.trim() || null,
        profilePicture: profilePicture?.trim() || null,
        generation: generation?.trim() || null,
        isAdopted: isAdopted || false,
        familyTreeId: parseInt(familyTreeId),
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
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

    return NextResponse.json(familyMember, { status: 201 });
  } catch (error) {
    console.error("Error creating family member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
