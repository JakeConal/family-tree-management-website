"use client";

import { useState, useEffect } from "react";
import {
  X,
  Skull,
  ArrowLeft,
  Calendar,
  Check,
  Plus,
  AlertTriangle,
  Trash2,
} from "lucide-react";

interface FamilyMember {
  id: number;
  fullName: string;
  gender: string;
  birthday: string;
}

interface BurialPlace {
  location: string;
  startDate: string;
}

interface RecordPassingModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyTreeId: string;
  existingMembers: FamilyMember[];
  onPassingRecorded: () => void;
}

export default function RecordPassingModal({
  isOpen,
  onClose,
  familyTreeId,
  existingMembers,
  onPassingRecorded,
}: RecordPassingModalProps) {
  const [passingFormData, setPassingFormData] = useState({
    familyMemberId: "",
    dateOfPassing: "",
    causesOfDeath: [] as string[],
    burialPlaces: [] as BurialPlace[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassingFormData({
        familyMemberId: "",
        dateOfPassing: "",
        causesOfDeath: [""], // Start with one empty cause of death
        burialPlaces: [{ location: "", startDate: "" }], // Start with one empty burial place
      });
      setIsSubmitting(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !passingFormData.familyMemberId ||
      !passingFormData.dateOfPassing ||
      passingFormData.causesOfDeath.length === 0 ||
      passingFormData.burialPlaces.length === 0
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/family-trees/${familyTreeId}/passing-records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            familyMemberId: parseInt(passingFormData.familyMemberId),
            dateOfPassing: passingFormData.dateOfPassing,
            causesOfDeath: passingFormData.causesOfDeath,
            burialPlaces: passingFormData.burialPlaces,
          }),
        }
      );

      if (response.ok) {
        onPassingRecorded();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to record passing");
      }
    } catch (error) {
      console.error("Error recording passing:", error);
      alert("Failed to record passing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCauseOfDeath = () => {
    setPassingFormData({
      ...passingFormData,
      causesOfDeath: [...passingFormData.causesOfDeath, ""],
    });
  };

  const updateCauseOfDeath = (index: number, value: string) => {
    const updatedCauses = [...passingFormData.causesOfDeath];
    updatedCauses[index] = value;
    setPassingFormData({
      ...passingFormData,
      causesOfDeath: updatedCauses,
    });
  };

  const removeCauseOfDeath = (index: number) => {
    // Don't allow removing the last cause of death
    if (passingFormData.causesOfDeath.length <= 1) return;

    const updatedCauses = passingFormData.causesOfDeath.filter(
      (_, i) => i !== index
    );
    setPassingFormData({
      ...passingFormData,
      causesOfDeath: updatedCauses,
    });
  };

  const addBurialPlace = () => {
    setPassingFormData({
      ...passingFormData,
      burialPlaces: [
        ...passingFormData.burialPlaces,
        { location: "", startDate: "" },
      ],
    });
  };

  const updateBurialPlace = (
    index: number,
    field: keyof BurialPlace,
    value: string
  ) => {
    const updatedPlaces = [...passingFormData.burialPlaces];
    updatedPlaces[index] = { ...updatedPlaces[index], [field]: value };
    setPassingFormData({
      ...passingFormData,
      burialPlaces: updatedPlaces,
    });
  };

  const removeBurialPlace = (index: number) => {
    // Don't allow removing the last burial place
    if (passingFormData.burialPlaces.length <= 1) return;

    const updatedPlaces = passingFormData.burialPlaces.filter(
      (_, i) => i !== index
    );
    setPassingFormData({
      ...passingFormData,
      burialPlaces: updatedPlaces,
    });
  };

  const isFormValid = () => {
    return (
      passingFormData.familyMemberId &&
      passingFormData.dateOfPassing &&
      passingFormData.causesOfDeath.length > 0 &&
      passingFormData.causesOfDeath.every((cause) => cause.trim() !== "") &&
      passingFormData.burialPlaces.length > 0 &&
      passingFormData.burialPlaces.every(
        (place) => place.location.trim() !== "" && place.startDate !== ""
      )
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
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <Skull className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Record Passing
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
                value={passingFormData.familyMemberId}
                onChange={(e) =>
                  setPassingFormData({
                    ...passingFormData,
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

            {/* Date of Passing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Passing*
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={passingFormData.dateOfPassing}
                  onChange={(e) =>
                    setPassingFormData({
                      ...passingFormData,
                      dateOfPassing: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MM/DD/YYYY"
                  required
                />
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Cause of Passing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Cause of Passing*
                </label>
                <button
                  type="button"
                  onClick={addCauseOfDeath}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Cause
                </button>
              </div>
              {passingFormData.causesOfDeath.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    No causes added yet. Click "Add Cause" to add a cause of
                    passing.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {passingFormData.causesOfDeath.map((cause, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={cause}
                        onChange={(e) =>
                          updateCauseOfDeath(index, e.target.value)
                        }
                        placeholder="e.g. old age"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      {passingFormData.causesOfDeath.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCauseOfDeath(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Burial Places */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Burial Places*
                </label>
                <button
                  type="button"
                  onClick={addBurialPlace}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Place
                </button>
              </div>
              {passingFormData.burialPlaces.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>
                    No burial places added yet. Click "Add Place" to add a
                    burial location.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {passingFormData.burialPlaces.map((place, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">
                          Burial Place {index + 1}
                        </h4>
                        {passingFormData.burialPlaces.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBurialPlace(index)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Location*
                        </label>
                        <input
                          type="text"
                          value={place.location}
                          onChange={(e) =>
                            updateBurialPlace(index, "location", e.target.value)
                          }
                          placeholder="Enter location"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start Date*
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={place.startDate}
                            onChange={(e) =>
                              updateBurialPlace(
                                index,
                                "startDate",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="MM/DD/YYYY"
                            required
                          />
                          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">
                    Important
                  </h3>
                  <p className="text-sm text-blue-700">
                    The Family Member selected for this record cannot be changed
                    once saved. Furthermore, this record is permanent and cannot
                    be deleted.
                  </p>
                </div>
              </div>
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
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save
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
