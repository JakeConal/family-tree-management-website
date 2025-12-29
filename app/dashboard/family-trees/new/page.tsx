"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  X,
  Users,
  MapPin,
  Calendar,
  Briefcase,
  Home,
  Camera,
  Plus,
  Info,
  Check,
  ChevronDown,
} from "lucide-react";
import { triggerFamilyTreesRefresh } from "../../../../lib/useFamilyTrees";

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

export default function NewFamilyTreePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Family Information
  const [familyData, setFamilyData] = useState({
    familyName: "",
    origin: "",
    establishYear: "",
  });

  // Root Person Information
  const [rootPersonData, setRootPersonData] = useState({
    fullName: "",
    gender: "",
    birthDate: "",
    address: "",
  });

  // Dynamic sections
  const [placesOfOrigin, setPlacesOfOrigin] = useState<PlaceOfOrigin[]>([
    { id: "1", location: "", startDate: "", endDate: "" },
  ]);
  const [occupations, setOccupations] = useState<Occupation[]>([
    { id: "1", title: "", startDate: "", endDate: "" },
  ]);

  // Profile picture
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  // Validation functions
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case "familyName":
        if (!value.trim()) {
          newErrors.familyName = "Family name is required";
        } else {
          delete newErrors.familyName;
        }
        break;
      case "origin":
        if (!value) {
          newErrors.origin = "Family origin is required";
        } else {
          delete newErrors.origin;
        }
        break;
      case "establishYear":
        if (!value) {
          newErrors.establishYear = "Establish year is required";
        } else {
          const year = parseInt(value);
          if (year < 1000 || year > new Date().getFullYear()) {
            newErrors.establishYear = "Please enter a valid year";
          } else {
            delete newErrors.establishYear;
          }
        }
        break;
      case "fullName":
        if (!value.trim()) {
          newErrors.fullName = "Full name is required";
        } else {
          delete newErrors.fullName;
        }
        break;
      case "gender":
        if (!value) {
          newErrors.gender = "Gender is required";
        } else {
          delete newErrors.gender;
        }
        break;
      case "birthDate":
        if (!value) {
          newErrors.birthDate = "Birth date is required";
        } else {
          delete newErrors.birthDate;
        }
        break;
      case "address":
        if (!value.trim()) {
          newErrors.address = "Address is required";
        } else {
          delete newErrors.address;
        }
        break;
    }

    setErrors(newErrors);
  };

  const validatePlacesOfOrigin = () => {
    const newErrors = { ...errors };
    const hasValidPlace = placesOfOrigin.some((p) => p.location && p.startDate);

    if (!hasValidPlace) {
      newErrors.placesOfOrigin =
        "At least one place of origin with location and start date is required";
    } else {
      delete newErrors.placesOfOrigin;
    }

    setErrors(newErrors);
    return hasValidPlace;
  };

  const validateOccupations = () => {
    const newErrors = { ...errors };
    const hasValidOccupation = occupations.some((o) => o.title.trim());

    if (!hasValidOccupation) {
      newErrors.occupations = "At least one occupation is required";
    } else {
      delete newErrors.occupations;
    }

    setErrors(newErrors);
    return hasValidOccupation;
  };

  const handleFieldChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/welcome/login");
    }
  }, [status, router]);

  // Handle escape key and backdrop click
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
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
  }, [isOpen]);

  const handleClose = (familyTreeId?: number) => {
    setIsOpen(false);
    setTimeout(() => {
      if (familyTreeId) {
        router.push(`/dashboard/family-trees/${familyTreeId}`);
      } else {
        router.push("/dashboard");
      }
    }, 200); // Allow animation to complete
  };

  const handleBackdropClick = () => {
    handleClose();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    setPlacesOfOrigin(placesOfOrigin.filter((place) => place.id !== id));
  };

  const updatePlaceOfOrigin = (
    id: string,
    field: keyof PlaceOfOrigin,
    value: string
  ) => {
    setPlacesOfOrigin(
      placesOfOrigin.map((place) =>
        place.id === id ? { ...place, [field]: value } : place
      )
    );
    // Clear places of origin error when user makes changes
    if (errors.placesOfOrigin) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.placesOfOrigin;
        return newErrors;
      });
    }
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
    setOccupations(occupations.filter((occ) => occ.id !== id));
  };

  const updateOccupation = (
    id: string,
    field: keyof Occupation,
    value: string
  ) => {
    setOccupations(
      occupations.map((occ) =>
        occ.id === id ? { ...occ, [field]: value } : occ
      )
    );
    // Clear occupations error when user makes changes
    if (errors.occupations) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.occupations;
        return newErrors;
      });
    }
  };

  const handleProfilePictureUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show validation errors
    const allFields = [
      "familyName",
      "origin",
      "establishYear",
      "fullName",
      "gender",
      "birthDate",
      "address",
    ];
    const newTouched = allFields.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {}
    );
    setTouched(newTouched);

    // Validate all fields
    allFields.forEach((field) => {
      const value = field.includes("family")
        ? familyData[field as keyof typeof familyData]
        : rootPersonData[field as keyof typeof rootPersonData];
      validateField(field, value as string);
    });

    const placesValid = validatePlacesOfOrigin();
    const occupationsValid = validateOccupations();

    // Check if all validations pass
    const hasErrors =
      Object.keys(errors).length > 0 || !placesValid || !occupationsValid;

    if (hasErrors) {
      // Scroll to first error
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!confirmAccuracy) {
      alert("Please confirm that all information is accurate");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/family-trees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyName: familyData.familyName,
          origin: familyData.origin,
          establishYear: familyData.establishYear
            ? parseInt(familyData.establishYear)
            : null,
          rootPerson: {
            fullName: rootPersonData.fullName,
            gender: rootPersonData.gender,
            birthDate: rootPersonData.birthDate,
            address: rootPersonData.address,
            placesOfOrigin: placesOfOrigin.filter((p) => p.location.trim()),
            occupations: occupations.filter((o) => o.title.trim()),
            profilePicture,
          },
        }),
      });

      if (response.ok) {
        const createdFamilyTree = await response.json();
        // Trigger sidebar refresh to show the new family tree
        triggerFamilyTreesRefresh();
        handleClose(createdFamilyTree.id);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create family tree");
      }
    } catch (error) {
      console.error("Error creating family tree:", error);
      alert("An error occurred while creating the family tree");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">
              Create New Family Tree
            </h1>
            <button
              onClick={handleBackdropClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section 1: Family Information */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Family Information
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Family Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={familyData.familyName}
                      onChange={(e) => {
                        setFamilyData({
                          ...familyData,
                          familyName: e.target.value,
                        });
                        handleFieldChange("familyName", e.target.value);
                      }}
                      onBlur={() =>
                        validateField("familyName", familyData.familyName)
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.familyName && touched.familyName
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g. The Hunter Family"
                      data-error={
                        errors.familyName && touched.familyName
                          ? "true"
                          : "false"
                      }
                    />
                    {errors.familyName && touched.familyName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.familyName}
                      </p>
                    )}
                  </div>

                  {/* Origin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Origin <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={familyData.origin}
                        onChange={(e) => {
                          setFamilyData({
                            ...familyData,
                            origin: e.target.value,
                          });
                          handleFieldChange("origin", e.target.value);
                        }}
                        onBlur={() =>
                          validateField("origin", familyData.origin)
                        }
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                          errors.origin && touched.origin
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                        data-error={
                          errors.origin && touched.origin ? "true" : "false"
                        }
                      >
                        <option value="">Select family origin</option>
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
                      <ChevronDown className="absolute right-3 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.origin && touched.origin && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.origin}
                      </p>
                    )}
                  </div>

                  {/* Establish Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Establish Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={familyData.establishYear}
                      onChange={(e) => {
                        setFamilyData({
                          ...familyData,
                          establishYear: e.target.value,
                        });
                        handleFieldChange("establishYear", e.target.value);
                      }}
                      onBlur={() =>
                        validateField("establishYear", familyData.establishYear)
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.establishYear && touched.establishYear
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="e.g. 1945"
                      min="1000"
                      max={new Date().getFullYear()}
                      data-error={
                        errors.establishYear && touched.establishYear
                          ? "true"
                          : "false"
                      }
                    />
                    {errors.establishYear && touched.establishYear && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.establishYear}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Family Header (Root Person) */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Family Header (Root Person)
                </h2>

                {/* Personal Information */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-medium text-gray-700">
                      Personal Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={rootPersonData.fullName}
                        onChange={(e) => {
                          setRootPersonData({
                            ...rootPersonData,
                            fullName: e.target.value,
                          });
                          handleFieldChange("fullName", e.target.value);
                        }}
                        onBlur={() =>
                          validateField("fullName", rootPersonData.fullName)
                        }
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.fullName && touched.fullName
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                        data-error={
                          errors.fullName && touched.fullName ? "true" : "false"
                        }
                      />
                      {errors.fullName && touched.fullName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={rootPersonData.gender}
                          onChange={(e) => {
                            setRootPersonData({
                              ...rootPersonData,
                              gender: e.target.value,
                            });
                            handleFieldChange("gender", e.target.value);
                          }}
                          onBlur={() =>
                            validateField("gender", rootPersonData.gender)
                          }
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                            errors.gender && touched.gender
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                          data-error={
                            errors.gender && touched.gender ? "true" : "false"
                          }
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-4 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.gender && touched.gender && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    {/* Birth Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Birth Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={rootPersonData.birthDate}
                          onChange={(e) => {
                            setRootPersonData({
                              ...rootPersonData,
                              birthDate: e.target.value,
                            });
                            handleFieldChange("birthDate", e.target.value);
                          }}
                          onBlur={() =>
                            validateField("birthDate", rootPersonData.birthDate)
                          }
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.birthDate && touched.birthDate
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300"
                          }`}
                          data-error={
                            errors.birthDate && touched.birthDate
                              ? "true"
                              : "false"
                          }
                        />
                      </div>
                      {errors.birthDate && touched.birthDate && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.birthDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Place of Origin */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Place of Origin <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addPlaceOfOrigin}
                      disabled={placesOfOrigin.length >= 4}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add Place
                    </button>
                  </div>

                  <div className="space-y-3">
                    {placesOfOrigin.map((place, index) => (
                      <div
                        key={place.id}
                        className="p-4 bg-white rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Place {index + 1}
                          </span>
                          {placesOfOrigin.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePlaceOfOrigin(place.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <select
                            value={place.location}
                            onChange={(e) =>
                              updatePlaceOfOrigin(
                                place.id,
                                "location",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">Choose origin</option>
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

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Start Date{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={place.startDate}
                                onChange={(e) =>
                                  updatePlaceOfOrigin(
                                    place.id,
                                    "startDate",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                End Date (optional)
                              </label>
                              <input
                                type="date"
                                value={place.endDate}
                                onChange={(e) =>
                                  updatePlaceOfOrigin(
                                    place.id,
                                    "endDate",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum 4 places of origin per person
                  </p>
                  {errors.placesOfOrigin && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.placesOfOrigin}
                    </p>
                  )}
                </div>

                {/* Occupation */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Occupation <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addOccupation}
                      disabled={occupations.length >= 5}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Add Occupation
                    </button>
                  </div>

                  <div className="space-y-3">
                    {occupations.map((occupation, index) => (
                      <div
                        key={occupation.id}
                        className="p-4 bg-white rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Occupation {index + 1}
                          </span>
                          {occupations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOccupation(occupation.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <input
                            type="text"
                            value={occupation.title}
                            onChange={(e) =>
                              updateOccupation(
                                occupation.id,
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="e.g. Software Engineer"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={occupation.startDate}
                                onChange={(e) =>
                                  updateOccupation(
                                    occupation.id,
                                    "startDate",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                End Date (optional)
                              </label>
                              <input
                                type="date"
                                value={occupation.endDate}
                                onChange={(e) =>
                                  updateOccupation(
                                    occupation.id,
                                    "endDate",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum 5 occupations per person
                  </p>
                  {errors.occupations && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.occupations}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rootPersonData.address}
                    onChange={(e) => {
                      setRootPersonData({
                        ...rootPersonData,
                        address: e.target.value,
                      });
                      handleFieldChange("address", e.target.value);
                    }}
                    onBlur={() =>
                      validateField("address", rootPersonData.address)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address && touched.address
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter full address"
                    data-error={
                      errors.address && touched.address ? "true" : "false"
                    }
                  />
                  {errors.address && touched.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* Profile Picture */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Picture{" "}
                    <span className="text-gray-500">(optional)</span>
                  </label>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <Image
                          src={profilePicture}
                          alt="Profile"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                        id="profile-picture"
                      />
                      <label
                        htmlFor="profile-picture"
                        className="inline-block px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                      >
                        Choose Image
                      </label>
                      {profilePicture && (
                        <button
                          type="button"
                          onClick={removeProfilePicture}
                          className="ml-2 text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmAccuracy}
                    onChange={(e) => setConfirmAccuracy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I confirm that all information provided is accurate and
                    truthful
                  </span>
                </label>
              </div>

              {/* Info Alert */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800">
                      Once a family member is added, their record becomes
                      permanent and cannot be deleted from the system. Please
                      ensure all information is accurate before submitting.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={handleBackdropClick}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !confirmAccuracy}
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  Create
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
