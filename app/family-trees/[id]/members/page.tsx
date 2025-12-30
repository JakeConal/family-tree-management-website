"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import Image from "next/image";
import classNames from "classnames";
import AddMemberModal from "@/components/modals/AddMemberModal";
import MemberPanel from "@/components/MemberPanel";

interface FamilyMember {
  id: number;
  fullName: string;
  gender: string;
  birthday: string;
  generation: string;
  hasProfilePicture?: boolean;
  parent?: {
    fullName: string;
  };
}

interface FamilyTree {
  id: number;
  familyName: string;
}

const MemberAvatar = ({ memberId, fullName, hasProfilePicture }: { memberId: number, fullName: string, hasProfilePicture?: boolean }) => {
  const [error, setError] = useState(false);
  
  // Use the profile picture API only if we know it exists and haven't encountered an error
  const src = (!error && hasProfilePicture) 
    ? `/api/family-members/${memberId}/profile-picture` 
    : "/images/forrest-avatar.svg";

  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
      <Image 
        src={src}
        alt={fullName}
        width={40}
        height={40}
        className="object-cover w-full h-full"
        onError={() => setError(true)}
      />
    </div>
  );
};

// Header Component
const MemberListHeader = ({ 
  familyName, 
  onToggleSidebar 
}: { 
  familyName?: string, 
  onToggleSidebar: () => void 
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-2xl font-semibold font-inter text-black">
          {familyName || "Family Tree"}
        </h1>
      </div>
    </div>
  );
};

// Controls Component
interface MemberControlsProps {
  selectedGeneration: string;
  searchQuery: string;
  generations: string[];
  onGenerationChange: (gen: string) => void;
  onSearchChange: (query: string) => void;
  onAddMember: () => void;
}

const MemberControls = ({
  selectedGeneration,
  searchQuery,
  generations,
  onGenerationChange,
  onSearchChange,
  onAddMember
}: MemberControlsProps) => {
  return (
    <div className="flex items-center justify-between mb-6 bg-[#f4f4f5] p-4 rounded-xl">
      <div className="flex items-center gap-4">
        {/* Generation Filter */}
        <div className="relative">
          <select
            value={selectedGeneration}
            onChange={(e) => onGenerationChange(e.target.value)}
            className="appearance-none bg-white h-[43px] px-6 pr-10 rounded-[20px] text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 cursor-pointer outline-none"
          >
            {generations.map((gen) => (
              <option key={gen} value={gen}>{gen}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L6 6L11 1" stroke="black" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by name"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-white h-[43px] pl-12 pr-6 rounded-[20px] w-[300px] text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      <button
        onClick={onAddMember}
        className="bg-white h-[43px] px-6 rounded-[20px] flex items-center gap-2 text-[16px] font-inter text-black hover:bg-gray-50 transition-colors shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Add Member
      </button>
    </div>
  );
};

// Table Component
interface MemberTableProps {
  members: FamilyMember[];
  onViewMember: (id: number) => void;
  onEditMember: (id: number) => void;
  onDeleteMember: (id: number) => void;
}

const MemberTable = ({
  members,
  onViewMember,
  onEditMember,
  onDeleteMember
}: MemberTableProps) => {
  return (
    <div className="flex-1 overflow-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-gray-100">
            <th className="px-6 py-4 font-inter font-semibold text-[16px] text-black text-center w-20">No.</th>
            <th className="px-6 py-4 font-inter font-semibold text-[16px] text-black">Full Name</th>
            <th className="px-6 py-4 font-inter font-semibold text-[16px] text-black text-center">Birth Date</th>
            <th className="px-6 py-4 font-inter font-semibold text-[16px] text-black text-center">Gen. No.</th>
            <th className="px-6 py-4 font-inter font-semibold text-[16px] text-black">Parent</th>
            <th className="px-6 py-4 font-inter font-semibold text-[16px] text-black text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr 
              key={member.id}
              className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'} hover:bg-gray-50 transition-colors`}
            >
              <td className="px-6 py-4 font-playfair text-[16px] text-black text-center">{index + 1}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <MemberAvatar 
                    memberId={member.id} 
                    fullName={member.fullName} 
                    hasProfilePicture={member.hasProfilePicture} 
                  />
                  <span className="font-playfair text-[16px] text-black">{member.fullName}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-playfair text-[16px] text-black text-center">
                {member.birthday ? new Date(member.birthday).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : "-"}
              </td>
              <td className="px-6 py-4 font-playfair text-[16px] text-black text-center">F{member.generation}</td>
              <td className="px-6 py-4 font-playfair text-[16px] text-black">
                {member.parent?.fullName || "-"}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-3">
                  <button 
                    onClick={() => onViewMember(member.id)}
                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onEditMember(member.id)}
                    className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                    title="Edit Member"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDeleteMember(member.id)}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    title="Delete Member"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length === 0 && (
        <div className="py-20 text-center text-gray-500 font-inter">
          No members found matching your criteria.
        </div>
      )}
    </div>
  );
};

