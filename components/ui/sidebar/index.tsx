"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, LogOut } from "lucide-react";

export function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();

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
      <div className="flex-1 px-4 py-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          My Family Trees
        </h2>
        <button
          onClick={() => router.push("/dashboard/family-trees/new")}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Tree
        </button>
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
