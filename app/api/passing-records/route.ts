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
            rawDate: string;
            location: string;
            cause: string;
            causes: string[];
            burialPlaces: { location: string; startDate: string; rawStartDate: string }[];
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
                rawDate: pr.dateOfPassing,
                location: recordBurials.length > 0 ? recordBurials[recordBurials.length - 1].location : "",
                cause: causes.length > 0 ? `Causes: ${causes.join(", ")}` : "",
                causes,
                burialPlaces: recordBurials.map((b) => ({
                    location: b.location,
                    startDate: formatDateShort(b.startDate),
                    rawStartDate: b.startDate || "",
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

// POST - Create new passing record
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { treeId, memberId, dateOfPassing, causes, burialPlaces } = body;

        if (!treeId || !memberId || !dateOfPassing) {
            return NextResponse.json(
                { error: "Missing required fields: treeId, memberId, dateOfPassing" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Start a transaction
        const insertPassingRecord = db.transaction(() => {
            // Insert passing record
            const passingStmt = db.prepare(`
                INSERT INTO PassingRecord (dateOfPassing, familyMemberId, createdAt)
                VALUES (?, ?, datetime('now'))
            `);
            const passingResult = passingStmt.run(dateOfPassing, parseInt(memberId));
            const passingRecordId = passingResult.lastInsertRowid;

            // Insert causes of death (combined into one cause)
            if (causes && causes.length > 0) {
                const causeName = causes.join(", ");
                const causeStmt = db.prepare(`
                    INSERT INTO CauseOfDeath (causeName, passingRecordId, familyMemberId)
                    VALUES (?, ?, ?)
                `);
                causeStmt.run(causeName, passingRecordId, parseInt(memberId));
            }

            // Insert burial places
            if (burialPlaces && burialPlaces.length > 0) {
                const burialStmt = db.prepare(`
                    INSERT INTO BuriedPlace (location, startDate, passingRecordId)
                    VALUES (?, ?, ?)
                `);
                for (const place of burialPlaces) {
                    if (place.location) {
                        burialStmt.run(place.location, place.startDate || null, passingRecordId);
                    }
                }
            }

            return passingRecordId;
        });

        const passingRecordId = insertPassingRecord();

        db.close();

        return NextResponse.json({
            success: true,
            id: passingRecordId.toString(),
            message: "Passing record created successfully",
        });
    } catch (error) {
        console.error("Error creating passing record:", error);
        return NextResponse.json(
            { error: "Failed to create passing record" },
            { status: 500 }
        );
    }
}

// PUT - Update an existing passing record
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, dateOfPassing, causes, burialPlaces } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Passing record ID is required" },
                { status: 400 }
            );
        }

        const db = getDb();

        // Start a transaction
        const updatePassingRecord = db.transaction(() => {
            // Update date of passing
            if (dateOfPassing) {
                const updateStmt = db.prepare(`
                    UPDATE PassingRecord SET dateOfPassing = ? WHERE id = ?
                `);
                updateStmt.run(dateOfPassing, parseInt(id));
            }

            // Update causes of death
            if (causes && causes.length > 0) {
                // Get the familyMemberId from the passing record
                const passingRecord = db.prepare(`
                    SELECT familyMemberId FROM PassingRecord WHERE id = ?
                `).get(parseInt(id)) as { familyMemberId: number } | undefined;

                if (passingRecord) {
                    // Delete existing cause
                    db.prepare(`DELETE FROM CauseOfDeath WHERE passingRecordId = ?`).run(parseInt(id));

                    // Insert new cause (combined)
                    const causeName = causes.join(", ");
                    const causeStmt = db.prepare(`
                        INSERT INTO CauseOfDeath (causeName, passingRecordId, familyMemberId)
                        VALUES (?, ?, ?)
                    `);
                    causeStmt.run(causeName, parseInt(id), passingRecord.familyMemberId);
                }
            }

            // Update burial places
            if (burialPlaces && burialPlaces.length > 0) {
                // Delete existing burial places
                db.prepare(`DELETE FROM BuriedPlace WHERE passingRecordId = ?`).run(parseInt(id));

                // Insert new burial places
                const burialStmt = db.prepare(`
                    INSERT INTO BuriedPlace (location, startDate, passingRecordId)
                    VALUES (?, ?, ?)
                `);
                for (const place of burialPlaces) {
                    if (place.location) {
                        burialStmt.run(place.location, place.startDate || null, parseInt(id));
                    }
                }
            }
        });

        updatePassingRecord();

        db.close();

        return NextResponse.json({
            success: true,
            message: "Passing record updated successfully",
        });
    } catch (error) {
        console.error("Error updating passing record:", error);
        return NextResponse.json(
            { error: "Failed to update passing record" },
            { status: 500 }
        );
    }
}
