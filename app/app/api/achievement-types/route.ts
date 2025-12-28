import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

        // Get achievement types for this family tree
        const types = db
            .prepare(
                `
      SELECT id, typeName 
      FROM AchievementType 
      WHERE familyTreeId = ?
      ORDER BY typeName
    `
            )
            .all(treeId) as { id: number; typeName: string }[];

        db.close();

        return NextResponse.json({
            types: types.map((t) => ({
                id: t.id.toString(),
                name: t.typeName,
            })),
        });
    } catch (error) {
        console.error("Error fetching achievement types:", error);
        return NextResponse.json(
            { error: "Failed to fetch achievement types" },
            { status: 500 }
        );
    }
}
