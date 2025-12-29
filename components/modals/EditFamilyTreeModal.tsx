"use client";

import { useState, useEffect } from "react";
import { X, TreePine, MapPin, Calendar } from "lucide-react";

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

interface EditFamilyTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyTree: FamilyTree;
  onFamilyTreeUpdated: () => void;
}

export default function EditFamilyTreeModal({
  isOpen,
  onClose,
  familyTree,
  onFamilyTreeUpdated,
}: EditFamilyTreeModalProps) {
  const [formData, setFormData] = useState({
    familyName: "",
    origin: "",
    establishYear: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or familyTree changes
  useEffect(() => {
    if (isOpen && familyTree) {
      setFormData({
        familyName: familyTree.familyName,
        origin: familyTree.origin || "",
        establishYear: familyTree.establishYear?.toString() || "",
      });
    }
  }, [isOpen, familyTree]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/family-trees/${familyTree.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyName: formData.familyName,
          origin: formData.origin || null,
          establishYear: formData.establishYear
            ? parseInt(formData.establishYear)
            : null,
        }),
      });

      if (response.ok) {
        onFamilyTreeUpdated();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update family tree");
      }
    } catch (error) {
      console.error("Error updating family tree:", error);
      alert("Failed to update family tree");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <TreePine className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Family Tree
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Family Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Family Name*
            </label>
            <div className="relative">
              <TreePine className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.familyName}
                onChange={(e) =>
                  setFormData({ ...formData, familyName: e.target.value })
                }
                placeholder="Enter family name"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origin
            </label>
            <div className="relative">
              <select
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
              >
                <option value="">Select origin</option>
                <option value="An Giang">An Giang</option>
                <option value="Ba Ria – Vung Tau">Ba Ria – Vung Tau</option>
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
                <option value="Ho Chi Minh City">Ho Chi Minh City</option>
                <option value="Hai Phong">Hai Phong</option>
                <option value="Da Nang">Da Nang</option>
                <option value="Can Tho">Can Tho</option>
                <option value="Hue">Hue</option>
              </select>
            </div>
          </div>

          {/* Establish Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Establish Year
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.establishYear}
                onChange={(e) =>
                  setFormData({ ...formData, establishYear: e.target.value })
                }
                placeholder="Enter establish year"
                min="1"
                max={new Date().getFullYear()}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Family Tree"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
