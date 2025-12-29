import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../auth";
import { getPrisma } from "../../../lib/prisma";
import { logChange } from "../../../lib/utils";

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
      orderBy: { id: "asc" },
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

    // Handle multipart form data
    const formData = await request.formData();
    const fullName = formData.get("fullName") as string;
    const gender = formData.get("gender") as string;
    const birthday = formData.get("birthday") as string;
    const address = formData.get("address") as string;
    const generation = formData.get("generation") as string;
    const isAdopted = formData.get("isAdopted") === "true";
    const familyTreeId = formData.get("familyTreeId") as string;
    const parentId = formData.get("parentId") as string;
    const spouseId = formData.get("spouseId") as string;
    const relationshipEstablishedDate = formData.get(
      "relationshipEstablishedDate"
    ) as string;
    const marriageDate = formData.get("marriageDate") as string;
    const profilePictureFile = formData.get("profilePicture") as File | null;

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

    // If spouseId is provided, verify it exists and belongs to the same family tree
    if (spouseId) {
      const spouse = await prisma.familyMember.findFirst({
        where: {
          id: parseInt(spouseId),
          familyTreeId: parseInt(familyTreeId),
        },
      });

      if (!spouse) {
        return NextResponse.json(
          { error: "Spouse not found in this family tree" },
          { status: 400 }
        );
      }
    }

    // Handle profile picture upload
    let profilePicture: Buffer | null = null;
    let profilePictureType: string | null = null;

    if (profilePictureFile) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(profilePictureFile.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
          },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (profilePictureFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size too large. Maximum size is 5MB." },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await profilePictureFile.arrayBuffer();
      profilePicture = Buffer.from(arrayBuffer);
      profilePictureType = profilePictureFile.type;
    }

    // Validate gender
    let validatedGender: "MALE" | "FEMALE" | null = null;
    if (gender) {
      const upperGender = gender.toUpperCase();
      if (["MALE", "FEMALE"].includes(upperGender)) {
        validatedGender = upperGender as "MALE" | "FEMALE";
      } else {
        return NextResponse.json(
          { error: "Invalid gender. Must be MALE or FEMALE." },
          { status: 400 }
        );
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
        generation: generation?.trim() || null,
        isAdopted: isAdopted || false,
        familyTreeId: parseInt(familyTreeId),
        parentId: parentId ? parseInt(parentId) : null,
        relationshipEstablishedDate: relationshipEstablishedDate
          ? new Date(relationshipEstablishedDate)
          : null,
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

    // Log the creation
    await logChange(
      "FamilyMember",
      familyMember.id,
      "CREATE",
      parseInt(familyTreeId),
      session.user.id,
      null,
      {
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
      }
    );

    return NextResponse.json(
      {
        ...familyMember,
        hasProfilePicture: !!profilePicture,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating family member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
