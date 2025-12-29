"use client";

import { Sidebar } from "../../components/ui/sidebar";
import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFamilyTrees } from "../../lib/useFamilyTrees";
import CreateFamilyTreePanel from "../../components/CreateFamilyTreePanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreatePanelOpen = searchParams.get("create") === "true";
  const { data: session } = useSession();
  const { familyTrees } = useFamilyTrees(session);

  const closeCreatePanel = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const activeFamilyTreeName = useMemo(() => {
    const match = pathname.match(/\/dashboard\/family-trees\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const tree = familyTrees.find((t) => t.id === id);
      return tree ? `${tree.familyName} Family` : "";
    }
    return "";
  }, [pathname, familyTrees]);

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

    // Listen for sidebar toggle events
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarVisible(event.detail.visible);
    };

    window.addEventListener(
      "sidebar-toggle",
      handleSidebarToggle as EventListener
    );

    return () => {
      window.removeEventListener(
        "sidebar-toggle",
        handleSidebarToggle as EventListener
      );
    };
  }, []);

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
          sidebarVisible 
            ? "translate-x-0 w-[220px]" 
            : "-translate-x-full lg:translate-x-0 lg:w-0"
        } overflow-hidden bg-[#f4f4f5] h-full`}
      >
        <div className="w-[220px] h-full">
          <Sidebar />
        </div>
      </div>

      <div className="flex-1 flex flex-row min-w-0 h-full">
        <div className="flex-1 flex flex-col min-w-0 h-full">
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
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.75 7.5H11.25M3.75 15H26.25M3.75 22.5H11.25"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            {activeFamilyTreeName && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
                <h1 className="font-inter font-semibold text-[14px] md:text-[16px] lg:text-[20px] text-black truncate">
                  {activeFamilyTreeName}
                </h1>
              </div>
            )}
          </header>
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Create Family Tree Panel - Desktop (Push) */}
        <aside 
          className={`hidden md:block transition-all duration-300 ease-in-out border-l border-[#e4e4e7] bg-white overflow-hidden flex-shrink-0 h-full ${
            isCreatePanelOpen ? 'w-[600px]' : 'w-0'
          }`}
        >
          <div className="w-[600px] h-full">
            <CreateFamilyTreePanel onClose={closeCreatePanel} />
          </div>
        </aside>
      </div>

      {/* Create Family Tree Panel - Mobile (Overlay) */}
      <aside 
        className={`md:hidden fixed inset-0 bg-white z-50 transition-transform duration-300 ease-in-out ${
          isCreatePanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <CreateFamilyTreePanel onClose={closeCreatePanel} />
      </aside>
    </div>
  );
}
