'use client';

import { ChevronDown, Calendar, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

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

interface RecordDivorceModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	existingMembers: FamilyMember[];
	onDivorceRecorded: () => void;
}

export default function RecordDivorceModal({
	isOpen,
	onClose,
	familyTreeId,
	existingMembers,
	onDivorceRecorded,
}: RecordDivorceModalProps) {
	const [divorceFormData, setDivorceFormData] = useState({
		member1Id: '',
		member2Id: '',
		divorceDate: '',
	});

	const [marriages, setMarriages] = useState<SpouseRelationship[]>([]);
	const [filteredSpouses, setFilteredSpouses] = useState<SpouseRelationship[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingMarriages, setIsLoadingMarriages] = useState(false);

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const fetchMarriages = useCallback(async () => {
		setIsLoadingMarriages(true);
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/divorces`);
			if (response.ok) {
				const data = await response.json();
				setMarriages(data);
			}
		} catch (error) {
			console.error('Error fetching marriages:', error);
		} finally {
			setIsLoadingMarriages(false);
		}
	}, [familyTreeId]);

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setDivorceFormData({
				member1Id: '',
				member2Id: '',
				divorceDate: '',
			});
			setFilteredSpouses([]);
			setErrors({});
			setTouched({});
			setIsSubmitting(false);
			fetchMarriages();
		}
	}, [fetchMarriages, isOpen]);

	// Handle escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, onClose]);

	// Filter spouses when member1 changes
	useEffect(() => {
		if (divorceFormData.member1Id) {
			const spouse = marriages.filter((m) => {
				const isMember1 = m.familyMember1.id === parseInt(divorceFormData.member1Id);
				const isMember2 = m.familyMember2.id === parseInt(divorceFormData.member1Id);
				return (isMember1 || isMember2) && !m.divorceDate;
			});
			setFilteredSpouses(spouse);
		} else {
			setFilteredSpouses([]);
		}
	}, [divorceFormData.member1Id, marriages]);

	// Validation functions
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
		if (divorceFormData.member1Id && divorceFormData.member2Id && divorceFormData.divorceDate) {
			const marriage = marriages.find((m) => {
				const isMember1Marriage =
					(m.familyMember1.id === parseInt(divorceFormData.member1Id) &&
						m.familyMember2.id === parseInt(divorceFormData.member2Id)) ||
					(m.familyMember1.id === parseInt(divorceFormData.member2Id) &&
						m.familyMember2.id === parseInt(divorceFormData.member1Id));
				return isMember1Marriage && !m.divorceDate;
			});

			if (marriage) {
				const marriageDate = new Date(marriage.marriageDate);
				const divorceDate = new Date(divorceFormData.divorceDate);

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Mark all fields as touched to show validation errors
		const allFields = ['member1Id', 'member2Id', 'divorceDate'];
		const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
		setTouched(newTouched);

		// Validate all fields
		allFields.forEach((field) => {
			const value = divorceFormData[field as keyof typeof divorceFormData];
			validateField(field, value as string);
		});

		const datesValid = validateDates();

		// Check if all validations pass
		const hasErrors = Object.keys(errors).length > 0 || !datesValid;

		if (hasErrors) {
			// Scroll to first error
			const firstErrorField = document.querySelector('[data-error="true"]');
			if (firstErrorField) {
				firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/divorces`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					member1Id: parseInt(divorceFormData.member1Id),
					member2Id: parseInt(divorceFormData.member2Id),
					divorceDate: divorceFormData.divorceDate,
				}),
			});

			if (response.ok) {
				toast.success('Divorce recorded successfully!');
				onDivorceRecorded();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to record divorce');
			}
		} catch (error) {
			console.error('Error recording divorce:', error);
			toast.error('Failed to record divorce');
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid = () => {
		return divorceFormData.member1Id && divorceFormData.member2Id && divorceFormData.divorceDate;
	};

	const getSpouseName = (relationshipId: number) => {
		const relationship = marriages.find((m) => m.id === relationshipId);
		if (!relationship) return '';

		const member1Id = parseInt(divorceFormData.member1Id);
		if (relationship.familyMember1.id === member1Id) {
			return relationship.familyMember2.fullName;
		}
		return relationship.familyMember1.fullName;
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

			{/* Modal Content */}
			<div className="bg-white rounded-[20px] shadow-2xl w-[600px] max-h-[90vh] overflow-hidden relative z-10">
				{/* Header */}
				<div className="px-8 pt-6 pb-4">
					{/* Back Button */}
					<button onClick={onClose} className="flex items-center text-black hover:text-gray-600 transition-colors mb-6">
						<span className="font-light mr-1">&lt;</span>
						<span className="font-normal">Back</span>
					</button>

					{/* Broken Heart Icon */}
					<div className="flex justify-center mb-4">
						<div className="w-[50px] h-[50px] bg-white border-[1.5px] border-black rounded-[15px] flex items-center justify-center">
							<Image src="/icons/broken.png" alt="Divorce" width={20} height={20} />
						</div>
					</div>

					{/* Title */}
					<h2 className="text-[26px] font-normal text-black text-center">Add Divorce</h2>
				</div>

				{/* Form Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-220px)]">
					<form onSubmit={handleSubmit} className="px-[69px] pb-8 space-y-5">
						{/* Member 1 Selection */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Member 1 *</label>
							<div className="relative">
								<select
									value={divorceFormData.member1Id}
									onChange={(e) => {
										setDivorceFormData({
											...divorceFormData,
											member1Id: e.target.value,
											member2Id: '',
										});
										handleFieldChange('member1Id');
									}}
									onBlur={() => validateField('member1Id', divorceFormData.member1Id)}
									className="w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
									data-error={errors.member1Id && touched.member1Id ? 'true' : 'false'}
								>
									<option value="">Select member</option>
									{existingMembers.map((member) => (
										<option key={member.id} value={member.id}>
											{member.fullName}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
							{errors.member1Id && touched.member1Id && <p className="mt-1 text-sm text-red-600">{errors.member1Id}</p>}
						</div>

						{/* Member 2 Selection */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Member 2 *</label>
							<div className="relative">
								<select
									value={divorceFormData.member2Id}
									onChange={(e) => {
										setDivorceFormData({
											...divorceFormData,
											member2Id: e.target.value,
										});
										handleFieldChange('member2Id');
									}}
									onBlur={() => validateField('member2Id', divorceFormData.member2Id)}
									disabled={!divorceFormData.member1Id || isLoadingMarriages || filteredSpouses.length === 0}
									className="w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
									data-error={errors.member2Id && touched.member2Id ? 'true' : 'false'}
								>
									<option value="">
										{!divorceFormData.member1Id
											? 'Select Member 1 first'
											: isLoadingMarriages
												? 'Loading...'
												: filteredSpouses.length === 0
													? 'No married spouses found'
													: 'Select member'}
									</option>
									{filteredSpouses.map((relationship) => (
										<option key={relationship.id} value={relationship.id}>
											{getSpouseName(relationship.id)}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
							{errors.member2Id && touched.member2Id && <p className="mt-1 text-sm text-red-600">{errors.member2Id}</p>}
						</div>

						{/* Date of Divorce */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Date of Divorce *</label>
							<div className="relative">
								<input
									type="date"
									value={divorceFormData.divorceDate}
									onChange={(e) => {
										setDivorceFormData({
											...divorceFormData,
											divorceDate: e.target.value,
										});
										handleFieldChange('divorceDate');
									}}
									onBlur={() => validateField('divorceDate', divorceFormData.divorceDate)}
									className="w-full h-[35px] px-4 pr-10 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
									placeholder="MM/DD/YYYY"
									data-error={errors.divorceDate && touched.divorceDate ? 'true' : 'false'}
								/>
								<Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
							{errors.divorceDate && touched.divorceDate && (
								<p className="mt-1 text-sm text-red-600">{errors.divorceDate}</p>
							)}
						</div>

						{/* Important Notice */}
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

						{/* Error Message */}
						{Object.keys(errors).length > 0 && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-3">
								<p className="text-sm font-medium text-red-800">Please fill in all required fields</p>
							</div>
						)}

						{/* Actions */}
						<div className="flex items-center justify-center gap-4 pt-6">
							<button
								type="button"
								onClick={onClose}
								className="w-[95px] h-[40px] bg-white border border-black rounded-[10px] text-[14px] text-black hover:bg-gray-50 transition-colors"
								disabled={isSubmitting}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSubmitting || !isFormValid()}
								className="w-[123px] h-[40px] bg-[#1f2937] rounded-[10px] text-[14px] text-white hover:bg-[#374151] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
							>
								{isSubmitting ? 'Saving...' : 'Save'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
