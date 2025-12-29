"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { RippleButton } from "../../components/ui/ripple-button";
import { Users, Trophy, Plus, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasFamilyTrees, setHasFamilyTrees] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/welcome/login");
    }
  }, [session, status]);

  useEffect(() => {
    const checkFamilyTrees = async () => {
      if (session?.user?.id) {
        try {
          console.log("Checking family trees for user:", session.user.id);
          const response = await fetch("/api/family-trees");
          console.log("API response status:", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("Family trees data:", data);
            setHasFamilyTrees(data.length > 0);
          } else {
            console.error("API error:", response.status, response.statusText);
            setHasFamilyTrees(false);
          }
        } catch (error) {
          console.error("Error checking family trees:", error);
          setHasFamilyTrees(false);
        }
      }
    };

    if (status === "authenticated") {
      checkFamilyTrees();
    }
  }, [session, status]);

  if (status === "loading" || hasFamilyTrees === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Empty state when user has no family trees
  if (!hasFamilyTrees) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Logo */}
        <div className="absolute top-[226px] left-1/2 -translate-x-1/2 w-[275px] h-[275px] opacity-50 blur-[2px] pointer-events-none">
          <Image
            src="/images/logo.png"
            alt="Background Logo"
            fill
            className="object-contain"
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="font-inter font-bold text-[48px] text-black mb-4 leading-tight">
            Welcome to Family Tree
          </h1>

          {/* Subtitle */}
          <p className="font-inter font-normal text-[26px] text-black mb-12 leading-relaxed max-w-[1036px]">
            Start building your family legacy by creating your first family tree
          </p>

          {/* CTA Button */}
          <button
            onClick={() => router.push("/dashboard/family-trees/new")}
            className="bg-[#84cc16] hover:bg-[#76b813] text-white w-[816px] h-[83px] text-[24px] font-semibold rounded-[30px] inline-flex items-center justify-center gap-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.6)] transition-all active:scale-[0.98]"
          >
            <Plus className="w-8 h-8" />
            Create your first family tree
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {session.user?.name || session.user?.email}!
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Family Trees
            </h3>
            <p className="text-gray-600">Create and manage your family trees</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Members
            </h3>
            <p className="text-gray-600">Add and organize family members</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Achievements
            </h3>
            <p className="text-gray-600">
              Track family achievements and milestones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
