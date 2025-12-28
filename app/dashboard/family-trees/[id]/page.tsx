"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Users,
  Heart,
  TreePine,
  Calendar,
  ChevronRight,
  UserPlus,
  Trophy,
  Skull,
  Menu,
  Pencil,
} from "lucide-react";

import AddMemberModal from "../../../../components/modals/AddMemberModal";
import RecordAchievementModal from "../../../../components/modals/RecordAchievementModal";
import ChangeLogDetailsModal from "../../../../components/modals/ChangeLogDetailsModal";

// Mock data types (representing API responses)
interface FamilyTree {
  id: number;
  familyName: string;
  origin: string | null;
  establishYear: number | null;
  createdAt: string;
  treeOwner: {
    fullName: string;
  };
}

interface FamilyStatistics {
  totalGenerations: number;
  totalMembers: number;
  livingMembers: number;
  memberGrowth: { count: number; percentage: number };
  deathTrend: { count: number; percentage: number };
  marriageTrend: { marriages: number; divorces: number };
  achievementGrowth: { count: number; percentage: number };
}

interface ActivityItem {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  avatar?: string;
}

interface ChangeLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  userId: string | null;
  familyTreeId: number;
  oldValues: string | null;
  newValues: string | null;
  createdAt: string;
}

interface FamilyMember {
  id: number;
  fullName: string;
  gender: string;
  birthday: string;
}

