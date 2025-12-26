import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getPrisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrisma();

    // Find the tree owner for this user
    const treeOwner = await prisma.treeOwner.findUnique({
      where: { userId: session.user.id },
      include: {
        familyTrees: {
          select: {
            id: true,
            familyName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!treeOwner) {
      return NextResponse.json([]);
    }

    return NextResponse.json(treeOwner.familyTrees);
  } catch (error) {
    console.error("Error fetching family trees:", error);
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
    const { familyName, origin, establishYear } = body;

    if (
      !familyName ||
      typeof familyName !== "string" ||
      familyName.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Family name is required" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Find or create tree owner for this user
    let treeOwner = await prisma.treeOwner.findUnique({
      where: { userId: session.user.id },
    });

    if (!treeOwner) {
      treeOwner = await prisma.treeOwner.create({
        data: {
          fullName: session.user.name || session.user.email || "Unknown",
          userId: session.user.id,
        },
      });
    }

    // Create the family tree
    const familyTree = await prisma.familyTree.create({
      data: {
        familyName: familyName.trim(),
        origin: origin?.trim() || null,
        establishYear: establishYear ? parseInt(establishYear) : null,
        treeOwnerId: treeOwner.id,
      },
    });

    return NextResponse.json(familyTree, { status: 201 });
  } catch (error) {
    console.error("Error creating family tree:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
