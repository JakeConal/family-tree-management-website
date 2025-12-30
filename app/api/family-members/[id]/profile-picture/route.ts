import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log("Profile picture request unauthorized: No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const prisma = getPrisma();

    // Get the family member with profile picture
    const member = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyTree: {
          treeOwner: {
            userId: session.user.id,
          },
        },
      },
      select: {
        profilePicture: true,
        profilePictureType: true,
      },
    });

    if (!member || !member.profilePicture) {
      return NextResponse.json(
        { error: "Profile picture not found" },
        { status: 404 }
      );
    }

    // Return the image with appropriate content type
    return new NextResponse(new Uint8Array(member.profilePicture), {
      headers: {
        "Content-Type": member.profilePictureType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error serving profile picture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
