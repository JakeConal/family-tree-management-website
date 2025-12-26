import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getPrisma } from "../../../../lib/prisma";

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
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const prisma = getPrisma();

    const familyMember = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyTree: {
          treeOwner: {
            userId: session.user.id,
          },
        },
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
        passingRecords: {
          include: {
            causeOfDeath: true,
            buriedPlaces: true,
          },
        },
      },
    });

    if (!familyMember) {
      return NextResponse.json(
        { error: "Family member not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(familyMember);
  } catch (error) {
    console.error("Error fetching family member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
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
      parentId,
    } = body;

    if (
      fullName !== undefined &&
      (!fullName ||
        typeof fullName !== "string" ||
        fullName.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: "Full name cannot be empty" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Verify the user has access to this family member
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyTree: {
          treeOwner: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: "Family member not found or access denied" },
        { status: 404 }
      );
    }

    // If parentId is provided, verify it exists and belongs to the same family tree
    if (parentId !== undefined && parentId !== null) {
      const parent = await prisma.familyMember.findFirst({
        where: {
          id: parseInt(parentId),
          familyTreeId: existingMember.familyTreeId,
        },
      });

      if (!parent) {
        return NextResponse.json(
          { error: "Parent not found in this family tree" },
          { status: 400 }
        );
      }
    }

    // Update the family member
    const updatedMember = await prisma.familyMember.update({
      where: { id: memberId },
      data: {
        ...(fullName && { fullName: fullName.trim() }),
        ...(gender !== undefined && { gender }),
        ...(birthday !== undefined && {
          birthday: birthday ? new Date(birthday) : null,
        }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(profilePicture !== undefined && {
          profilePicture: profilePicture?.trim() || null,
        }),
        ...(generation !== undefined && {
          generation: generation?.trim() || null,
        }),
        ...(isAdopted !== undefined && { isAdopted }),
        ...(parentId !== undefined && {
          parentId: parentId ? parseInt(parentId) : null,
        }),
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

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating family member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const prisma = getPrisma();

    // Verify the user has access to this family member
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyTree: {
          treeOwner: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: "Family member not found or access denied" },
        { status: 404 }
      );
    }

    // Check if this is the root member
    if (existingMember.isRootPerson) {
      return NextResponse.json(
        { error: "Cannot delete the root family member" },
        { status: 400 }
      );
    }

    // Delete the family member (cascade will handle related records)
    await prisma.familyMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Family member deleted successfully" });
  } catch (error) {
    console.error("Error deleting family member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
