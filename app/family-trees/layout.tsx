"use client";

import { ReactNode } from "react";

export default function FamilyTreesLayout({ children }: { children: ReactNode }) {
	return <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>;
}
