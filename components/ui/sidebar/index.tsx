"use client";

import { useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, LayoutDashboard, TreePine, Users, Calendar, BarChart3, Settings } from "lucide-react";
import { useFamilyTrees } from "@/lib/useFamilyTrees";

interface NavigationItem {
	name: string;
	href: string;
	icon: any;
	alwaysShow?: boolean;
	familyTreeOnly?: boolean;
	disabled?: boolean;
}

export function Sidebar() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const pathname = usePathname();
	const { familyTrees, loading } = useFamilyTrees(session);

	// Extract family tree ID from pathname for active state
	const getFamilyTreeIdFromPath = () => {
		const match = pathname.match(/\/family-trees\/(\d+)/);
		return match ? parseInt(match[1]) : null;
	};

	const activeFamilyTreeId = getFamilyTreeIdFromPath();

	const navigationItems = useMemo<NavigationItem[]>(() => {
		// Base navigation items
		const baseItems: NavigationItem[] = [{ name: "Home", href: "/dashboard", icon: LayoutDashboard, alwaysShow: true }];

		// Family tree specific items (only show when viewing a family tree)
		const familyTreeItems: NavigationItem[] = activeFamilyTreeId
			? [
					{ name: "Overview", href: `/family-trees/${activeFamilyTreeId}`, icon: LayoutDashboard, familyTreeOnly: true },
					{ name: "Family Tree", href: `/family-trees/${activeFamilyTreeId}/tree`, icon: TreePine, familyTreeOnly: true },
			  ]
			: [];

		// Future feature items (placeholder)
		const futureItems: NavigationItem[] = [
			{ name: "Members", href: "/members", icon: Users, disabled: true },
			{ name: "Life Events", href: "/events", icon: Calendar, disabled: true },
			{ name: "Reports", href: "/reports", icon: BarChart3, disabled: true },
			{ name: "Settings", href: "/settings", icon: Settings, disabled: true },
		];

		return [...baseItems, ...familyTreeItems, ...futureItems];
	}, [activeFamilyTreeId]);

	return (
		<div className="h-full w-[220px] bg-[#f4f4f5] border-r border-gray-200 flex flex-col">
			{/* Logo */}
			<div className="flex items-center h-[80px] px-[13px] flex-shrink-0">
				<Image src="/images/logo.png" alt="Family Tree Logo" width={42} height={41} className="mr-[5px]" />
				<span className="font-playfair font-bold text-[23.908px] text-black">Family Tree</span>
			</div>

			{/* Scrollable Content Area */}
			<div className="flex-1 overflow-y-auto">
				{/* Family Trees Section */}
				{status === "authenticated" && (
					<div className="px-[20px] py-[20px]">
						<h2 className="font-inter font-bold text-[16px] text-black mb-[10px]">My Family Trees</h2>
						<div className="space-y-1 mb-4">
							{loading ? (
								<div className="flex items-center justify-center py-4">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
								</div>
							) : familyTrees.length === 0 ? (
								<p className="text-sm text-gray-500 py-4">No family trees yet</p>
							) : (
								familyTrees.map((tree) => (
									<button
										key={tree.id}
										onClick={() => router.push(`/family-trees/${tree.id}`)}
										className={`w-full flex items-center h-[36px] px-[14px] text-[16px] font-inter transition-colors rounded-[30px] ${
											activeFamilyTreeId === tree.id ? "bg-[#d4d4d8] text-black" : "text-black hover:bg-gray-200"
										}`}
									>
										<div className="w-[16px] h-[16px] flex items-center justify-center mr-[10px]">
											<div className="w-[4px] h-[4px] rounded-full bg-[#d9d4d8]" />
										</div>
										<span className="truncate font-normal">{tree.familyName}</span>
									</button>
								))
							)}
						</div>
						<button
							onClick={() => router.push(`${pathname}?create=true`)}
							className="flex items-center font-inter font-bold text-[16px] text-black hover:text-green-600 transition-colors px-[14px]"
						>
							<span>+ </span>
							<span className="font-normal ml-1">Create New Tree</span>
						</button>
					</div>
				)}

				{/* Navigation */}
				<div className="px-[20px] py-2">
					<h2 className="font-inter font-bold text-[16px] text-black mb-[10px]">Pages</h2>
					<nav className="space-y-1">
						{navigationItems.map((item) => {
							const isActive =
								pathname === item.href ||
								(item.name === "Overview" && pathname.startsWith(`/family-trees/${activeFamilyTreeId}`) && !pathname.includes("/tree"));

							return (
								<button
									key={item.name}
									onClick={() => !item.disabled && router.push(item.href)}
									disabled={item.disabled}
									className={`w-full flex items-center h-[36px] px-[14px] text-[16px] font-inter font-normal rounded-[30px] transition-colors ${
										isActive ? "bg-[#d4d4d8] text-black" : item.disabled ? "text-gray-400 cursor-not-allowed" : "text-black hover:bg-gray-200"
									}`}
									title={item.disabled ? "Coming soon" : undefined}
								>
									<item.icon
										className={`w-[20px] h-[20px] mr-[10px] ${isActive ? "text-black" : item.disabled ? "text-gray-400" : "text-gray-500"}`}
									/>
									{item.name}
								</button>
							);
						})}
					</nav>
				</div>
			</div>

			{/* User Profile Section */}
			<div className="p-[20px] border-t border-gray-200 flex-shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<div className="relative w-[50px] h-[50px] rounded-full overflow-hidden bg-gray-200">
							{session?.user?.image ? (
								<Image src={session.user.image} alt="Profile" fill className="object-cover" />
							) : (
								<div className="w-full h-full bg-green-100 flex items-center justify-center">
									<span className="text-sm font-bold text-green-700">{session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}</span>
								</div>
							)}
						</div>
						<div className="ml-[13px]">
							<p className="font-inter font-bold text-[14px] text-black truncate max-w-[100px]">{session?.user?.name || "User"}</p>
						</div>
					</div>
					<button onClick={() => signOut({ callbackUrl: "/welcome" })} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
						<LogOut className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
