"use client";

import classNames from "classnames";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import { Providers } from "./providers";
import { Sidebar } from "@/components/ui/sidebar";
import CreateFamilyTreePanel from "@/components/CreateFamilyTreePanel";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { closeCreatePanel } from "@/lib/store/createPanelSlice";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const playfair = Playfair_Display({
	variable: "--font-playfair",
	subsets: ["latin"],
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

function RootLayoutContent({ children }: { children: React.ReactNode }) {
	const [sidebarVisible, setSidebarVisible] = useState(true);
	const pathname = usePathname();
	const { data: session, status } = useSession();
	const dispatch = useAppDispatch();
	const isCreatePanelOpen = useAppSelector((state) => state.createPanel.isOpen);

	// Only show sidebar when authenticated and not on welcome/login/signup pages
	const shouldShowSidebar = status === "authenticated" && !pathname.startsWith("/welcome") && !pathname.startsWith("/signup");

	useEffect(() => {
		// Close sidebar on mobile when navigating
		if (window.innerWidth < 1024) {
			setSidebarVisible(false);
		}
	}, [pathname]);

	useEffect(() => {
		// Initialize from localStorage
		const saved = localStorage.getItem("sidebar-visible");
		if (saved !== null) {
			const isVisible = saved === "true";
			setSidebarVisible(isVisible);
		} else {
			// Default to false on mobile
			if (window.innerWidth < 1024) {
				setSidebarVisible(false);
			}
		}

		// Handle window resize
		const handleResize = () => {
			if (window.innerWidth < 1024) {
				setSidebarVisible(false);
			} else {
				// Restore from localStorage on desktop if it was saved as visible
				const savedDesktop = localStorage.getItem("sidebar-visible");
				const shouldBeVisible = savedDesktop === "true" || savedDesktop === null;
				setSidebarVisible(shouldBeVisible);
			}
		};

		// Listen for sidebar toggle events
		const handleSidebarToggle = (event: CustomEvent) => {
			setSidebarVisible(event.detail.visible);
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("sidebar-toggle", handleSidebarToggle as EventListener);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("sidebar-toggle", handleSidebarToggle as EventListener);
		};
	}, []);

	// If not authenticated or on welcome/signup pages, render children without sidebar
	if (!shouldShowSidebar) {
		return <>{children}</>;
	}

	return (
		<div className="flex h-screen bg-white overflow-hidden relative">
			{/* Sidebar Overlay for mobile */}
			{sidebarVisible && (
				<div
					className="fixed inset-0 bg-black/20 z-30 lg:hidden"
					onClick={() => {
						setSidebarVisible(false);
						localStorage.setItem("sidebar-visible", "false");
						window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { visible: false } }));
					}}
				/>
			)}

			{/* Sidebar */}
			<div
				className={classNames(
					"fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out lg:relative overflow-hidden bg-[#f4f4f5] h-full",
					{
						"translate-x-0 w-[220px]": sidebarVisible,
						"-translate-x-full lg:translate-x-0 lg:w-0": !sidebarVisible,
					}
				)}
			>
				<div className="w-[220px] h-full">
					<Sidebar />
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 flex flex-col min-w-0 h-full">
				{/* Header with hamburger menu */}
				<header className="h-[60px] flex items-center px-4 lg:px-8 border-b border-gray-100 relative flex-shrink-0 bg-white z-20">
					<button
						onClick={() => {
							const newVisible = !sidebarVisible;
							setSidebarVisible(newVisible);
							localStorage.setItem("sidebar-visible", String(newVisible));
							window.dispatchEvent(
								new CustomEvent("sidebar-toggle", {
									detail: { visible: newVisible },
								})
							);
						}}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M3.75 7.5H11.25M3.75 15H26.25M3.75 22.5H11.25" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					</button>
				</header>

				{/* Content */}
				<div className="flex-1 overflow-y-auto">{children}</div>
			</div>

			{/* Create Family Tree Panel - Desktop (Push) */}
			<aside
				className={classNames(
					"hidden md:block transition-all duration-300 ease-in-out border-l border-[#e4e4e7] bg-white overflow-hidden shrink-0 h-full",
					{
						"w-[600px]": isCreatePanelOpen,
						"w-0": !isCreatePanelOpen,
					}
				)}
			>
				<div className="w-[600px] h-full">
					<CreateFamilyTreePanel onClose={() => dispatch(closeCreatePanel())} />
				</div>
			</aside>

			{/* Create Family Tree Panel - Mobile (Overlay) */}
			<aside
				className={classNames(
					"md:hidden fixed inset-0 bg-white z-50 transition-transform duration-300 ease-in-out",
					{
						"translate-x-0": isCreatePanelOpen,
						"translate-x-full": !isCreatePanelOpen,
					}
				)}
			>
				<CreateFamilyTreePanel onClose={() => dispatch(closeCreatePanel())} />
			</aside>
		</div>
	);
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={classNames(geistSans.variable, geistMono.variable, playfair.variable, inter.variable, "antialiased")}>
				<Providers>
					<RootLayoutContent>{children}</RootLayoutContent>
				</Providers>
			</body>
		</html>
	);
}
