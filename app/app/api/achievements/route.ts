import { NextRequest, NextResponse } from "next/server";
import { getDb, formatDate, getYear } from "@/lib/db";

// Icon path mapping for each category
const ACHIEVEMENT_ICON_CONFIG: Record<string, { iconPath: string; background: string }> = {
    Education: { iconPath: "/icons/cup.png", background: "#E0F2FE" },
    Graduation: { iconPath: "/icons/cup.png", background: "#E0F2FE" },
    Career: { iconPath: "/icons/career.png", background: "#E7DDFB" },
    Business: { iconPath: "/icons/career.png", background: "#E7DDFB" },
    Sport: { iconPath: "/icons/sport.png", background: "#F8F1C2" },
    Sports: { iconPath: "/icons/sport.png", background: "#F8F1C2" },
    Health: { iconPath: "/icons/health.png", background: "#F8D6D6" },
    Artistic: { iconPath: "/icons/artist.png", background: "#BAE6FD" },
    Creative: { iconPath: "/icons/artist.png", background: "#BAE6FD" },
    Community: { iconPath: "/icons/community.png", background: "#DBEAFE" },
    Environment: { iconPath: "/icons/enviroment.png", background: "#E0F3D3" },
    Financial: { iconPath: "/icons/finance.png", background: "#FAE5D3" },
    Finance: { iconPath: "/icons/finance.png", background: "#FAE5D3" },
    "Skill Development": { iconPath: "/icons/skill.png", background: "#E7DDFB" },
    Travel: { iconPath: "/icons/travel.png", background: "#D1F2EB" },
};

interface AchievementRow {
    id: number;
    title: string;
    achieveDate: string | null;
    description: string | null;
    memberName: string;
    typeName: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const treeId = searchParams.get("treeId");
        const yearFilter = searchParams.get("year") || "all";
        const typeFilter = searchParams.get("type") || "all";

        if (!treeId) {
            return NextResponse.json(
                { error: "treeId is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Build query with optional filters
        let query = `
      SELECT 
        a.id,
        a.title,
        a.achieveDate,
        a.description,
        fm.fullName as memberName,
        at.typeName
      FROM Achievement a
      JOIN FamilyMember fm ON a.familyMemberId = fm.id
      JOIN AchievementType at ON a.achievementTypeId = at.id
      WHERE fm.familyTreeId = ?
    `;

        const params: (string | number)[] = [treeId];

        // Add year filter
        if (yearFilter !== "all") {
            query += ` AND strftime('%Y', a.achieveDate) = ?`;
            params.push(yearFilter);
        }

        // Add type filter
        if (typeFilter !== "all") {
            query += ` AND at.typeName = ?`;
            params.push(typeFilter);
        }

        query += ` ORDER BY a.achieveDate DESC`;

        const achievements = db.prepare(query).all(...params) as AchievementRow[];

        // Get available years for dropdown
        const yearsResult = db
            .prepare(
                `
      SELECT DISTINCT strftime('%Y', a.achieveDate) as year
      FROM Achievement a
      JOIN FamilyMember fm ON a.familyMemberId = fm.id
      WHERE fm.familyTreeId = ?
      ORDER BY year DESC
    `
            )
            .all(treeId) as { year: string }[];

        const availableYears = yearsResult.map((r) => r.year).filter(Boolean);

        db.close();

        // Group achievements by year
        const groupedByYear: Record<string, typeof formattedAchievements> = {};
        const formattedAchievements = achievements.map((a) => {
            const typeConfig = ACHIEVEMENT_ICON_CONFIG[a.typeName] || {
                iconPath: "/icons/cup.png",
                background: "#FFFFFF",
            };
            return {
                id: a.id.toString(),
                category: a.typeName,
                title: a.title,
                person: a.memberName,
                date: formatDate(a.achieveDate),
                rawDate: a.achieveDate || "", // YYYY-MM-DD format for edit form
                description: a.description || "",
                background: typeConfig.background,
                iconPath: typeConfig.iconPath,
                year: getYear(a.achieveDate),
            };
        });

        for (const achievement of formattedAchievements) {
            const year = achievement.year;
            if (!groupedByYear[year]) {
                groupedByYear[year] = [];
            }
            groupedByYear[year].push(achievement);
        }

        // Convert to array format expected by frontend
        const sections = Object.entries(groupedByYear)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, entries]) => ({
                year,
                entries,
            }));

