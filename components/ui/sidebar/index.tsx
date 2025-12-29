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
    <div className="h-screen w-[220px] bg-[#f4f4f5] border-r border-gray-200 flex flex-col sticky top-0">
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
          <div className="space-y-1 mb-4">
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
                  className={`w-full flex items-center h-[36px] px-[14px] text-[16px] font-inter transition-colors rounded-[30px] ${
                    activeFamilyTreeId === tree.id
                      ? "bg-[#d4d4d8] text-black"
                      : "text-black hover:bg-gray-200"
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
      <div className="flex-1 px-[20px] py-2">
        <h2 className="font-inter font-bold text-[16px] text-black mb-[10px]">
          Pages
        </h2>
        <nav className="space-y-1">
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
                className={`w-full flex items-center h-[36px] px-[14px] text-[16px] font-inter font-normal rounded-[30px] transition-colors ${
                  isActive
                    ? "bg-[#d4d4d8] text-black"
                    : "text-black hover:bg-gray-200"
                }`}
              >
                <item.icon className={`w-[20px] h-[20px] mr-[10px] ${isActive ? "text-black" : "text-gray-500"}`} />
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
