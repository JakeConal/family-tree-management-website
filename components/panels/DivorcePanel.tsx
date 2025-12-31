'use client';

import { X, ChevronLeft, Calendar, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';

import LoadingScreen from '@/components/LoadingScreen';
import { FamilyMember } from '@/types';

interface SpouseRelationship {
	id: number;
	marriageDate: Date;
	divorceDate: Date | null;
	familyMember1: {
		id: number;
		fullName: string;
	};
	familyMember2: {
		id: number;
		fullName: string;
	};
}

interface DivorcePanelProps {
	mode: 'add' | 'view' | 'edit';
	divorceId?: number; // This is the relationship ID
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
	onSuccess: () => void;
}

export default function DivorcePanel({
	mode,
	divorceId,
	familyTreeId,
	familyMembers,
	onModeChange,
	onClose,
	onSuccess,
}: DivorcePanelProps) {
	const [relationship, setRelationship] = useState<SpouseRelationship | null>(null);
	const [loading, setLoading] = useState(false);
	const [marriages, setMarriages] = useState<SpouseRelationship[]>([]);
	const [filteredSpouses, setFilteredSpouses] = useState<SpouseRelationship[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		member1Id: '',
		member2Id: '',
		divorceDate: '',
	});

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const fetchMarriages = useCallback(async () => {
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/divorces`);
			if (response.ok) {
				const data = await response.json();
				setMarriages(data);
			}
		} catch (error) {
			console.error('Error fetching marriages:', error);
		}
	}, [familyTreeId]);

	const fetchDivorce = useCallback(async () => {
		if (!divorceId) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/family-trees/${familyTreeId}/life-events/${divorceId}`);
			if (res.ok) {
				const data = await res.json();
				setRelationship(data);

				// Populate form data
				setFormData({
					member1Id: data.familyMember1.id.toString(),
					member2Id: data.id.toString(), // Use relationship id for member2Id in view mode
					divorceDate: data.divorceDate ? new Date(data.divorceDate).toISOString().split('T')[0] : '',
				});
			}
		} catch (error) {
			console.error('Error fetching divorce:', error);
			toast.error('Failed to load divorce record');
		} finally {
			setLoading(false);
		}
	}, [divorceId, familyTreeId]);

	useEffect(() => {
		fetchMarriages();
		if (mode !== 'add' && divorceId) {
			fetchDivorce();
		} else {
			// Reset form for add mode
			setFormData({
				member1Id: '',
				member2Id: '',
				divorceDate: '',
			});
			setRelationship(null);
		}
	}, [mode, divorceId, fetchMarriages, fetchDivorce]);

	// Filter spouses when member1 changes
	useEffect(() => {
		if (formData.member1Id) {
			const spouse = marriages.filter((m) => {
				const isMember1 = m.familyMember1.id === parseInt(formData.member1Id);
				const isMember2 = m.familyMember2.id === parseInt(formData.member1Id);
				return (isMember1 || isMember2) && !m.divorceDate;
			});
			setFilteredSpouses(spouse);
		} else {
			setFilteredSpouses([]);
		}
	}, [formData.member1Id, marriages]);

	const validateField = (field: string, value: string) => {
		const newErrors = { ...errors };

		switch (field) {
			case 'member1Id':
				if (!value) {
					newErrors.member1Id = 'Member 1 is required';
				} else {
					delete newErrors.member1Id;
				}
				break;
			case 'member2Id':
				if (!value) {
					newErrors.member2Id = 'Member 2 is required';
				} else {
					delete newErrors.member2Id;
				}
				break;
			case 'divorceDate':
				if (!value) {
					newErrors.divorceDate = 'Date of divorce is required';
				} else {
					delete newErrors.divorceDate;
				}
				break;
		}

		setErrors(newErrors);
	};

	const validateDates = () => {
		const newErrors = { ...errors };
		let hasDateErrors = false;

		// Find the marriage record
		if (formData.member1Id && formData.member2Id && formData.divorceDate) {
			const marriage = marriages.find((m) => {
				const isMember1Marriage =
					(m.familyMember1.id === parseInt(formData.member1Id) &&
						m.familyMember2.id === parseInt(formData.member2Id)) ||
					(m.familyMember1.id === parseInt(formData.member2Id) &&
						m.familyMember2.id === parseInt(formData.member1Id));
				return isMember1Marriage && !m.divorceDate;
			});

			if (marriage) {
				const marriageDate = new Date(marriage.marriageDate);
				const divorceDate = new Date(formData.divorceDate);

				if (divorceDate <= marriageDate) {
					newErrors.divorceDate = 'Divorce date must be after the marriage date';
					hasDateErrors = true;
				} else {
					delete newErrors.divorceDate;
				}
			}
		}

		setErrors(newErrors);
		return !hasDateErrors;
	};

	const handleFieldChange = (field: string) => {
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
		setTouched((prev) => ({ ...prev, [field]: true }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Mark all fields as touched
		const allFields = ['member1Id', 'member2Id', 'divorceDate'];
		const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
		setTouched(newTouched);

		// Validate all fields
		allFields.forEach((field) => {
			const value = formData[field as keyof typeof formData];
			validateField(field, value as string);
		});

		const datesValid = validateDates();
		const hasErrors = Object.keys(errors).length > 0 || !datesValid;

		if (hasErrors) {
			return;
		}

		setIsSubmitting(true);

		try {
			const url = `/api/family-trees/${familyTreeId}/divorces`;
			const method = mode === 'add' ? 'PATCH' : 'PATCH'; // Both use PATCH for updating divorce date

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					member1Id: parseInt(formData.member1Id),
					member2Id: parseInt(formData.member2Id),
					divorceDate: formData.divorceDate,
				}),
			});

			if (response.ok) {
				toast.success('Divorce recorded successfully!');
				onSuccess();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to record divorce');
			}
		} catch (error) {
			console.error('Error saving divorce:', error);
			toast.error('Failed to record divorce');
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatDate = (dateString: string | Date | null) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const getSpouseName = (relationshipId: number) => {
		const rel = marriages.find((m) => m.id === relationshipId);
		if (!rel) return '';

		const member1Id = parseInt(formData.member1Id);
		if (rel.familyMember1.id === member1Id) {
			return rel.familyMember2.fullName;
		}
		return rel.familyMember1.fullName;
	};

	if (loading) {
		return (
			<div className="w-full h-full">
				<LoadingScreen message="Loading divorce record..." />
			</div>
		);
	}

	const isViewMode = mode === 'view';
	const isAddMode = mode === 'add';

	return (
		<div className="w-full h-full flex flex-col bg-white">
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

			{isViewMode ? (
				/* View Mode */
				<div className="flex-1 overflow-y-auto px-10 py-8">
					<h2 className="text-[26px] font-normal text-black text-center mb-10">Divorce Record Details</h2>

					<div className="space-y-6">
						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Member 1 *</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{relationship?.familyMember1.fullName}
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Member 2 *</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{relationship?.familyMember2.fullName}
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Marriage Date</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{formatDate(relationship?.marriageDate || '')}
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Divorce Date *</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{formatDate(relationship?.divorceDate || '')}
							</div>
						</div>

						{/* Footer Buttons */}
						<div className="flex justify-center items-center space-x-4 pt-10">
							<button
								onClick={onClose}
								className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
							>
								Back
							</button>
							<button
								onClick={() => onModeChange('edit')}
								className="w-[123px] h-[40px] bg-[#1f2937] text-white rounded-[10px] font-bold text-sm hover:bg-[#111827] transition-colors flex items-center justify-center"
							>
								Edit
							</button>
						</div>
					</div>
				</div>
			) : (
				/* Add/Edit Mode */
				<div className="flex-1 overflow-y-auto px-10 py-8">
					<h2 className="text-[26px] font-normal text-black text-center mb-10">
						{isAddMode ? 'Add Divorce Record' : 'Edit Divorce Date'}
					</h2>

					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Member 1 Selection */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Member 1 *</label>
							<div className="relative">
								<select
									value={formData.member1Id}
									onChange={(e) => {
										setFormData({
											...formData,
											member1Id: e.target.value,
											member2Id: '',
										});
										handleFieldChange('member1Id');
									}}
									onBlur={() => validateField('member1Id', formData.member1Id)}
									className={classNames(
										'w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400',
										{
											'border-red-500 bg-red-50': errors.member1Id && touched.member1Id,
										}
									)}
									disabled={!isAddMode}
								>
									<option value="">Select member</option>
									{familyMembers.map((member) => (
										<option key={member.id} value={member.id}>
											{member.fullName}
										</option>
									))}
								</select>
								<X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
							{errors.member1Id && touched.member1Id && <p className="mt-1 text-sm text-red-600">{errors.member1Id}</p>}
						</div>

						{/* Member 2 Selection */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Member 2 *</label>
							<div className="relative">
								<select
									value={formData.member2Id}
									onChange={(e) => {
										setFormData({
											...formData,
											member2Id: e.target.value,
										});
										handleFieldChange('member2Id');
									}}
									onBlur={() => validateField('member2Id', formData.member2Id)}
									disabled={!formData.member1Id || filteredSpouses.length === 0 || !isAddMode}
									className={classNames(
										'w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed',
										{
											'border-red-500 bg-red-50': errors.member2Id && touched.member2Id,
										}
									)}
								>
									<option value="">
										{!formData.member1Id
											? 'Select Member 1 first'
											: filteredSpouses.length === 0
												? 'No married spouses found'
												: 'Select member'}
									</option>
									{filteredSpouses.map((rel) => (
										<option key={rel.id} value={rel.id}>
											{getSpouseName(rel.id)}
										</option>
									))}
								</select>
								<X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
							{errors.member2Id && touched.member2Id && <p className="mt-1 text-sm text-red-600">{errors.member2Id}</p>}
						</div>

						{/* Date of Divorce */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Date of Divorce *</label>
							<div className="relative">
								<input
									type="date"
									value={formData.divorceDate}
									onChange={(e) => {
										setFormData({
											...formData,
											divorceDate: e.target.value,
										});
										handleFieldChange('divorceDate');
									}}
									onBlur={() => validateField('divorceDate', formData.divorceDate)}
									className={classNames(
										'w-full h-[35px] px-4 pr-10 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black focus:outline-none focus:ring-2 focus:ring-gray-400',
										{
											'border-red-500 bg-red-50': errors.divorceDate && touched.divorceDate,
										}
									)}
									placeholder="MM/DD/YYYY"
								/>
								<Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
							{errors.divorceDate && touched.divorceDate && (
								<p className="mt-1 text-sm text-red-600">{errors.divorceDate}</p>
							)}
						</div>

						{/* Important Notice - Only show in add mode */}
						{isAddMode && (
							<div className="bg-[#bfdbfe] border border-black/50 rounded-[10px] p-4 flex gap-3">
								<AlertTriangle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
								<div>
									<h3 className="text-[14px] font-medium text-black mb-1">Important</h3>
									<p className="text-[12px] text-black">
										The <span className="font-bold">Family Member selected</span> for this record{' '}
										<span className="font-bold">cannot be changed</span> once saved. Furthermore, this record is{' '}
										<span className="font-bold">permanent</span> and <span className="font-bold">cannot be deleted</span>.
									</p>
								</div>
							</div>
						)}

						{/* Error Message */}
						{Object.keys(errors).length > 0 && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-3">
								<p className="text-sm font-medium text-red-800">Please fill in all required fields</p>
							</div>
						)}

						{/* Footer Buttons */}
						<div className="flex justify-center items-center space-x-4 pt-6">
							<button
								type="button"
								onClick={() => (isAddMode ? onClose() : onModeChange('view'))}
								className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
								disabled={isSubmitting}
							>
								{isAddMode ? 'Cancel' : 'Back'}
							</button>
							<button
								type="submit"
								disabled={isSubmitting}
								className="w-[123px] h-[40px] bg-[#1f2937] text-white rounded-[10px] font-bold text-sm hover:bg-[#111827] transition-colors flex items-center justify-center disabled:opacity-50"
							>
								{isSubmitting ? 'Saving...' : 'Save'}
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}

