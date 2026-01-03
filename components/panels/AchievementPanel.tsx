'use client';

import { X, ChevronLeft, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';

import LoadingScreen from '@/components/LoadingScreen';
import { AchievementType, FamilyMember } from '@/types';

interface Achievement {
	id: number;
	title: string;
	achieveDate: Date | null;
	description: string | null;
	familyMember: {
		id: number;
		fullName: string;
	};
	achievementType: {
		id: number;
		typeName: string;
	};
}

interface AchievementPanelProps {
	mode: 'add' | 'view' | 'edit';
	achievementId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
	onSuccess: () => void;
}

export default function AchievementPanel({
	mode,
	achievementId,
	familyTreeId,
	familyMembers,
	onModeChange,
	onClose,
	onSuccess,
}: AchievementPanelProps) {
	const [achievement, setAchievement] = useState<Achievement | null>(null);
	const [loading, setLoading] = useState(false);
	const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		familyMemberId: '',
		achievementTypeId: '',
		achieveDate: '',
		title: '',
		description: '',
	});

	// Member data state
	const [selectedMemberBirthDate, setSelectedMemberBirthDate] = useState<string>('');
	const [selectedMemberPassingDate, setSelectedMemberPassingDate] = useState<string>('');

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchAchievementTypes = useCallback(async () => {
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/achievement-types`);
			if (response.ok) {
				const types = await response.json();
				setAchievementTypes(types);
			}
		} catch (error) {
			console.error('Error fetching achievement types:', error);
		}
	}, [familyTreeId]);

	const fetchAchievement = useCallback(async () => {
		if (!achievementId) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/family-trees/${familyTreeId}/achievements/${achievementId}`);
			if (res.ok) {
				const data = await res.json();
				setAchievement(data);

				// Populate form data
				setFormData({
					familyMemberId: data.familyMember.id.toString(),
					achievementTypeId: data.achievementType.id.toString(),
					achieveDate: data.achieveDate ? new Date(data.achieveDate).toISOString().split('T')[0] : '',
					title: data.title || '',
					description: data.description || '',
				});

				// Set member birth date for validation
				const member = familyMembers.find((m) => m.id === data.familyMember.id);
				if (member?.birthday) {
					setSelectedMemberBirthDate(new Date(member.birthday).toISOString().split('T')[0]);
				}
			}
		} catch (error) {
			console.error('Error fetching achievement:', error);
			toast.error('Failed to load achievement');
		} finally {
			setLoading(false);
		}
	}, [achievementId, familyTreeId, familyMembers]);

	useEffect(() => {
		fetchAchievementTypes();
		if (mode !== 'add' && achievementId) {
			fetchAchievement();
		} else {
			// Reset form for add mode
			setFormData({
				familyMemberId: '',
				achievementTypeId: '',
				achieveDate: '',
				title: '',
				description: '',
			});
			setAchievement(null);
		}
	}, [mode, achievementId, fetchAchievementTypes, fetchAchievement]);

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

		if (formData.achieveDate) {
			if (selectedMemberBirthDate && formData.achieveDate <= selectedMemberBirthDate) {
				newErrors.achieveDate = 'Achievement date must be after the birth date';
				hasDateErrors = true;
			} else if (selectedMemberPassingDate && formData.achieveDate >= selectedMemberPassingDate) {
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
		const allFields = ['familyMemberId', 'achievementTypeId', 'achieveDate'];
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
			const url =
				mode === 'add'
					? `/api/family-trees/${familyTreeId}/achievements`
					: `/api/family-trees/${familyTreeId}/achievements/${achievementId}`;

			const method = mode === 'add' ? 'POST' : 'PUT';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					familyMemberId: parseInt(formData.familyMemberId),
					achievementTypeId: parseInt(formData.achievementTypeId),
					achieveDate: formData.achieveDate,
					title: formData.title.trim() || null,
					description: formData.description.trim() || null,
				}),
			});

			if (response.ok) {
				toast.success(mode === 'add' ? 'Achievement created successfully!' : 'Achievement updated successfully!');
				onSuccess();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || `Failed to ${mode === 'add' ? 'create' : 'update'} achievement`);
			}
		} catch (error) {
			console.error('Error saving achievement:', error);
			toast.error(`Failed to ${mode === 'add' ? 'create' : 'update'} achievement`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatDate = (dateString: string | Date | null) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const handleDelete = async () => {
		if (!achievementId) return;

		setIsDeleting(true);
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/achievements/${achievementId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				toast.success('Achievement deleted successfully!');
				onSuccess();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to delete achievement');
			}
		} catch (error) {
			console.error('Error deleting achievement:', error);
			toast.error('Failed to delete achievement');
		} finally {
			setIsDeleting(false);
			setShowDeleteModal(false);
		}
	};

	if (loading) {
		return (
			<div className="w-full h-full">
				<LoadingScreen message="Loading achievement..." />
			</div>
		);
	}

	const isViewMode = mode === 'view';
	const isAddMode = mode === 'add';

	return (
		<div className="w-full h-full flex flex-col bg-white">
			{/* Header */}
			<div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 border-b border-gray-100 flex-shrink-0">
				<button
					onClick={onClose}
					className="flex items-center text-black font-normal text-sm sm:text-base hover:opacity-70 transition-opacity"
				>
					<ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
					<span className="font-['Inter']">Back</span>
				</button>
			</div>

			{isViewMode ? (
				/* View Mode */
				<div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
					<h2 className="text-xl sm:text-2xl lg:text-[26px] font-normal text-black text-center mb-6 sm:mb-8 lg:mb-10">Achievement Details</h2>

					<div className="space-y-6">
						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Family Member *</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{achievement?.familyMember.fullName}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
							<div>
								<label className="block text-base font-normal text-black mb-1.5 ml-1">Achievement Type *</label>
								<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
									{achievement?.achievementType.typeName}
								</div>
							</div>
							<div>
								<label className="block text-base font-normal text-black mb-1.5 ml-1">Date Achieved *</label>
								<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
									{formatDate(achievement?.achieveDate || '')}
								</div>
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">
								Title <span className="text-[11.5px] text-black/50">(optional)</span>
							</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{achievement?.title || 'No title'}
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">
								Description <span className="text-[11.5px] text-black/50">(optional)</span>
							</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[20px] px-5 py-3 text-xs text-black min-h-[100px]">
								{achievement?.description || 'No description'}
							</div>
						</div>

						{/* Footer Buttons */}
						<div className="flex justify-center items-center space-x-4 pt-10">
							<button
								onClick={() => setShowDeleteModal(true)}
								className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
							>
								Delete
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
				<div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
					<h2 className="text-xl sm:text-2xl lg:text-[26px] font-normal text-black text-center mb-6 sm:mb-8 lg:mb-10">
						{isAddMode ? 'Add New Achievement' : 'Edit Achievement'}
					</h2>

					<form onSubmit={handleSubmit} className="space-y-5">
						{/* Family Member Selection */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Family Member *</label>
							<div className="relative">
								<select
									value={formData.familyMemberId}
									onChange={(e) => {
										const selectedId = e.target.value;
										const selectedMember = familyMembers.find((member) => member.id.toString() === selectedId);

										setFormData({
											...formData,
											familyMemberId: selectedId,
										});
										setSelectedMemberBirthDate(
											selectedMember?.birthday ? new Date(selectedMember.birthday).toISOString().split('T')[0] : ''
										);

										if (selectedId) {
											fetchMemberPassingRecord(selectedId);
										} else {
											setSelectedMemberPassingDate('');
										}

										handleFieldChange('familyMemberId');
									}}
									onBlur={() => validateField('familyMemberId', formData.familyMemberId)}
									className={classNames(
										'w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400',
										{
											'border-red-500 bg-red-50': errors.familyMemberId && touched.familyMemberId,
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
										value={formData.achievementTypeId}
										onChange={(e) => {
											setFormData({
												...formData,
												achievementTypeId: e.target.value,
											});
											handleFieldChange('achievementTypeId');
										}}
										onBlur={() => validateField('achievementTypeId', formData.achievementTypeId)}
										className={classNames(
											'w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400',
											{
												'border-red-500 bg-red-50': errors.achievementTypeId && touched.achievementTypeId,
											}
										)}
									>
										<option value="">Select type</option>
										{achievementTypes.map((type) => (
											<option key={type.id} value={type.id}>
												{type.typeName}
											</option>
										))}
									</select>
									<X className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
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
										value={formData.achieveDate}
										onChange={(e) => {
											setFormData({
												...formData,
												achieveDate: e.target.value,
											});
											handleFieldChange('achieveDate');
										}}
										onBlur={() => validateField('achieveDate', formData.achieveDate)}
										className={classNames(
											'w-full h-[35px] px-4 pr-10 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black focus:outline-none focus:ring-2 focus:ring-gray-400',
											{
												'border-red-500 bg-red-50': errors.achieveDate && touched.achieveDate,
											}
										)}
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
								value={formData.title}
								onChange={(e) => {
									setFormData({
										...formData,
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
								value={formData.description}
								onChange={(e) =>
									setFormData({
										...formData,
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

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" onClick={() => setShowDeleteModal(false)}>
					{/* Backdrop with blur effect */}
					<div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"></div>
					
					{/* Modal Content */}
					<div 
						className="bg-white rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200 w-[600px] h-[319px] relative z-[9999] flex flex-col"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header with Back Button */}
						<div className="px-8 pt-6 pb-4">
							<button
								onClick={() => setShowDeleteModal(false)}
								className="flex items-center text-black font-normal text-base hover:opacity-70 transition-opacity"
							>
								<span className="font-light">&lt;</span>
								<span className="ml-1">Back</span>
							</button>
						</div>

						{/* Content */}
						<div className="flex-1 px-8 flex flex-col">
							{/* Title */}
							<h2 className="text-[20px] font-semibold text-black mb-6">
								Delete Achievement
							</h2>

							{/* Warning Message */}
							<div className="text-[16px] font-normal text-black leading-6 mb-auto">
								<p>This action cannot be undone.</p>
								<p>
									Are you sure you want to delete the achievement of{' '}
									<span className="font-bold">{achievement?.familyMember.fullName || ''}</span> ?
								</p>
							</div>

							{/* Footer Buttons */}
							<div className="flex justify-end items-center space-x-4 pb-6 pt-4">
								<button
									onClick={() => setShowDeleteModal(false)}
									disabled={isDeleting}
									className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									onClick={handleDelete}
									disabled={isDeleting}
									className="w-[123px] h-[40px] bg-[#1f2937] text-white rounded-[10px] font-normal text-sm hover:bg-[#111827] transition-colors flex items-center justify-center disabled:opacity-50"
								>
									{isDeleting ? 'Deleting...' : 'Delete'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

