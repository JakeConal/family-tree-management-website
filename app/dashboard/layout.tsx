"use client";

import { Sidebar } from "../../components/ui/sidebar";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

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
    <div className="flex min-h-screen bg-white">
      {sidebarVisible && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <header className="h-[60px] flex items-center px-8 border-b border-gray-100">
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
        </header>
        <main className="flex-1 p-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
