// Database utility using better-sqlite3 for direct SQLite access
import Database from "better-sqlite3";
import path from "path";

// Get database path relative to project root
const dbPath = path.join(process.cwd(), "dev.db");

export function getDb() {
    return new Database(dbPath);
}

// Helper to format date for display
export function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

// Helper to format date as MM/DD/YYYY
export function formatDateShort(dateStr: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

// Helper to get year from date string
export function getYear(dateStr: string | null): string {
    if (!dateStr) return "";
    return new Date(dateStr).getFullYear().toString();
}
