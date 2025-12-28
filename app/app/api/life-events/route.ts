import { NextRequest, NextResponse } from "next/server";
import { getDb, formatDateShort, getYear } from "@/lib/db";

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
            description: string;
            background: string;
            iconSrc: string;
            eventType: "marriage" | "divorce";
            member1: string;
            member2: string;
        }

        const events: LifeEventEntry[] = [];

        for (const rel of relationships) {
            // Add marriage event
            const marriageYear = getYear(rel.marriageDate);
            events.push({
                id: `marriage-${rel.id}`,
                year: marriageYear,
                title: `${rel.member1Name} & ${rel.member2Name} Say "I Do"`,
                date: formatDateShort(rel.marriageDate),
                description:
                    "Happiness starts here! The couple held an intimate ceremony, marking the beginning of a new chapter in their lives.",
                background: "#FECACA",
                iconSrc: "/icons/ket_hon.png",
                eventType: "marriage",
                member1: rel.member1Name,
                member2: rel.member2Name,
            });

            // Add divorce event if exists
            if (rel.divorceDate) {
                const divorceYear = getYear(rel.divorceDate);
                events.push({
                    id: `divorce-${rel.id}`,
                    year: divorceYear,
                    title: `${rel.member1Name}'s Separation from ${rel.member2Name}`,
                    date: formatDateShort(rel.divorceDate),
                    description:
                        "The end of a relationship. The two agreed to separate peacefully and move on with their individual lives.",
                    background: "#DCCCF4",
                    iconSrc: "/icons/broken.png",
                    eventType: "divorce",
                    member1: rel.member1Name,
                    member2: rel.member2Name,
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
