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
        const excludeDeceased = searchParams.get("excludeDeceased") === "true";

        if (!treeId) {
            return NextResponse.json(
                { error: "treeId is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Build query - optionally exclude members who already have passing records
        let query = `
            SELECT fm.id, fm.fullName 
            FROM FamilyMember fm
            WHERE fm.familyTreeId = ?
        `;

        if (excludeDeceased) {
            query += `
                AND fm.id NOT IN (
                    SELECT DISTINCT familyMemberId 
                    FROM PassingRecord
                )
            `;
        }

        query += ` ORDER BY fm.fullName`;

        const members = db.prepare(query).all(treeId) as MemberRow[];

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
