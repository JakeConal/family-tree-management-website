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
      <main
        className={`flex-1 p-8 transition-all duration-300 ${
          sidebarVisible ? "ml-64" : "ml-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
