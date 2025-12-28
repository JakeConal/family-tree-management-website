import { NextRequest, NextResponse } from "next/server";
import { getDb, formatDate, getYear } from "@/lib/db";

interface SpouseRow {
    id: number;
    marriageDate: string;
    divorceDate: string | null;
    member1Name: string;
    member2Name: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const treeId = searchParams.get("treeId");
        const yearFilter = searchParams.get("year") || "all";

        if (!treeId) {
            return NextResponse.json(
                { error: "treeId is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Get spouse relationships
        let query = `
      SELECT 
        sr.id,
        sr.marriageDate,
        sr.divorceDate,
        fm1.fullName as member1Name,
        fm2.fullName as member2Name
      FROM SpouseRelationship sr
      JOIN FamilyMember fm1 ON sr.familyMember1Id = fm1.id
      JOIN FamilyMember fm2 ON sr.familyMember2Id = fm2.id
      WHERE fm1.familyTreeId = ?
    `;

        const params: (string | number)[] = [treeId];

        if (yearFilter !== "all") {
            query += ` AND (strftime('%Y', sr.marriageDate) = ? OR strftime('%Y', sr.divorceDate) = ?)`;
            params.push(yearFilter, yearFilter);
        }

        query += ` ORDER BY sr.marriageDate DESC`;

        const relationships = db.prepare(query).all(...params) as SpouseRow[];

        // Get available years
        const yearsResult = db
            .prepare(
                `
      SELECT DISTINCT year FROM (
        SELECT strftime('%Y', sr.marriageDate) as year
        FROM SpouseRelationship sr
        JOIN FamilyMember fm1 ON sr.familyMember1Id = fm1.id
        WHERE fm1.familyTreeId = ?
        UNION
        SELECT strftime('%Y', sr.divorceDate) as year
        FROM SpouseRelationship sr
        JOIN FamilyMember fm1 ON sr.familyMember1Id = fm1.id
        WHERE fm1.familyTreeId = ? AND sr.divorceDate IS NOT NULL
      )
      WHERE year IS NOT NULL
      ORDER BY year DESC
    `
            )
            .all(treeId, treeId) as { year: string }[];

        const availableYears = yearsResult.map((r) => r.year).filter(Boolean);

        db.close();

        // Create life events from relationships
        interface LifeEventEntry {
            id: string;
            year: string;
            title: string;
            date: string;
            rawDate: string; // YYYY-MM-DD format for edit form
            description: string;
            background: string;
            iconSrc: string;
            eventType: "marriage" | "divorce";
            member1: string;
            member2: string;
            relationshipId: number; // Original relationship ID for updates
        }

        const events: LifeEventEntry[] = [];

        for (const rel of relationships) {
            // Add marriage event
            const marriageYear = getYear(rel.marriageDate);
            events.push({
                id: `marriage-${rel.id}`,
                year: marriageYear,
                title: `${rel.member1Name} & ${rel.member2Name} Say "I Do"`,
                date: formatDate(rel.marriageDate),
                rawDate: rel.marriageDate || "",
                description:
                    "Happiness starts here! The couple held an intimate ceremony, marking the beginning of a new chapter in their lives.",
                background: "#FECACA",
                iconSrc: "/icons/ket_hon.png",
                eventType: "marriage",
                member1: rel.member1Name,
                member2: rel.member2Name,
                relationshipId: rel.id,
            });

            // Add divorce event if exists
            if (rel.divorceDate) {
                const divorceYear = getYear(rel.divorceDate);
                events.push({
                    id: `divorce-${rel.id}`,
                    year: divorceYear,
                    title: `${rel.member1Name}'s Separation from ${rel.member2Name}`,
                    date: formatDate(rel.divorceDate),
                    rawDate: rel.divorceDate || "",
                    description:
                        "The end of a relationship. The two agreed to separate peacefully and move on with their individual lives.",
                    background: "#DCCCF4",
                    iconSrc: "/icons/broken.png",
                    eventType: "divorce",
                    member1: rel.member1Name,
                    member2: rel.member2Name,
                    relationshipId: rel.id,
                });
            }
        }

        // Sort by date and group by year
        events.sort((a, b) => {
            const dateA = new Date(a.date.split("/").reverse().join("-"));
            const dateB = new Date(b.date.split("/").reverse().join("-"));
            return dateB.getTime() - dateA.getTime();
        });

        const groupedByYear: Record<string, LifeEventEntry[]> = {};
        for (const event of events) {
            if (!groupedByYear[event.year]) {
                groupedByYear[event.year] = [];
            }
            groupedByYear[event.year].push(event);
        }

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
        console.error("Error fetching life events:", error);
        return NextResponse.json(
            { error: "Failed to fetch life events" },
            { status: 500 }
        );
    }
}

// PUT - Update a life event (marriage or divorce date, and member names)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { relationshipId, eventType, date, member1, member2 } = body;

        if (!relationshipId || !eventType) {
            return NextResponse.json(
                { error: "relationshipId and eventType are required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Build dynamic update based on eventType
        const updates: string[] = [];
        const params: (string | number)[] = [];

        // Update date if provided
        if (date) {
            if (eventType === "marriage") {
                updates.push("marriageDate = ?");
            } else if (eventType === "divorce") {
                updates.push("divorceDate = ?");
            }
            params.push(date);
        }

        // Update member1 if provided (find member ID by name)
        if (member1) {
            const memberResult = db.prepare(`SELECT id FROM FamilyMember WHERE fullName = ?`).get(member1) as { id: number } | undefined;
            if (memberResult) {
                updates.push("familyMember1Id = ?");
                params.push(memberResult.id);
            }
        }

        // Update member2 if provided (find member ID by name)
        if (member2) {
            const memberResult = db.prepare(`SELECT id FROM FamilyMember WHERE fullName = ?`).get(member2) as { id: number } | undefined;
            if (memberResult) {
                updates.push("familyMember2Id = ?");
                params.push(memberResult.id);
            }
        }

        if (updates.length === 0) {
            db.close();
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        params.push(parseInt(relationshipId));
        const stmt = db.prepare(`UPDATE SpouseRelationship SET ${updates.join(", ")} WHERE id = ?`);
        const result = stmt.run(...params);

        db.close();

        if (result.changes === 0) {
            return NextResponse.json(
                { error: "Life event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Life event updated successfully",
        });
    } catch (error) {
        console.error("Error updating life event:", error);
        return NextResponse.json(
            { error: "Failed to update life event" },
            { status: 500 }
        );
    }
}
