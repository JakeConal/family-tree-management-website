import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getPrisma } from "../../../lib/prisma";
import { logChange } from "../../../lib/utils";

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
    const { familyName, origin, establishYear, rootPerson } = body;

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

    if (
      !rootPerson?.fullName ||
      typeof rootPerson.fullName !== "string" ||
      rootPerson.fullName.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Root person full name is required" },
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

    // Log the family tree creation
    await logChange(
      "FamilyTree",
      familyTree.id,
      "CREATE",
      familyTree.id,
      session.user.id,
      null,
      {
        familyName: familyTree.familyName,
        origin: familyTree.origin,
        establishYear: familyTree.establishYear,
      }
    );

    // Create the root family member
    const rootMember = await prisma.familyMember.create({
      data: {
        fullName: rootPerson.fullName.trim(),
        gender: rootPerson.gender
          ? rootPerson.gender === "male"
            ? "MALE"
            : rootPerson.gender === "female"
            ? "FEMALE"
            : "OTHER"
          : null,
        birthday: rootPerson.birthDate ? new Date(rootPerson.birthDate) : null,
        address: rootPerson.address?.trim() || null,
        profilePicture: rootPerson.profilePicture || null,
        generation: "1", // Root person is generation 1
        isRootPerson: true,
        familyTreeId: familyTree.id,
      },
    });

    // Log the root member creation
    await logChange(
      "FamilyMember",
      rootMember.id,
      "CREATE",
      familyTree.id,
      session.user.id,
      null,
      {
        fullName: rootMember.fullName,
        gender: rootMember.gender,
        birthday: rootMember.birthday,
        address: rootMember.address,
        generation: rootMember.generation,
        isRootPerson: rootMember.isRootPerson,
      }
    );

    // Create places of origin if provided
    if (rootPerson.placesOfOrigin && Array.isArray(rootPerson.placesOfOrigin)) {
      for (const place of rootPerson.placesOfOrigin) {
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
              familyMemberId: rootMember.id,
              placeOfOriginId: placeOfOrigin.id,
              startDate: place.startDate ? new Date(place.startDate) : null,
              endDate: place.endDate ? new Date(place.endDate) : null,
            },
          });
        }
      }
    }

    // Create occupations if provided
    if (rootPerson.occupations && Array.isArray(rootPerson.occupations)) {
      for (const occupation of rootPerson.occupations) {
        if (occupation.title?.trim()) {
          await prisma.occupation.create({
            data: {
              jobTitle: occupation.title.trim(),
              startDate: occupation.startDate
                ? new Date(occupation.startDate)
                : null,
              endDate: occupation.endDate ? new Date(occupation.endDate) : null,
              familyMemberId: rootMember.id,
            },
          });
        }
      }
    }

    // Update the family tree with the root member ID
    const updatedFamilyTree = await prisma.familyTree.update({
      where: { id: familyTree.id },
      data: { rootMemberId: rootMember.id },
    });

    return NextResponse.json(updatedFamilyTree, { status: 201 });
  } catch (error) {
    console.error("Error creating family tree:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
