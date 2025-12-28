import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface MemberRow {
    id: number;
    fullName: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const treeId = searchParams.get("treeId");

        if (!treeId) {
            return NextResponse.json(
                { error: "treeId is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Get all family members for this tree
        const members = db
            .prepare(
                `
      SELECT id, fullName 
      FROM FamilyMember 
      WHERE familyTreeId = ?
      ORDER BY fullName
    `
            )
            .all(treeId) as MemberRow[];

        db.close();

        return NextResponse.json({
            members: members.map((m) => ({
                id: m.id.toString(),
                name: m.fullName,
            })),
        });
    } catch (error) {
        console.error("Error fetching family members:", error);
        return NextResponse.json(
            { error: "Failed to fetch family members" },
            { status: 500 }
        );
    }
}
