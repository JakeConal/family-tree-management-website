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
    <div className="fixed left-0 top-0 z-40 h-screen w-[220px] bg-[#f4f4f5] border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center h-[80px] px-[13px]">
        <Image
          src="/images/logo.png"
          alt="Family Tree Logo"
          width={42}
          height={41}
          className="mr-[5px]"
        />
        <span className="font-playfair font-bold text-[23.908px] text-black">Family Tree</span>
      </div>

      {/* Family Trees Section */}
      {status === "authenticated" && (
        <div className="px-[20px] py-[20px]">
          <h2 className="font-inter font-bold text-[16px] text-black mb-[10px]">
            My Family Trees
          </h2>
          <div className="space-y-2 mb-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              </div>
            ) : familyTrees.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">
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
                      : "text-gray-700 hover:bg-gray-200"
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
            className="flex items-center font-inter font-normal text-[16px] text-black hover:text-green-600 transition-colors"
          >
            <span className="font-bold mr-1">+</span> Create New Tree
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
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                <item.icon className={`w-4 h-4 mr-3 ${isActive ? "text-white" : "text-gray-400"}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-[20px] border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden bg-gray-200">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-green-700">
                    {session?.user?.name?.charAt(0) ||
                      session?.user?.email?.charAt(0) ||
                      "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-[13px]">
              <p className="font-inter font-bold text-[14px] text-black truncate max-w-[100px]">
                {session?.user?.name || "User"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/welcome" })}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
