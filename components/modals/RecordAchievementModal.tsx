"use client";

import { useState, useEffect } from "react";
import { X, Trophy, ArrowLeft, Calendar, Check } from "lucide-react";

interface FamilyMember {
  id: number;
  fullName: string;
  gender: string;
  birthday: string;
}

interface AchievementType {
  id: number;
  typeName: string;
}

interface RecordAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyTreeId: string;
  existingMembers: FamilyMember[];
  onAchievementRecorded: () => void;
}

export default function RecordAchievementModal({
  isOpen,
  onClose,
  familyTreeId,
  existingMembers,
  onAchievementRecorded,
}: RecordAchievementModalProps) {
  const [achievementFormData, setAchievementFormData] = useState({
    familyMemberId: "",
    achievementTypeId: "",
    achieveDate: "",
    title: "",
    description: "",
  });

  const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAchievementFormData({
        familyMemberId: "",
        achievementTypeId: "",
        achieveDate: "",
        title: "",
        description: "",
      });
      setIsSubmitting(false);
      fetchAchievementTypes();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const fetchAchievementTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const response = await fetch(
        `/api/family-trees/${familyTreeId}/achievement-types`
      );
      if (response.ok) {
        const types = await response.json();
        setAchievementTypes(types);
      }
    } catch (error) {
      console.error("Error fetching achievement types:", error);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !achievementFormData.familyMemberId ||
      !achievementFormData.achievementTypeId ||
      !achievementFormData.achieveDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/family-trees/${familyTreeId}/achievements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            familyMemberId: parseInt(achievementFormData.familyMemberId),
            achievementTypeId: parseInt(achievementFormData.achievementTypeId),
            achieveDate: achievementFormData.achieveDate,
            title: achievementFormData.title.trim() || null,
            description: achievementFormData.description.trim() || null,
          }),
        }
      );

      if (response.ok) {
        onAchievementRecorded();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to record achievement");
      }
    } catch (error) {
      console.error("Error recording achievement:", error);
      alert("Failed to record achievement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      achievementFormData.familyMemberId &&
      achievementFormData.achievementTypeId &&
      achievementFormData.achieveDate
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Record Achievement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Family Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Family Member*
              </label>
              <select
                value={achievementFormData.familyMemberId}
                onChange={(e) =>
                  setAchievementFormData({
                    ...achievementFormData,
                    familyMemberId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select member</option>
                {existingMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Achievement Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Type*
              </label>
              <select
                value={achievementFormData.achievementTypeId}
                onChange={(e) =>
                  setAchievementFormData({
                    ...achievementFormData,
                    achievementTypeId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoadingTypes}
              >
                <option value="">
                  {isLoadingTypes ? "Loading types..." : "Select type"}
                </option>
                {achievementTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.typeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Achieved */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Achieved*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={achievementFormData.achieveDate}
                  onChange={(e) =>
                    setAchievementFormData({
                      ...achievementFormData,
                      achieveDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MM/DD/YYYY"
                  required
                />
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Achievement Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Title
              </label>
              <input
                type="text"
                value={achievementFormData.title}
                onChange={(e) =>
                  setAchievementFormData({
                    ...achievementFormData,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Bachelor of Computer Science"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={achievementFormData.description}
                onChange={(e) =>
                  setAchievementFormData({
                    ...achievementFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the achievement"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Record Achievement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