export default function FamilyTreeDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const familyTreeId = params.id as string;

  // State for API data
  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
  const [statistics, setStatistics] = useState<FamilyStatistics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isRecordAchievementModalOpen, setIsRecordAchievementModalOpen] =
    useState(false);
  const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([]);
  const [selectedChangeLog, setSelectedChangeLog] = useState<ChangeLog | null>(
    null
  );
  const [isChangeLogDetailsModalOpen, setIsChangeLogDetailsModalOpen] =
    useState(false);

  // Initialize sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-visible");
    if (saved !== null) {
      setSidebarVisible(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newVisibility = !sidebarVisible;
    setSidebarVisible(newVisibility);
    localStorage.setItem("sidebar-visible", newVisibility.toString());

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", {
        detail: { visible: newVisibility },
      })
    );
  };

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch family tree details
        const familyTreeResponse = await fetch(
          `/api/family-trees/${familyTreeId}`
        );
        if (!familyTreeResponse.ok) {
          throw new Error("Failed to fetch family tree");
        }
        const familyTreeData = await familyTreeResponse.json();
        setFamilyTree(familyTreeData);

        // Fetch family members for statistics
        const membersResponse = await fetch(
          `/api/family-members?familyTreeId=${familyTreeId}`
        );
        if (membersResponse.ok) {
          const members = await membersResponse.json();

          // Calculate statistics from real data
          const totalMembers = members.length;
          const livingMembers = members.filter(
            (member: any) =>
              !member.passingRecords || member.passingRecords.length === 0
          ).length;
          const totalGenerations = Math.max(
            ...members.map((member: any) =>
              member.generation ? parseInt(member.generation) : 1
            ),
            1
          );

          // Mock growth data (in real app, this would come from historical data)
          const statistics: FamilyStatistics = {
            totalGenerations,
            totalMembers,
            livingMembers,
            memberGrowth: { count: 0, percentage: 0 }, // Would need historical data
            deathTrend: { count: totalMembers - livingMembers, percentage: 0 },
            marriageTrend: { marriages: 0, divorces: 0 }, // Would need relationship data
            achievementGrowth: { count: 0, percentage: 0 }, // Would need achievement data
          };

          setStatistics(statistics);
        }

        // For now, keep empty activities array until we implement activity API
        setActivities([]);

        // Fetch change logs
        await fetchActivities();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setFamilyTree(null);
        setStatistics(null);
        setActivities([]);
        setChangeLogs([]);
      } finally {
        setLoading(false);
      }
    };

    if (familyTreeId) {
      fetchDashboardData();
    }
  }, [familyTreeId]);

  const calculateAge = (establishYear: number | null) => {
    if (!establishYear) return null;
    const currentYear = new Date().getFullYear();
    return currentYear - establishYear;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Fetch existing family members for the modal dropdown
  const fetchExistingMembers = async () => {
    try {
      const response = await fetch(`/api/family-trees/${familyTreeId}/members`);
      if (response.ok) {
        const members = await response.json();
        setExistingMembers(members);
      }
    } catch (error) {
      console.error("Error fetching existing members:", error);
    }
  };

  // Fetch all dashboard data
  const fetchFamilyTreeData = async () => {
    try {
      const familyTreeResponse = await fetch(
        `/api/family-trees/${familyTreeId}`
      );
      if (!familyTreeResponse.ok) {
        throw new Error("Failed to fetch family tree");
      }
      const familyTreeData = await familyTreeResponse.json();
      setFamilyTree(familyTreeData);
    } catch (error) {
      console.error("Error fetching family tree:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Fetch family members for statistics
      const membersResponse = await fetch(
        `/api/family-members?familyTreeId=${familyTreeId}`
      );
      if (membersResponse.ok) {
        const members = await membersResponse.json();

        // Calculate statistics from real data
        const totalMembers = members.length;
        const livingMembers = members.filter(
          (member: any) =>
            !member.passingRecords || member.passingRecords.length === 0
        ).length;
        const totalGenerations = Math.max(
          ...members.map((member: any) =>
            member.generation ? parseInt(member.generation) : 1
          ),
          1
        );

        // Mock growth data (in real app, this would come from historical data)
        const statistics: FamilyStatistics = {
          totalGenerations,
          totalMembers,
          livingMembers,
          memberGrowth: { count: 0, percentage: 0 }, // Would need historical data
          deathTrend: { count: totalMembers - livingMembers, percentage: 0 },
          marriageTrend: { marriages: 0, divorces: 0 }, // Would need relationship data
          achievementGrowth: { count: 0, percentage: 0 }, // Would need achievement data
        };

        setStatistics(statistics);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(
        `/api/change-logs?familyTreeId=${familyTreeId}`
      );
      if (response.ok) {
        const logs = await response.json();
        setChangeLogs(logs);
      } else {
        setChangeLogs([]);
      }
    } catch (error) {
      console.error("Error fetching change logs:", error);
      setChangeLogs([]);
    }
  };

  const handleAddMember = async () => {
    await fetchExistingMembers();
    setIsAddMemberModalOpen(true);
  };

  const handleMemberAdded = async () => {
    // Refresh dashboard data after adding a member
    await fetchFamilyTreeData();
    await fetchStatistics();
    await fetchActivities();
    await fetchExistingMembers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family tree data...</p>
        </div>
      </div>
    );
  }

  if (!familyTree) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Family Tree Not Found
          </h2>
          <p className="text-red-600 mb-4">
            The family tree you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Helper functions
  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return "+";
      case "UPDATE":
        return "✎";
      case "DELETE":
        return "×";
      default:
        return "?";
    }
  };

  const formatChangeLogMessage = (log: ChangeLog) => {
    const entityType = log.entityType;
    const action = log.action.toLowerCase();

    // Only show major events
    const majorEvents = [
      "FamilyMember",
      "PassingRecord",
      "Achievement",
      "SpouseRelationship",
    ];

    if (!majorEvents.includes(entityType)) {
      return null; // Don't display minor events
    }

    let message = "";

    switch (entityType) {
      case "FamilyMember":
        if (action === "create") {
          // Check if this is a birth (child with parent) or new root member
          let newValues = null;
          try {
            newValues = log.newValues ? JSON.parse(log.newValues) : null;
          } catch (e) {
            // Ignore parsing errors
          }
          if (newValues && newValues.parentId) {
            message = "Birth recorded";
          } else {
            message = "New family member added";
          }
        } else if (action === "update") {
          message = "Family member information updated";
        } else if (action === "delete") {
          message = "Family member removed";
        }
        break;
      case "PassingRecord":
        message = "Passing record added";
        break;
      case "Achievement":
        message = "Achievement recorded";
        break;
      case "SpouseRelationship":
        if (action === "create") {
          message = "Marriage recorded";
        } else if (action === "delete") {
          message = "Divorce recorded";
        }
        break;
      default:
        message = `${entityType} ${action}d`;
    }

    return message;
  };

  const formatChangeLogTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  const handleChangeLogClick = (log: ChangeLog) => {
    setSelectedChangeLog(log);
    setIsChangeLogDetailsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Bar */}
      <div className="bg-white rounded-lg py-3 px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            {familyTree.familyName}
          </h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Family Information Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Overview Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Family Information Overview
            </h2>
            <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <Pencil className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Family Details */}
          <div className="space-y-3 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Family Name
              </label>
              <p className="text-lg font-medium text-gray-900">
                {familyTree.familyName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Origin
              </label>
              <p className="text-lg font-medium text-gray-900">
                {familyTree.origin || "Not specified"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Established
              </label>
              <p className="text-lg font-medium text-gray-900">
                {familyTree.establishYear}{" "}
                {calculateAge(familyTree.establishYear) &&
                  `(${calculateAge(familyTree.establishYear)} years)`}
              </p>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-900">
                {statistics?.totalGenerations}
              </div>
              <div className="text-xs text-gray-600">Generations</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-900">
                {statistics?.totalMembers}
              </div>
              <div className="text-xs text-gray-600">All Members</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-900">
                {statistics?.livingMembers}
              </div>
              <div className="text-xs text-gray-600">Living</div>
            </div>
          </div>
        </div>

        {/* Insight Cards - 2x2 Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Growth */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Member Growth
                </p>
                <p className="text-xl font-bold text-gray-900">
                  +{statistics?.memberGrowth.count}
                </p>
                <p className="text-sm text-green-600">
                  +{statistics?.memberGrowth.percentage}%
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Death Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Death Trend</p>
                <p className="text-xl font-bold text-gray-900">
                  +{statistics?.deathTrend.count}
                </p>
                <p className="text-sm text-red-600">
                  +{statistics?.deathTrend.percentage}%
                </p>
              </div>
              <div className="bg-red-100 p-2 rounded-full">
                <Skull className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          {/* Marriage Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Marriage Trend
                </p>
                <p className="text-lg font-bold text-gray-900">
                  +{statistics?.marriageTrend.marriages}
                </p>
                <p className="text-sm text-blue-600">
                  -{statistics?.marriageTrend.divorces} divorced
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Heart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Achievement Growth */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Achievement Growth
                </p>
                <p className="text-xl font-bold text-gray-900">
                  +{statistics?.achievementGrowth.count}
                </p>
                <p className="text-sm text-yellow-600">
                  +{statistics?.achievementGrowth.percentage}%
                </p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              setIsAddMemberModalOpen(true);
              fetchExistingMembers();
            }}
            className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
          >
            <UserPlus className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">
              Add Member
            </span>
          </button>
          <button
            onClick={() => {
              setIsRecordAchievementModalOpen(true);
              fetchExistingMembers();
            }}
            className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200"
          >
            <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">
              Record Achievement
            </span>
          </button>
          <button
            onClick={() =>
              router.push(`/dashboard/family-trees/${familyTreeId}/events/new`)
            }
            className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
          >
            <Calendar className="w-8 h-8 text-red-600 mb-2" />
            <span className="text-sm font-medium text-red-700">
              Record Passing
            </span>
          </button>
          <button
            onClick={() =>
              router.push(`/dashboard/family-trees/${familyTreeId}/tree`)
            }
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            <TreePine className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">
              View Family Tree
            </span>
          </button>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Events
        </h2>
        <div className="space-y-4">
          {changeLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No major changes recorded yet.</p>
              <p className="text-sm">
                Major events like adding members, marriages, and achievements
                will appear here.
              </p>
            </div>
          ) : (
            changeLogs
              .map((log) => {
                const message = formatChangeLogMessage(log);
                return message ? (
                  <div
                    key={log.id}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleChangeLogClick(log)}
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-700">
                        {getActionIcon(log.action)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatChangeLogTimestamp(log.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                ) : null;
              })
              .filter(Boolean) // Remove null entries
          )}
        </div>
        {changeLogs.length > 0 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
              Load More Events
            </button>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          familyTreeId={familyTreeId}
          existingMembers={existingMembers}
          onMemberAdded={() => {
            // Refresh data after adding member
            fetchFamilyTreeData();
            fetchStatistics();
            fetchActivities();
            fetchExistingMembers();
          }}
        />
      )}

      {/* Record Achievement Modal */}
      {isRecordAchievementModalOpen && (
        <RecordAchievementModal
          isOpen={isRecordAchievementModalOpen}
          onClose={() => setIsRecordAchievementModalOpen(false)}
          familyTreeId={familyTreeId}
          existingMembers={existingMembers}
          onAchievementRecorded={() => {
            // Refresh data after recording achievement
            fetchFamilyTreeData();
            fetchStatistics();
            fetchActivities();
            fetchExistingMembers();
          }}
        />
      )}

      {/* Change Log Details Modal */}
      {isChangeLogDetailsModalOpen && (
        <ChangeLogDetailsModal
          isOpen={isChangeLogDetailsModalOpen}
          onClose={() => setIsChangeLogDetailsModalOpen(false)}
          changeLog={selectedChangeLog}
        />
      )}
    </div>
  );
}
