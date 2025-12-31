'use client';

import { ChevronLeft, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
		familyName: '',
		origin: '',
		establishYear: '',
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Reset form when modal opens or familyTree changes
	useEffect(() => {
		if (isOpen && familyTree) {
			setFormData({
				familyName: familyTree.familyName,
				origin: familyTree.origin || '',
				establishYear: familyTree.establishYear?.toString() || '',
			});
		}
	}, [isOpen, familyTree]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const response = await fetch(`/api/family-trees/${familyTree.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					familyName: formData.familyName,
					origin: formData.origin || null,
					establishYear: formData.establishYear ? parseInt(formData.establishYear) : null,
				}),
			});

			if (response.ok) {
				toast.success('Family tree updated successfully!');
				onFamilyTreeUpdated();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to update family tree');
			}
		} catch (error) {
			console.error('Error updating family tree:', error);
			toast.error('Failed to update family tree');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="px-8 pt-8 pb-4 border-b border-gray-100 flex-shrink-0">
					<button
						onClick={onClose}
						className="flex items-center text-black font-normal text-base hover:opacity-70 transition-opacity"
					>
						<ChevronLeft className="w-5 h-5 mr-2" />
						<span className="font-['Inter']">Back</span>
					</button>
				</div>

				{/* Form Content */}
				<div className="flex-1 overflow-y-auto px-10 py-8">
					<h2 className="text-[26px] font-normal text-black text-center mb-10">Edit Family Tree</h2>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Family Name */}
						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">
								Family Name <span className="text-black">*</span>
							</label>
							<input
								type="text"
								value={formData.familyName}
								onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
								placeholder="Enter family name"
								className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
								required
							/>
						</div>

						{/* Origin */}
						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Origin</label>
							<div className="relative">
								<select
									value={formData.origin}
									onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
									className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 pr-10 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none appearance-none cursor-pointer"
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
								<X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
						</div>

						{/* Establish Year */}
						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Establish Year</label>
							<input
								type="number"
								value={formData.establishYear}
								onChange={(e) => setFormData({ ...formData, establishYear: e.target.value })}
								placeholder="Enter establish year"
								min="1"
								max={new Date().getFullYear()}
								className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
							/>
						</div>

						{/* Footer Buttons */}
						<div className="flex justify-center items-center space-x-4 pt-10 pb-10">
							<button
								type="button"
								onClick={onClose}
								className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="w-[150px] h-[40px] bg-[#1f2937] text-white rounded-[10px] font-bold text-sm hover:bg-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Updating...' : 'Update'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
