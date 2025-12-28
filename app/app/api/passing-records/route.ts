import { NextRequest, NextResponse } from "next/server";
import { getDb, formatDateShort, getYear } from "@/lib/db";

interface PassingRow {
    id: number;
    dateOfPassing: string;
    memberName: string;
    memberId: number;
    causeName: string | null;
}

interface BurialRow {
    passingRecordId: number;
    location: string;
    startDate: string | null;
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

        // Build query with optional year filter
        let query = `
      SELECT 
        pr.id,
        pr.dateOfPassing,
        fm.fullName as memberName,
        fm.id as memberId,
        cod.causeName
      FROM PassingRecord pr
      JOIN FamilyMember fm ON pr.familyMemberId = fm.id
      LEFT JOIN CauseOfDeath cod ON cod.passingRecordId = pr.id
      WHERE fm.familyTreeId = ?
    `;

        const params: (string | number)[] = [treeId];

        if (yearFilter !== "all") {
            query += ` AND strftime('%Y', pr.dateOfPassing) = ?`;
            params.push(yearFilter);
        }

        query += ` ORDER BY pr.dateOfPassing DESC`;

        const passingRecords = db.prepare(query).all(...params) as PassingRow[];

        // Get burial places for each passing record
        const burialPlaces = db
            .prepare(
                `
      SELECT passingRecordId, location, startDate
      FROM BuriedPlace
      ORDER BY startDate
    `
            )
            .all() as BurialRow[];

        // Get available years for dropdown
        const yearsResult = db
            .prepare(
                `
      SELECT DISTINCT strftime('%Y', pr.dateOfPassing) as year
      FROM PassingRecord pr
      JOIN FamilyMember fm ON pr.familyMemberId = fm.id
      WHERE fm.familyTreeId = ?
      ORDER BY year DESC
    `
            )
            .all(treeId) as { year: string }[];

        const availableYears = yearsResult.map((r) => r.year).filter(Boolean);

        db.close();

        // Group by year
        const groupedByYear: Record<string, PassingEntry[]> = {};

        interface PassingEntry {
            id: string;
            year: string;
            title: string;
            person: string;
            date: string;
            location: string;
            cause: string;
            causes: string[];
            burialPlaces: { location: string; startDate: string }[];
            iconPath: string;
        }

        for (const pr of passingRecords) {
            const year = getYear(pr.dateOfPassing);
            const recordBurials = burialPlaces.filter(
                (b) => b.passingRecordId === pr.id
            );
            const causes = pr.causeName ? pr.causeName.split(", ") : [];

            const entry: PassingEntry = {
                id: pr.id.toString(),
                year,
                title: `The passing of ${pr.memberName}`,
                person: pr.memberName,
                date: formatDateShort(pr.dateOfPassing),
                location: recordBurials.length > 0 ? recordBurials[recordBurials.length - 1].location : "",
                cause: causes.length > 0 ? `Causes: ${causes.join(", ")}` : "",
                causes,
                burialPlaces: recordBurials.map((b) => ({
                    location: b.location,
                    startDate: formatDateShort(b.startDate),
                })),
                iconPath: "/icons/passing.png",
            };

            if (!groupedByYear[year]) {
                groupedByYear[year] = [];
            }
            groupedByYear[year].push(entry);
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
        console.error("Error fetching passing records:", error);
        return NextResponse.json(
            { error: "Failed to fetch passing records" },
            { status: 500 }
        );
    }
}
