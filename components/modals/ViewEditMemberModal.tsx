"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  Briefcase,
  Home,
  Camera,
  Plus,
  Info,
  Check,
  ArrowLeft,
  User,
  Heart,
  Edit,
  Eye,
  Save,
} from "lucide-react";

interface PlaceOfOrigin {
  id: string;
  location: string;
  startDate: string;
  endDate: string;
}

interface Occupation {
  id: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
}

interface FamilyMember {
  id: number;
  fullName: string;
  gender: string;
  birthday: string;
}

interface ExistingMember {
  id: number;
  fullName: string;
  gender: "MALE" | "FEMALE" | null;
  birthday: string | null;
  address: string | null;
  generation: string | null;
  isRootPerson: boolean | null;
  isAdopted: boolean | null;
  hasProfilePicture?: boolean;
  birthPlaces?: {
    startDate: string;
    endDate: string;
    placeOfOrigin: {
      location: string;
    };
  }[];
  occupations?: {
    id: number;
    jobTitle: string;
    startDate: string | null;
    endDate: string | null;
  }[];
  parent?: {
    id: number;
    fullName: string;
  } | null;
  spouse1?: Array<{
    divorceDate: Date | null;
    familyMember2: {
      id: number;
      fullName: string;
    };
  }>;
  spouse2?: Array<{
    divorceDate: Date | null;
    familyMember1: {
      id: number;
      fullName: string;
    };
  }>;
}

interface ViewEditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyTreeId: string;
  existingMembers: FamilyMember[];
  member: ExistingMember | null;
  onMemberUpdated: () => void;
  mode: "view" | "edit";
  onModeChange: (mode: "view" | "edit") => void;
}

