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
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { familyTrees } = useFamilyTrees(session);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsCreatePanelOpen(true);
    } else {
      setIsCreatePanelOpen(false);
    }
  }, [searchParams]);

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
      setSidebarVisible(saved === "true");
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
    <div className="flex min-h-screen bg-white overflow-hidden">
      {sidebarVisible && <Sidebar />}
      <div className="flex-1 flex flex-row min-w-0">
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          <header className="h-[60px] flex items-center px-8 border-b border-gray-100 relative flex-shrink-0">
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors z-20"
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <h1 className="font-inter font-semibold text-[20px] text-black">
                  {activeFamilyTreeName}
                </h1>
              </div>
            )}
          </header>
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Create Family Tree Panel */}
        <aside 
          className={`fixed top-0 right-0 h-full bg-white border-l border-[#e4e4e7] shadow-2xl transition-all duration-300 z-50 overflow-hidden ${
            isCreatePanelOpen ? 'w-[600px] translate-x-0' : 'w-0 translate-x-full'
          }`}
        >
          <div className="w-[600px] h-full">
            <CreateFamilyTreePanel onClose={closeCreatePanel} />
          </div>
        </aside>

        {/* Spacer to push content when panel is open */}
        <div 
          className="hidden md:block transition-all duration-300 overflow-hidden flex-shrink-0" 
          style={{ width: isCreatePanelOpen ? '600px' : '0px' }}
        />
      </div>
    </div>
  );
}
