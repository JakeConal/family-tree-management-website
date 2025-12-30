"use client";

import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import { Providers } from "./providers";
import { Sidebar } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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

	// Only show sidebar when authenticated and not on welcome/login/signup pages
	const shouldShowSidebar = status === "authenticated" && !pathname.startsWith("/welcome") && !pathname.startsWith("/signup");

	useEffect(() => {
		// Close sidebar on mobile when navigating
		if (window.innerWidth < 1024) {
			setSidebarVisible((prev) => (prev !== false ? false : prev));
		}
	}, [pathname]);

	useEffect(() => {
		// Initialize from localStorage
		const saved = localStorage.getItem("sidebar-visible");
		if (saved !== null) {
			const isVisible = saved === "true";
			setSidebarVisible((prev) => (prev !== isVisible ? isVisible : prev));
		} else {
			// Default to false on mobile
			if (window.innerWidth < 1024) {
				setSidebarVisible((prev) => (prev !== false ? false : prev));
			}
		}

		// Handle window resize
		const handleResize = () => {
			if (window.innerWidth < 1024) {
				setSidebarVisible((prev) => (prev !== false ? false : prev));
			} else {
				// Restore from localStorage on desktop if it was saved as visible
				const savedDesktop = localStorage.getItem("sidebar-visible");
				const shouldBeVisible = savedDesktop === "true" || savedDesktop === null;
				setSidebarVisible((prev) => (prev !== shouldBeVisible ? shouldBeVisible : prev));
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
				className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out lg:relative ${
					sidebarVisible ? "translate-x-0 w-[220px]" : "-translate-x-full lg:translate-x-0 lg:w-0"
				} overflow-hidden bg-[#f4f4f5] h-full`}
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
			<body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} antialiased`}>
				<Providers>
					<RootLayoutContent>{children}</RootLayoutContent>
				</Providers>
			</body>
		</html>
	);
}
