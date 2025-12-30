"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Pencil, Eye } from "lucide-react";
import Image from "next/image";

interface MemberPanelProps {
  memberId: number;
  familyTreeId: string;
  mode: "view" | "edit";
  onModeChange: (mode: "view" | "edit") => void;
  onClose: () => void;
  onSuccess: () => void;
}

interface FamilyMember {
  id: number;
  fullName: string;
  gender: string;
  birthday: string;
  generation: string;
  hasProfilePicture?: boolean;
  parent?: {
    id: number;
    fullName: string;
  };
  spouses?: Array<{
    id: number;
    fullName: string;
  }>;
  children?: Array<{
    id: number;
    fullName: string;
  }>;
}

export default function MemberPanel({
  memberId,
  familyTreeId,
  mode,
  onModeChange,
  onClose,
  onSuccess,
}: MemberPanelProps) {
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<FamilyMember>>({});

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/family-members/${memberId}`);
        if (res.ok) {
          const data = await res.json();
          setMember(data);
          setFormData(data);
        }
      } catch (error) {
        console.error("Error fetching member:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/family-members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          gender: formData.gender,
          birthday: formData.birthday,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error saving member:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Member not found
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-inter font-medium">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onModeChange("view")}
            className={`p-2 rounded-lg transition-colors ${
              mode === "view"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onModeChange("edit")}
            className={`p-2 rounded-lg transition-colors ${
              mode === "edit"
                ? "bg-green-100 text-green-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              <Image
                src={
                  member.hasProfilePicture
                    ? `/api/family-members/${member.id}/profile-picture`
                    : "/images/forrest-avatar.svg"
                }
                alt={member.fullName}
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-inter font-semibold text-[14px] text-black mb-2">
              Full Name
            </label>
            {mode === "view" ? (
              <div className="h-[43px] px-4 rounded-[10px] bg-gray-100 flex items-center font-inter text-[14px] text-black">
                {formData.fullName}
              </div>
            ) : (
              <input
                type="text"
                value={formData.fullName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full h-[43px] px-4 rounded-[10px] border border-gray-300 font-inter text-[14px] focus:ring-2 focus:ring-green-500 outline-none"
              />
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block font-inter font-semibold text-[14px] text-black mb-2">
              Gender
            </label>
            {mode === "view" ? (
              <div className="h-[43px] px-4 rounded-[10px] bg-gray-100 flex items-center font-inter text-[14px] text-black">
                {formData.gender}
              </div>
            ) : (
              <select
                value={formData.gender || ""}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full h-[43px] px-4 rounded-[10px] border border-gray-300 font-inter text-[14px] focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            )}
          </div>

          {/* Birthday */}
          <div>
            <label className="block font-inter font-semibold text-[14px] text-black mb-2">
              Birth Date
            </label>
            {mode === "view" ? (
              <div className="h-[43px] px-4 rounded-[10px] bg-gray-100 flex items-center font-inter text-[14px] text-black">
                {formData.birthday
                  ? new Date(formData.birthday).toLocaleDateString()
                  : "-"}
              </div>
            ) : (
              <input
                type="date"
                value={
                  formData.birthday
                    ? formData.birthday.split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    birthday: new Date(e.target.value).toISOString(),
                  })
                }
                className="w-full h-[43px] px-4 rounded-[10px] border border-gray-300 font-inter text-[14px] focus:ring-2 focus:ring-green-500 outline-none"
              />
            )}
          </div>

          {/* Generation */}
          <div>
            <label className="block font-inter font-semibold text-[14px] text-black mb-2">
              Generation
            </label>
            <div className="h-[43px] px-4 rounded-[10px] bg-gray-100 flex items-center font-inter text-[14px] text-black">
              F{formData.generation}
            </div>
          </div>

          {/* Parent */}
          {member.parent && (
            <div>
              <label className="block font-inter font-semibold text-[14px] text-black mb-2">
                Parent
              </label>
              <div className="h-[43px] px-4 rounded-[10px] bg-gray-100 flex items-center font-inter text-[14px] text-black">
                {member.parent.fullName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {mode === "edit" && (
        <div className="h-[60px] flex items-center justify-end gap-3 px-6 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="h-[43px] px-6 rounded-[10px] border border-gray-300 font-inter font-medium text-[14px] text-black hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-[43px] px-6 rounded-[10px] bg-green-600 font-inter font-medium text-[14px] text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