        return NextResponse.json({
            sections,
            availableYears,
        });
    } catch (error) {
        console.error("Error fetching achievements:", error);
        return NextResponse.json(
            { error: "Failed to fetch achievements" },
            { status: 500 }
        );
    }
}

// POST - Create new achievement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { treeId, memberId, achievementTypeId, date, title, description } = body;

        if (!treeId || !memberId || !achievementTypeId || !date) {
            return NextResponse.json(
                { error: "Missing required fields: treeId, memberId, achievementTypeId, date" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Insert new achievement
        const stmt = db.prepare(`
      INSERT INTO Achievement (title, achieveDate, description, familyMemberId, achievementTypeId)
      VALUES (?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            title || "",
            date,
            description || "",
            parseInt(memberId),
            parseInt(achievementTypeId)
        );

        db.close();

        return NextResponse.json({
            success: true,
            id: result.lastInsertRowid.toString(),
            message: "Achievement created successfully",
        });
    } catch (error) {
        console.error("Error creating achievement:", error);
        return NextResponse.json(
            { error: "Failed to create achievement" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an achievement
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const achievementId = searchParams.get("id");

        if (!achievementId) {
            return NextResponse.json(
                { error: "Achievement ID is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Delete the achievement
        const stmt = db.prepare(`DELETE FROM Achievement WHERE id = ?`);
        const result = stmt.run(parseInt(achievementId));

        db.close();

        if (result.changes === 0) {
            return NextResponse.json(
                { error: "Achievement not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Achievement deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting achievement:", error);
        return NextResponse.json(
            { error: "Failed to delete achievement" },
            { status: 500 }
        );
    }
}

// PUT - Update an existing achievement
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, date, description, category } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Achievement ID is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // If category is provided, find the achievement type ID
        let achievementTypeId = null;
        if (category) {
            const typeResult = db.prepare(`
                SELECT at.id FROM AchievementType at
                JOIN Achievement a ON a.achievementTypeId = at.id
                WHERE a.id = ?
            `).get(id) as { id: number } | undefined;

            // Try to find type by name
            const typeByName = db.prepare(`
                SELECT id FROM AchievementType WHERE typeName = ?
            `).get(category) as { id: number } | undefined;

            if (typeByName) {
                achievementTypeId = typeByName.id;
            }
        }

        // Build update query dynamically
        const updates: string[] = [];
        const params: (string | number)[] = [];

        if (title !== undefined) {
            updates.push("title = ?");
            params.push(title);
        }
        if (date !== undefined) {
            updates.push("achieveDate = ?");
            params.push(date);
        }
        if (description !== undefined) {
            updates.push("description = ?");
            params.push(description);
        }
        if (achievementTypeId !== null) {
            updates.push("achievementTypeId = ?");
            params.push(achievementTypeId);
        }

        if (updates.length === 0) {
            db.close();
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        params.push(parseInt(id));
        const stmt = db.prepare(`UPDATE Achievement SET ${updates.join(", ")} WHERE id = ?`);
        const result = stmt.run(...params);

        db.close();

        if (result.changes === 0) {
            return NextResponse.json(
                { error: "Achievement not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Achievement updated successfully",
        });
    } catch (error) {
        console.error("Error updating achievement:", error);
        return NextResponse.json(
            { error: "Failed to update achievement" },
            { status: 500 }
        );
    }
}
