"use client";

import { useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  LogOut,
  LayoutDashboard,
  TreePine,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useFamilyTrees } from "../../../lib/useFamilyTrees";

export function Sidebar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { familyTrees, loading } = useFamilyTrees(session);

  // Extract family tree ID from pathname for active state
  const getFamilyTreeIdFromPath = () => {
    const match = pathname.match(/\/dashboard\/family-trees\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };

  const activeFamilyTreeId = getFamilyTreeIdFromPath();

  const navigationItems = useMemo(() => {
    const familyTreeHref = activeFamilyTreeId
      ? `/dashboard/family-trees/${activeFamilyTreeId}/tree`
      : familyTrees.length > 0
      ? `/dashboard/family-trees/${familyTrees[0].id}/tree`
      : "/dashboard";

    return [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Family Tree", href: familyTreeHref, icon: TreePine },
      { name: "Members", href: "/dashboard/members", icon: Users },
      { name: "Life Event", href: "/dashboard/events", icon: Calendar },
      { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];
  }, [activeFamilyTreeId, familyTrees]);

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <Image
          src="/images/logo.png"
          alt="Family Tree Logo"
          width={24}
          height={24}
          className="mr-2"
        />
        <span className="text-xl font-bold text-gray-900">Family Tree</span>
      </div>

      {/* Family Trees Section */}
      {status === "authenticated" && (
        <div className="px-4 py-6 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            My Family Trees
          </h2>
          <div className="space-y-2 mb-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              </div>
            ) : familyTrees.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No family trees yet
              </p>
            ) : (
              familyTrees.map((tree) => (
                <button
                  key={tree.id}
                  onClick={() =>
                    router.push(`/dashboard/family-trees/${tree.id}`)
                  }
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeFamilyTreeId === tree.id
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="truncate">{tree.familyName}</span>
                  {activeFamilyTreeId === tree.id && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => router.push("/dashboard/family-trees/new")}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Tree
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive =
              item.name === "Dashboard"
                ? pathname === "/dashboard" ||
                  (pathname.startsWith("/dashboard/family-trees/") &&
                    !pathname.includes("/tree") &&
                    !pathname.endsWith("/new"))
                : item.name === "Family Tree"
                ? pathname.includes("/tree")
                : pathname === item.href;

            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-green-700">
                {session?.user?.name?.charAt(0) ||
                  session?.user?.email?.charAt(0) ||
                  "U"}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {session?.user?.name || "User"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/welcome" })}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