export default function MemberListPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const familyTreeId = params.id as string;

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("All Generation");
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberPanelMode, setMemberPanelMode] = useState<"view" | "edit">("view");
  const [sidebarVisible, setSidebarVisible] = useState(true);

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
    window.dispatchEvent(
      new CustomEvent("sidebar-toggle", {
        detail: { visible: newVisibility },
      })
    );
  };

  useEffect(() => {
    if (session && familyTreeId) {
      fetchData();
    }
  }, [session, familyTreeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, treeRes] = await Promise.all([
        fetch(`/api/family-trees/${familyTreeId}/members`),
        fetch(`/api/family-trees/${familyTreeId}`)
      ]);

      if (membersRes.ok && treeRes.ok) {
        const membersData = await membersRes.json();
        const treeData = await treeRes.json();
        setMembers(membersData);
        setFamilyTree(treeData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = member.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGen = selectedGeneration === "All Generation" || `Gen. ${member.generation}` === selectedGeneration || `F${member.generation}` === selectedGeneration;
      return matchesSearch && matchesGen;
    });
  }, [members, searchQuery, selectedGeneration]);

  const generations = useMemo(() => {
    const gens = Array.from(new Set(members.map((m) => m.generation))).sort();
    return ["All Generation", ...gens.map((g) => `F${g}`)];
  }, [members]);

  const handleDeleteMember = async (id: number) => {
    if (confirm("Are you sure you want to delete this member?")) {
      try {
        const res = await fetch(`/api/family-members/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setMembers(members.filter((m) => m.id !== id));
        } else {
          alert("Failed to delete member");
        }
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  const handleViewMember = async (id: number) => {
    setSelectedMemberId(id);
    setMemberPanelMode("view");
  };

  const handleEditMember = async (id: number) => {
    setSelectedMemberId(id);
    setMemberPanelMode("edit");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls Component */}
        <MemberControls
          selectedGeneration={selectedGeneration}
          searchQuery={searchQuery}
          generations={generations}
          onGenerationChange={setSelectedGeneration}
          onSearchChange={setSearchQuery}
          onAddMember={() => setIsAddMemberModalOpen(true)}
        />

        {/* Table Component */}
        <MemberTable
          members={filteredMembers}
          onViewMember={handleViewMember}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
        />

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50" disabled>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-full text-sm font-medium">1</span>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50" disabled>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Member Panel Sidebar - Desktop (Push) */}
      <aside
        className={classNames(
          "hidden md:block transition-all duration-300 ease-in-out border-l border-gray-100 bg-white overflow-hidden shrink-0 h-full",
          {
            "w-[600px]": selectedMemberId !== null,
            "w-0": selectedMemberId === null,
          }
        )}
      >
        {selectedMemberId !== null && (
          <MemberPanel
            memberId={selectedMemberId}
            familyTreeId={familyTreeId}
            mode={memberPanelMode}
            onModeChange={setMemberPanelMode}
            onClose={() => setSelectedMemberId(null)}
            onSuccess={fetchData}
          />
        )}
      </aside>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        familyTreeId={parseInt(familyTreeId)}
        onSuccess={fetchData}
      />
    </div>
  );
}