export default function ViewEditMemberModal({
  isOpen,
  onClose,
  familyTreeId,
  existingMembers,
  member,
  onMemberUpdated,
  mode,
  onModeChange,
}: ViewEditMemberModalProps) {
  const [memberFormData, setMemberFormData] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    address: "",
    relatedMemberId: "",
    relationship: "",
    relationshipDate: "",
  });
  const [placesOfOrigin, setPlacesOfOrigin] = useState<PlaceOfOrigin[]>([
    { id: "1", location: "", startDate: "", endDate: "" },
  ]);
  const [occupations, setOccupations] = useState<Occupation[]>([
    { id: "1", jobTitle: "", startDate: "", endDate: "" },
  ]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    address: "",
    relatedMemberId: "",
    relationship: "",
    relationshipDate: "",
    placesOfOrigin: "",
    occupations: "",
  });
  const [generalError, setGeneralError] = useState("");

  // Load member data when modal opens or member changes
  useEffect(() => {
    if (isOpen && member) {
      // Load member data
      setMemberFormData({
        fullName: member.fullName || "",
        gender: member.gender || "",
        birthDate: member.birthday ? member.birthday.split("T")[0] : "",
        address: member.address || "",
        relatedMemberId: member.parent?.id.toString() || "",
        relationship: member.parent ? "parent" : "",
        relationshipDate: "",
      });

      // Load places of origin
      if (member.birthPlaces && member.birthPlaces.length > 0) {
        setPlacesOfOrigin(
          member.birthPlaces.map((place, index) => ({
            id: (index + 1).toString(),
            location: place.placeOfOrigin.location,
            startDate: place.startDate ? place.startDate.split("T")[0] : "",
            endDate: place.endDate ? place.endDate.split("T")[0] : "",
          }))
        );
      } else {
        setPlacesOfOrigin([
          { id: "1", location: "", startDate: "", endDate: "" },
        ]);
      }

      // Load occupations
      if (member.occupations && member.occupations.length > 0) {
        setOccupations(
          member.occupations.map((occ, index) => ({
            id: (index + 1).toString(),
            jobTitle: occ.jobTitle,
            startDate: occ.startDate ? occ.startDate.split("T")[0] : "",
            endDate: occ.endDate ? occ.endDate.split("T")[0] : "",
          }))
        );
      } else {
        setOccupations([{ id: "1", jobTitle: "", startDate: "", endDate: "" }]);
      }

      // Load profile picture
      if ((member as any).hasProfilePicture) {
        // Fetch profile picture from API
        fetch(`/api/family-members/${member.id}/profile-picture`)
          .then((response) => response.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              setProfilePicturePreview(e.target?.result as string);
            };
            reader.readAsDataURL(blob);
          })
          .catch(() => {
            setProfilePicturePreview(null);
          });
      } else {
        setProfilePicturePreview(null);
      }

      setProfilePicture(null);
      setConfirmAccuracy(false);
      setIsSubmitting(false);
      setValidationErrors({
        fullName: "",
        gender: "",
        birthDate: "",
        address: "",
        relatedMemberId: "",
        relationship: "",
        relationshipDate: "",
        placesOfOrigin: "",
        occupations: "",
      });
      setGeneralError("");
    }
  }, [isOpen, member]);

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

  // Validation function
  const validateForm = () => {
    const errors = {
      fullName: "",
      gender: "",
      birthDate: "",
      address: "",
      relatedMemberId: "",
      relationship: "",
      relationshipDate: "",
      placesOfOrigin: "",
      occupations: "",
    };

    if (!memberFormData.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    if (!memberFormData.gender) {
      errors.gender = "Gender is required";
    }
    if (!memberFormData.birthDate) {
      errors.birthDate = "Birth date is required";
    }
    if (!memberFormData.address.trim()) {
      errors.address = "Address is required";
    }
    if (!memberFormData.relatedMemberId) {
      errors.relatedMemberId = "Related member is required";
    }
    if (!memberFormData.relationship) {
      errors.relationship = "Relationship is required";
    }
    if (!memberFormData.relationshipDate) {
      errors.relationshipDate = "Relationship date is required";
    } else if (memberFormData.birthDate && memberFormData.relationship) {
      const birthDate = new Date(memberFormData.birthDate);
      const relationshipDate = new Date(memberFormData.relationshipDate);

      if (memberFormData.relationship === "parent") {
        // Parent relationship: relationship date must be >= birth date
        if (relationshipDate < birthDate) {
          errors.relationshipDate =
            "Relationship date must be on or after birth date";
        }
      } else if (memberFormData.relationship === "spouse") {
        // Spouse relationship: relationship date must be >= birth date + 7 years
        const minSpouseDate = new Date(birthDate);
        minSpouseDate.setFullYear(minSpouseDate.getFullYear() + 7);

        if (relationshipDate < minSpouseDate) {
          errors.relationshipDate =
            "Relationship date must be at least 7 years after birth date";
        }
      }
    }

    // Check if at least one place of origin is filled and has required start date
    const hasValidPlaceOfOrigin = placesOfOrigin.some(
      (place) => place.location.trim() !== ""
    );
    if (!hasValidPlaceOfOrigin) {
      errors.placesOfOrigin = "At least one place of origin is required";
    } else {
      // Check that places with location also have start date
      const invalidPlaces = placesOfOrigin.filter(
        (place) => place.location.trim() !== "" && !place.startDate
      );
      if (invalidPlaces.length > 0) {
        errors.placesOfOrigin = "Places of origin must have start dates";
      } else {
        // Check that start dates are after birth date
        const invalidBirthDatePlaces = placesOfOrigin.filter(
          (place) =>
            place.location.trim() !== "" &&
            place.startDate &&
            memberFormData.birthDate &&
            place.startDate < memberFormData.birthDate
        );
        if (invalidBirthDatePlaces.length > 0) {
          errors.placesOfOrigin =
            "Place of origin start dates must be after birth date";
        } else {
          // Check consecutive places date constraints
          for (let i = 1; i < placesOfOrigin.length; i++) {
            const currentPlace = placesOfOrigin[i];
            const previousPlace = placesOfOrigin[i - 1];

            if (currentPlace.location.trim() && currentPlace.startDate) {
              if (!previousPlace.endDate) {
                errors.placesOfOrigin =
                  "Previous place of origin must have an end date";
                break;
              } else if (currentPlace.startDate <= previousPlace.endDate) {
                errors.placesOfOrigin =
                  "Start date must be after the end date of the previous place";
                break;
              }
            }
          }
        }
      }
    }

    // Check occupations
    const hasValidOccupation = occupations.some(
      (occ) => occ.jobTitle.trim() !== ""
    );
    if (!hasValidOccupation) {
      errors.occupations = "At least one occupation is required";
    } else {
      // Check that occupations with title also have start date
      const invalidOccupations = occupations.filter(
        (occ) => occ.jobTitle.trim() !== "" && !occ.startDate
      );
      if (invalidOccupations.length > 0) {
        errors.occupations = "Occupations must have start dates";
      } else {
        // Check that start dates are after birth date
        const invalidBirthDateOccupations = occupations.filter(
          (occ) =>
            occ.jobTitle.trim() !== "" &&
            occ.startDate &&
            memberFormData.birthDate &&
            occ.startDate < memberFormData.birthDate
        );
        if (invalidBirthDateOccupations.length > 0) {
          errors.occupations =
            "Occupation start dates must be after birth date";
        } else {
          // Check consecutive occupations date constraints
          for (let i = 1; i < occupations.length; i++) {
            const currentOccupation = occupations[i];
            const previousOccupation = occupations[i - 1];

            if (
              currentOccupation.jobTitle.trim() &&
              currentOccupation.startDate
            ) {
              if (!previousOccupation.endDate) {
                errors.occupations =
                  "Previous occupation must have an end date";
                break;
              } else if (
                currentOccupation.startDate <= previousOccupation.endDate
              ) {
                errors.occupations =
                  "Start date must be after the end date of the previous occupation";
                break;
              }
            }
          }
        }
      }
    }

    setValidationErrors(errors);

    // Check if any errors
    return Object.values(errors).every((error) => error === "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous general error
    setGeneralError("");

    // Validate form
    if (!validateForm()) {
      setGeneralError("Please check your information");
      return;
    }

    if (!confirmAccuracy) {
      setGeneralError("Please check your information");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("fullName", memberFormData.fullName);
      formData.append("gender", memberFormData.gender);
      formData.append("birthday", memberFormData.birthDate);
      formData.append("address", memberFormData.address);
      formData.append("isAdopted", "false");
      formData.append("familyTreeId", familyTreeId);

      if (memberFormData.relatedMemberId) {
        if (memberFormData.relationship === "parent") {
          formData.append("parentId", memberFormData.relatedMemberId);
          if (memberFormData.relationshipDate) {
            formData.append(
              "relationshipEstablishedDate",
              memberFormData.relationshipDate
            );
          }
        } else if (memberFormData.relationship === "spouse") {
          formData.append("spouseId", memberFormData.relatedMemberId);
          if (memberFormData.relationshipDate) {
            formData.append("marriageDate", memberFormData.relationshipDate);
          }
        }
      }

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      // For editing, we need to use PUT/PATCH method to update existing member
      const response = await fetch(`/api/family-members/${member?.id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        onMemberUpdated();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update family member");
      }
    } catch (error) {
      console.error("Error updating member:", error);
      alert("Failed to update family member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPlaceOfOrigin = () => {
    if (placesOfOrigin.length < 4) {
      setPlacesOfOrigin([
        ...placesOfOrigin,
        {
          id: Date.now().toString(),
          location: "",
          startDate: "",
          endDate: "",
        },
      ]);
    }
  };

  const removePlaceOfOrigin = (id: string) => {
    setPlacesOfOrigin(placesOfOrigin.filter((p) => p.id !== id));
  };

  const addOccupation = () => {
    if (occupations.length < 15) {
      setOccupations([
        ...occupations,
        {
          id: Date.now().toString(),
          jobTitle: "",
          startDate: "",
          endDate: "",
        },
      ]);
    }
  };

  const removeOccupation = (id: string) => {
    setOccupations(occupations.filter((o) => o.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        );
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too large. Maximum size is 5MB.");
        return;
      }

      setProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen || !member) return null;

  const isViewMode = mode === "view";

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
            {isViewMode ? (
              <Eye className="w-6 h-6 text-blue-600 mr-3" />
            ) : (
              <Edit className="w-6 h-6 text-blue-600 mr-3" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {isViewMode ? "View Family Member" : "Edit Family Member"}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {isViewMode ? (
              <button
                onClick={() => onModeChange("edit")}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            ) : (
              <button
                onClick={() => onModeChange("view")}
                className="flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
              </div>

              {/* Full Name - Single Row */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={memberFormData.fullName}
                  onChange={(e) => {
                    setMemberFormData({
                      ...memberFormData,
                      fullName: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isViewMode}
                />
                {validationErrors.fullName && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              {/* Birth Date and Gender - Two Column Row */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={memberFormData.birthDate}
                    onChange={(e) => {
                      setMemberFormData({
                        ...memberFormData,
                        birthDate: e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isViewMode}
                  />
                  {validationErrors.birthDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.birthDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={memberFormData.gender}
                    onChange={(e) => {
                      setMemberFormData({
                        ...memberFormData,
                        gender: e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={isViewMode}
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                  {validationErrors.gender && (
                    <p className="text-red-500 text-xs mt-1">
                      {validationErrors.gender}
                    </p>
                  )}
                </div>
              </div>

              {/* Address - Single Row */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={memberFormData.address}
                  onChange={(e) => {
                    setMemberFormData({
                      ...memberFormData,
                      address: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current address"
                  required
                  disabled={isViewMode}
                />
                {validationErrors.address && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.address}
                  </p>
                )}
              </div>

              {/* Profile Picture Upload */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden">
                    {profilePicturePreview ? (
                      <Image
                        src={profilePicturePreview}
                        alt="Profile preview"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 text-xl font-bold">
                        {memberFormData.fullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {!isViewMode && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="profile-picture-upload"
                      />
                      <label
                        htmlFor="profile-picture-upload"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Upload Photo
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Max 5MB. JPEG, PNG, GIF, WebP only.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Places of Origin Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-green-600 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Place of Origin <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={addPlaceOfOrigin}
                      disabled={placesOfOrigin.length >= 15}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Place
                    </button>
                  )}
                </div>
                {validationErrors.placesOfOrigin && (
                  <p className="text-red-500 text-xs mt-1 mb-3">
                    {validationErrors.placesOfOrigin}
                  </p>
                )}

                {placesOfOrigin.map((place, index) => (
                  <div
                    key={place.id}
                    className="mb-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Place {index + 1}
                      </span>
                      {!isViewMode && placesOfOrigin.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlaceOfOrigin(place.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* City and Country - Two Column Row */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={place.location}
                          onChange={(e) => {
                            const updatedPlaces = [...placesOfOrigin];
                            updatedPlaces[index].location = e.target.value;
                            setPlacesOfOrigin(updatedPlaces);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter location"
                          disabled={isViewMode}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={place.startDate}
                          onChange={(e) => {
                            const updatedPlaces = [...placesOfOrigin];
                            updatedPlaces[index].startDate = e.target.value;
                            setPlacesOfOrigin(updatedPlaces);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isViewMode}
                        />
                      </div>
                    </div>

                    {/* End Date - Single Row */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={place.endDate}
                        onChange={(e) => {
                          const updatedPlaces = [...placesOfOrigin];
                          updatedPlaces[index].endDate = e.target.value;
                          setPlacesOfOrigin(updatedPlaces);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Occupations Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Briefcase className="w-5 h-5 text-purple-600 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Occupation <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {!isViewMode && (
                    <button
                      type="button"
                      onClick={addOccupation}
                      disabled={occupations.length >= 15}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Occupation
                    </button>
                  )}
                </div>
                {validationErrors.occupations && (
                  <p className="text-red-500 text-xs mt-1 mb-3">
                    {validationErrors.occupations}
                  </p>
                )}

                {occupations.map((occupation, index) => (
                  <div
                    key={occupation.id}
                    className="mb-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Occupation {index + 1}
                      </span>
                      {!isViewMode && occupations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOccupation(occupation.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Title and Start Date - Two Column Row */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={occupation.jobTitle}
                          onChange={(e) => {
                            const updatedOccupations = [...occupations];
                            updatedOccupations[index].jobTitle = e.target.value;
                            setOccupations(updatedOccupations);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter occupation title"
                          disabled={isViewMode}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={occupation.startDate}
                          onChange={(e) => {
                            const updatedOccupations = [...occupations];
                            updatedOccupations[index].startDate =
                              e.target.value;
                            setOccupations(updatedOccupations);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isViewMode}
                        />
                      </div>
                    </div>

                    {/* End Date - Single Row */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={occupation.endDate}
                        onChange={(e) => {
                          const updatedOccupations = [...occupations];
                          updatedOccupations[index].endDate = e.target.value;
                          setOccupations(updatedOccupations);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Error */}
            {generalError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Info className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800 text-sm">{generalError}</p>
                </div>
              </div>
            )}

            {/* Family Connection Section */}
            <div>
              <div className="flex items-center mb-4">
                <Heart className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Family Connection
                </h3>
              </div>

              {/* Related Member - Single Row */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Family Member <span className="text-red-500">*</span>
                </label>
                <select
                  value={memberFormData.relatedMemberId}
                  onChange={(e) => {
                    setMemberFormData({
                      ...memberFormData,
                      relatedMemberId: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isViewMode}
                >
                  <option value="">Select family member</option>
                  {existingMembers.map((existingMember) => (
                    <option key={existingMember.id} value={existingMember.id}>
                      {existingMember.fullName}
                    </option>
                  ))}
                </select>
                {validationErrors.relatedMemberId && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.relatedMemberId}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Choose the existing family member this person is related to
                </p>
              </div>

              {/* Relationship - Single Row */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  value={memberFormData.relationship}
                  onChange={(e) => {
                    setMemberFormData({
                      ...memberFormData,
                      relationship: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isViewMode}
                >
                  <option value="">Select relationship</option>
                  <option value="parent">Parent</option>
                  <option value="spouse">Spouse</option>
                </select>
                {validationErrors.relationship && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.relationship}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 mb-3">
                  Select how this person is related to the chosen family member
                </p>
              </div>

              {/* Relationship Established Date - Single Row */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Established Date{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={memberFormData.relationshipDate}
                  onChange={(e) => {
                    setMemberFormData({
                      ...memberFormData,
                      relationshipDate: e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isViewMode}
                />
                {validationErrors.relationshipDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {validationErrors.relationshipDate}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  When did this relationship begin or get established?
                </p>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            {!isViewMode && (
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="confirm-accuracy"
                  checked={confirmAccuracy}
                  onChange={(e) => setConfirmAccuracy(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <label
                    htmlFor="confirm-accuracy"
                    className="text-sm text-gray-700 font-medium"
                  >
                    I confirm that all information provided is accurate to the
                    best of my knowledge
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Please verify all dates and relationships before submitting.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {!isViewMode && (
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Updating..." : "Update Member"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
