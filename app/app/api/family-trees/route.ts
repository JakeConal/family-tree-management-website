import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
    try {
        const db = getDb();

        // For now, get all family trees (in production, filter by logged-in user)
        // We'll use a mock userId for demo purposes
        const trees = db
            .prepare(
                `
      SELECT ft.id, ft.familyName 
      FROM FamilyTree ft
      ORDER BY ft.createdAt DESC
    `
            )
            .all() as { id: number; familyName: string }[];

        // Return max 2 trees, with info about whether there are more
        const displayTrees = trees.slice(0, 2);
        const hasMore = trees.length > 2;
        const totalCount = trees.length;

        db.close();

        return NextResponse.json({
            trees: displayTrees.map((t) => ({
                id: t.id.toString(),
                name: t.familyName,
            })),
            hasMore,
            totalCount,
        });
    } catch (error) {
        console.error("Error fetching family trees:", error);
        return NextResponse.json(
            { error: "Failed to fetch family trees" },
            { status: 500 }
        );
    }
}
