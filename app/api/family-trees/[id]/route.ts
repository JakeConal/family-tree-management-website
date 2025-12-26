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
    const familyTreeId = parseInt(id);

    if (isNaN(familyTreeId)) {
      return NextResponse.json(
        { error: "Invalid family tree ID" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const familyTree = await prisma.familyTree.findFirst({
      where: {
        id: familyTreeId,
        treeOwner: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        familyName: true,
        origin: true,
        establishYear: true,
        createdAt: true,
        treeOwner: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!familyTree) {
      return NextResponse.json(
        { error: "Family tree not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(familyTree);
  } catch (error) {
    console.error("Error fetching family tree:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
