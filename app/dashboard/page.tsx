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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          {/* DNA Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center shadow-sm">
              <Image
                src="/images/logo.png"
                alt="Family Tree Logo"
                width={48}
                height={48}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Family Tree
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Start building your family legacy by creating your first family tree
          </p>

          {/* CTA Button */}
          <RippleButton
            onClick={() => router.push("/dashboard/family-trees/new")}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl inline-flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-6 h-6" />
            Create your first family tree
          </RippleButton>
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
