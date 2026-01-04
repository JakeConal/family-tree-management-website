'use client';

import classNames from 'classnames';
import { ChevronDown, Calendar } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { AchievementType, FamilyMember } from '@/types';

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
		familyMemberId: '',
		achievementTypeId: '',
		achieveDate: '',
		title: '',
		description: '',
	});

	const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingTypes, setIsLoadingTypes] = useState(false);

	// Member data state
	const [selectedMemberBirthDate, setSelectedMemberBirthDate] = useState<string>('');
	const [selectedMemberPassingDate, setSelectedMemberPassingDate] = useState<string>('');

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const fetchAchievementTypes = useCallback(async () => {
		setIsLoadingTypes(true);
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/achievement-types`);
			if (response.ok) {
				const types = await response.json();
				setAchievementTypes(types);
			}
		} catch (error) {
			console.error('Error fetching achievement types:', error);
		} finally {
			setIsLoadingTypes(false);
		}
	}, [familyTreeId]);

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setAchievementFormData({
				familyMemberId: '',
				achievementTypeId: '',
				achieveDate: '',
				title: '',
				description: '',
			});
			setSelectedMemberBirthDate('');
			setSelectedMemberPassingDate('');
			setErrors({});
			setTouched({});
			setIsSubmitting(false);
			fetchAchievementTypes();
		}
	}, [fetchAchievementTypes, isOpen]);

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

	const fetchMemberPassingRecord = async (memberId: string) => {
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/passing-records/check/${memberId}`);
			const data = await response.json();
			if (data.hasRecord && data.passingRecord) {
				setSelectedMemberPassingDate(data.passingRecord.dateOfPassing);
			} else {
				setSelectedMemberPassingDate('');
			}
		} catch (error) {
			console.error('Error fetching member passing record:', error);
			setSelectedMemberPassingDate('');
		}
	};

	// Validation functions
	const validateField = (field: string, value: string) => {
		const newErrors = { ...errors };

		switch (field) {
			case 'familyMemberId':
				if (!value) {
					newErrors.familyMemberId = 'Family member is required';
				} else {
					delete newErrors.familyMemberId;
				}
				break;
			case 'achievementTypeId':
				if (!value) {
					newErrors.achievementTypeId = 'Achievement type is required';
				} else {
					delete newErrors.achievementTypeId;
				}
				break;
			case 'achieveDate':
				if (!value) {
					newErrors.achieveDate = 'Date achieved is required';
				} else {
					delete newErrors.achieveDate;
				}
				break;
		}

		setErrors(newErrors);
	};

	const validateDates = () => {
		const newErrors = { ...errors };
		let hasDateErrors = false;

		// Validate achievement date constraints
		if (achievementFormData.achieveDate) {
			if (selectedMemberBirthDate && achievementFormData.achieveDate <= selectedMemberBirthDate) {
				newErrors.achieveDate = 'Achievement date must be after the birth date';
				hasDateErrors = true;
			} else if (selectedMemberPassingDate && achievementFormData.achieveDate >= selectedMemberPassingDate) {
				newErrors.achieveDate = 'Achievement date must be before the date of passing';
				hasDateErrors = true;
			} else {
				delete newErrors.achieveDate;
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
		const allFields = ['familyMemberId', 'achievementTypeId', 'achieveDate'];
		const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
		setTouched(newTouched);

		// Validate all fields
		allFields.forEach((field) => {
			const value = achievementFormData[field as keyof typeof achievementFormData];
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
			const response = await fetch(`/api/family-trees/${familyTreeId}/achievements`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					familyMemberId: parseInt(achievementFormData.familyMemberId),
					achievementTypeId: parseInt(achievementFormData.achievementTypeId),
					achieveDate: achievementFormData.achieveDate,
					title: achievementFormData.title.trim() || null,
					description: achievementFormData.description.trim() || null,
				}),
			});

			if (response.ok) {
				toast.success('Achievement recorded successfully!');
				onAchievementRecorded();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to record achievement');
			}
		} catch (error) {
			console.error('Error recording achievement:', error);
			toast.error('Failed to record achievement');
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid = () => {
		return (
			achievementFormData.familyMemberId && achievementFormData.achievementTypeId && achievementFormData.achieveDate
		);
	};

	// Get selected achievement type name for display
	// const getSelectedTypeName = () => {
	// 	const type = achievementTypes.find((t) => t.id.toString() === achievementFormData.achievementTypeId);
	// 	return type?.typeName || '';
	// };

	// Get selected member name for display
	// const getSelectedMemberName = () => {
	// 	const member = existingMembers.find((m) => m.id.toString() === achievementFormData.familyMemberId);
	// 	return member?.fullName || '';
	// };

	// Format date for display
	// const formatDateDisplay = (dateString: string) => {
	// 	if (!dateString) return '';
	// 	const date = new Date(dateString);
	// 	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	// };

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

					{/* Trophy Icon */}
					<div className="flex justify-center mb-4">
						<div className="w-[50px] h-[50px] bg-white border-[1.5px] border-black rounded-[15px] flex items-center justify-center">
							<Image src="/icons/cup.png" alt="Achievement" width={20} height={20} />
						</div>
					</div>

					{/* Title */}
					<h2 className="text-[26px] font-normal text-black text-center">Achievement Editing</h2>
				</div>

				{/* Form Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-200px)]">
					<form onSubmit={handleSubmit} className="px-[69px] pb-8 space-y-5">
						{/* Family Member Selection */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Family Member *</label>
							<div className="relative">
								<select
									value={achievementFormData.familyMemberId}
									onChange={(e) => {
										const selectedId = e.target.value;
										const selectedMember = existingMembers.find((member) => member.id.toString() === selectedId);

										setAchievementFormData({
											...achievementFormData,
											familyMemberId: selectedId,
										});
										setSelectedMemberBirthDate(
											selectedMember?.birthday ? selectedMember.birthday.toISOString().split('T')[0] : ''
										);

										// Fetch passing record for the selected member
										if (selectedId) {
											fetchMemberPassingRecord(selectedId);
										} else {
											setSelectedMemberPassingDate('');
										}

										handleFieldChange('familyMemberId');
									}}
									onBlur={() => validateField('familyMemberId', achievementFormData.familyMemberId)}
									className={classNames(
										'w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400',
										{
											'border-red-500 bg-red-50': errors.familyMemberId && touched.familyMemberId,
										}
									)}
									data-error={errors.familyMemberId && touched.familyMemberId ? 'true' : 'false'}
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
							{errors.familyMemberId && touched.familyMemberId && (
								<p className="mt-1 text-sm text-red-600">{errors.familyMemberId}</p>
							)}
						</div>

						{/* Achievement Type and Date Row */}
						<div className="grid grid-cols-2 gap-4">
							{/* Achievement Type Selection */}
							<div>
								<label className="block text-[16px] font-normal text-black mb-2">Achievement Type *</label>
								<div className="relative">
									<select
										value={achievementFormData.achievementTypeId}
										onChange={(e) => {
											setAchievementFormData({
												...achievementFormData,
												achievementTypeId: e.target.value,
											});
											handleFieldChange('achievementTypeId');
										}}
										onBlur={() => validateField('achievementTypeId', achievementFormData.achievementTypeId)}
										className={classNames(
											'w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400',
											{
												'border-red-500 bg-red-50': errors.achievementTypeId && touched.achievementTypeId,
											}
										)}
										data-error={errors.achievementTypeId && touched.achievementTypeId ? 'true' : 'false'}
										disabled={isLoadingTypes}
									>
										<option value="">{isLoadingTypes ? 'Loading...' : 'Select type'}</option>
										{achievementTypes.map((type) => (
											<option key={type.id} value={type.id}>
												{type.typeName}
											</option>
										))}
									</select>
									<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
								</div>
								{errors.achievementTypeId && touched.achievementTypeId && (
									<p className="mt-1 text-sm text-red-600">{errors.achievementTypeId}</p>
								)}
							</div>

							{/* Date Achieved */}
							<div>
								<label className="block text-[16px] font-normal text-black mb-2">Date Achieved *</label>
								<div className="relative">
									<input
										type="date"
										value={achievementFormData.achieveDate}
										onChange={(e) => {
											setAchievementFormData({
												...achievementFormData,
												achieveDate: e.target.value,
											});
											handleFieldChange('achieveDate');
										}}
										onBlur={() => validateField('achieveDate', achievementFormData.achieveDate)}
										className={classNames(
											'w-full h-[35px] px-4 pr-10 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black focus:outline-none focus:ring-2 focus:ring-gray-400',
											{
												'border-red-500 bg-red-50': errors.achieveDate && touched.achieveDate,
											}
										)}
										data-error={errors.achieveDate && touched.achieveDate ? 'true' : 'false'}
									/>
									<Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
								</div>
								{errors.achieveDate && touched.achieveDate && (
									<p className="mt-1 text-sm text-red-600">{errors.achieveDate}</p>
								)}
							</div>
						</div>

						{/* Achievement Title */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">
								Achievement Title <span className="text-[11.5px] text-black/50">(optional)</span>
							</label>
							<input
								type="text"
								value={achievementFormData.title}
								onChange={(e) => {
									setAchievementFormData({
										...achievementFormData,
										title: e.target.value,
									});
									handleFieldChange('title');
								}}
								placeholder="e.g. Master's Degree in Computer Science"
								className="w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400"
							/>
						</div>

						{/* Description */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">
								Description <span className="text-[11.5px] text-black/50">(optional)</span>
							</label>
							<textarea
								value={achievementFormData.description}
								onChange={(e) =>
									setAchievementFormData({
										...achievementFormData,
										description: e.target.value,
									})
								}
								placeholder="Describe the achievement..."
								rows={4}
								className="w-full px-4 py-3 bg-[#f3f2f2] border border-black/50 rounded-[20px] text-[12px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
							/>
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
