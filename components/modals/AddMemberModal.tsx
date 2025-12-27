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
} from "lucide-react";

interface PlaceOfOrigin {
  id: string;
  location: string;
  startDate: string;
  endDate: string;
}

interface Occupation {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface FamilyMember {
  id: number;
  fullName: string;
  gender: string;
  birthday: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyTreeId: string;
  existingMembers: FamilyMember[];
  onMemberAdded: () => void;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  familyTreeId,
  existingMembers,
  onMemberAdded,
}: AddMemberModalProps) {
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
    { id: "1", title: "", startDate: "", endDate: "" },
  ]);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setMemberFormData({
        fullName: "",
        gender: "",
        birthDate: "",
        address: "",
        relatedMemberId: "",
        relationship: "",
        relationshipDate: "",
      });
      setPlacesOfOrigin([
        { id: "1", location: "", startDate: "", endDate: "" },
      ]);
      setOccupations([{ id: "1", title: "", startDate: "", endDate: "" }]);
      setProfilePicture(null);
      setConfirmAccuracy(false);
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

    // Basic validation
    if (
      !memberFormData.fullName.trim() ||
      !memberFormData.gender ||
      !memberFormData.birthDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (!confirmAccuracy) {
      alert("Please confirm that all information is accurate");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/family-trees/${familyTreeId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: memberFormData.fullName,
            gender: memberFormData.gender,
            birthDate: memberFormData.birthDate,
            address: memberFormData.address,
            relatedMemberId: memberFormData.relatedMemberId || null,
            relationship: memberFormData.relationship || null,
            relationshipDate: memberFormData.relationshipDate || null,
            placesOfOrigin: placesOfOrigin.filter((p) => p.location.trim()),
            occupations: occupations.filter((o) => o.title.trim()),
            profilePicture,
          }),
        }
      );

      if (response.ok) {
        onMemberAdded();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add family member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add family member");
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
    if (occupations.length < 5) {
      setOccupations([
        ...occupations,
        {
          id: Date.now().toString(),
          title: "",
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
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            <User className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Family Member
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
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    value={memberFormData.fullName}
                    onChange={(e) =>
                      setMemberFormData({
                        ...memberFormData,
                        fullName: e.target.value,
                      })
                    }
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender*
                  </label>
                  <select
                    value={memberFormData.gender}
                    onChange={(e) =>
                      setMemberFormData({
                        ...memberFormData,
                        gender: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date*
                  </label>
                  <input
                    type="date"
                    value={memberFormData.birthDate}
                    onChange={(e) =>
                      setMemberFormData({
                        ...memberFormData,
                        birthDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address*
                  </label>
                  <input
                    type="text"
                    value={memberFormData.address}
                    onChange={(e) =>
                      setMemberFormData({
                        ...memberFormData,
                        address: e.target.value,
                      })
                    }
                    placeholder="Enter full address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Places of Origin */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Place of Origin
                  </label>
                  <button
                    type="button"
                    onClick={addPlaceOfOrigin}
                    disabled={placesOfOrigin.length >= 4}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Place
                  </button>
                </div>

                {placesOfOrigin.map((place, index) => (
                  <div
                    key={place.id}
                    className="mb-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Place {index + 1}
                      </span>
                      {placesOfOrigin.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePlaceOfOrigin(place.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <select
                          value={place.location}
                          onChange={(e) => {
                            const updated = placesOfOrigin.map((p) =>
                              p.id === place.id
                                ? { ...p, location: e.target.value }
                                : p
                            );
                            setPlacesOfOrigin(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select place of origin</option>
                          <option value="An Giang">An Giang</option>
                          <option value="Ba Ria – Vung Tau">
                            Ba Ria – Vung Tau
                          </option>
                          <option value="Bac Giang">Bac Giang</option>
                          <option value="Bac Ninh">Bac Ninh</option>
                          <option value="Binh Duong">Binh Duong</option>
                          <option value="Binh Dinh">Binh Dinh</option>
                          <option value="Binh Phuoc">Binh Phuoc</option>
                          <option value="Binh Thuan">Binh Thuan</option>
                          <option value="Ca Mau">Ca Mau</option>
                          <option value="Dak Lak">Dak Lak</option>
                          <option value="Dak Nong">Dak Nong</option>
                          <option value="Dong Nai">Dong Nai</option>
                          <option value="Dong Thap">Dong Thap</option>
                          <option value="Gia Lai">Gia Lai</option>
                          <option value="Ha Giang">Ha Giang</option>
                          <option value="Ha Nam">Ha Nam</option>
                          <option value="Ha Tinh">Ha Tinh</option>
                          <option value="Khanh Hoa">Khanh Hoa</option>
                          <option value="Kien Giang">Kien Giang</option>
                          <option value="Lam Dong">Lam Dong</option>
                          <option value="Lao Cai">Lao Cai</option>
                          <option value="Long An">Long An</option>
                          <option value="Nam Dinh">Nam Dinh</option>
                          <option value="Nghe An">Nghe An</option>
                          <option value="Ninh Binh">Ninh Binh</option>
                          <option value="Phu Tho">Phu Tho</option>
                          <option value="Quang Nam">Quang Nam</option>
                          <option value="Hanoi">Hanoi</option>
                          <option value="Ho Chi Minh City">
                            Ho Chi Minh City
                          </option>
                          <option value="Hai Phong">Hai Phong</option>
                          <option value="Da Nang">Da Nang</option>
                          <option value="Can Tho">Can Tho</option>
                          <option value="Hue">Hue</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="date"
                          value={place.startDate}
                          onChange={(e) => {
                            const updated = placesOfOrigin.map((p) =>
                              p.id === place.id
                                ? { ...p, startDate: e.target.value }
                                : p
                            );
                            setPlacesOfOrigin(updated);
                          }}
                          placeholder="Start date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <input
                          type="date"
                          value={place.endDate}
                          onChange={(e) => {
                            const updated = placesOfOrigin.map((p) =>
                              p.id === place.id
                                ? { ...p, endDate: e.target.value }
                                : p
                            );
                            setPlacesOfOrigin(updated);
                          }}
                          placeholder="End date (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <p className="text-xs text-gray-500 mt-2">
                  Maximum 4 places of origin per person
                </p>
              </div>

              {/* Occupations */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Occupation
                  </label>
                  <button
                    type="button"
                    onClick={addOccupation}
                    disabled={occupations.length >= 5}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Occupation
                  </button>
                </div>

                {occupations.map((occupation, index) => (
                  <div
                    key={occupation.id}
                    className="mb-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Occupation {index + 1}
                      </span>
                      {occupations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOccupation(occupation.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={occupation.title}
                          onChange={(e) => {
                            const updated = occupations.map((o) =>
                              o.id === occupation.id
                                ? { ...o, title: e.target.value }
                                : o
                            );
                            setOccupations(updated);
                          }}
                          placeholder="e.g. Software Engineer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <input
                          type="date"
                          value={occupation.startDate}
                          onChange={(e) => {
                            const updated = occupations.map((o) =>
                              o.id === occupation.id
                                ? { ...o, startDate: e.target.value }
                                : o
                            );
                            setOccupations(updated);
                          }}
                          placeholder="Start date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <input
                          type="date"
                          value={occupation.endDate}
                          onChange={(e) => {
                            const updated = occupations.map((o) =>
                              o.id === occupation.id
                                ? { ...o, endDate: e.target.value }
                                : o
                            );
                            setOccupations(updated);
                          }}
                          placeholder="End date (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <p className="text-xs text-gray-500 mt-2">
                  Maximum 5 occupations per person
                </p>
              </div>

              {/* Profile Picture */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profile Picture (optional)
                </label>

                {profilePicture ? (
                  <div className="flex items-center space-x-4">
                    <Image
                      src={profilePicture}
                      alt="Profile preview"
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setProfilePicture(null)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload profile picture
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="profile-picture"
                    />
                    <label
                      htmlFor="profile-picture"
                      className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
                    >
                      Choose file
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Family Connection Section */}
            <div>
              <div className="flex items-center mb-4">
                <Heart className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Family Connection
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Family Member*
                  </label>
                  <select
                    value={memberFormData.relatedMemberId}
                    onChange={(e) =>
                      setMemberFormData({
                        ...memberFormData,
                        relatedMemberId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select family member</option>
                    {existingMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship*
                  </label>
                  <select
                    value={memberFormData.relationship}
                    onChange={(e) =>
                      setMemberFormData({
                        ...memberFormData,
                        relationship: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="parent">Parent</option>
                    <option value="spouse">Spouse</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Established Date*
                  </label>
                  <input
                    type="date"
                    value={memberFormData.relationshipDate}
                    onChange={(e) =>
                      setMemberFormData({
                        ...memberFormData,
                        relationshipDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-3">
                Relationship of the new member to the selected person
              </p>
            </div>

            {/* Confirmation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Important Notice
                  </h4>
                  <p className="text-sm text-blue-800">
                    Once a family member is added, their record becomes
                    permanent and cannot be deleted from the system. Please
                    ensure all information is accurate before submitting.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="confirm-accuracy"
                checked={confirmAccuracy}
                onChange={(e) => setConfirmAccuracy(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="confirm-accuracy"
                className="ml-2 text-sm text-gray-700"
              >
                I confirm that all information provided is accurate and truthful
              </label>
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
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Member...
                  </>
                ) : (
                  "Add Member"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
