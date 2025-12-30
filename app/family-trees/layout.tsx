"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFamilyTrees } from "@/lib/useFamilyTrees";

export default function FamilyTreesLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { data: session } = useSession();
	const { familyTrees } = useFamilyTrees(session);

	const activeFamilyTreeName = useMemo(() => {
		const match = pathname.match(/\/family-trees\/(\d+)/);
		if (match) {
			const id = parseInt(match[1]);
			const tree = familyTrees.find((t) => t.id === id);
			return tree ? `${tree.familyName} Family` : "";
		}
		return "";
	}, [pathname, familyTrees]);

	return (
		<div className="flex flex-row min-w-0 h-full">
			<div className="flex-1 flex flex-col min-w-0 h-full">
				{/* Header showing active family tree name */}
				{activeFamilyTreeName && (
					<header className="h-[60px] flex items-center justify-center px-4 lg:px-8 border-b border-gray-100 relative shrink-0 bg-white z-20">
						<h1 className="font-inter font-semibold text-[14px] md:text-[16px] lg:text-[20px] text-black truncate">{activeFamilyTreeName}</h1>
					</header>
				)}
				<main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
			</div>
		</div>
	);
}
