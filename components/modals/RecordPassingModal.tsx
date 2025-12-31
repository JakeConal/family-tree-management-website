'use client';

import { ChevronDown, Calendar, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { FamilyMember } from '@/types';

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
		familyMemberId: '',
		dateOfPassing: '',
		causesOfDeath: [] as string[],
		burialPlaces: [] as BurialPlace[],
	});

	const [selectedMemberBirthDate, setSelectedMemberBirthDate] = useState<string>('');

	const [isSubmitting, setIsSubmitting] = useState(false);

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setPassingFormData({
				familyMemberId: '',
				dateOfPassing: '',
				causesOfDeath: [''], // Start with one empty cause of death
				burialPlaces: [{ location: '', startDate: '' }], // Start with one empty burial place
			});
			setSelectedMemberBirthDate('');
			setErrors({});
			setTouched({});
			setIsSubmitting(false);
		}
	}, [isOpen]);

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Mark all fields as touched to show validation errors
		const allFields = ['familyMemberId', 'dateOfPassing'];
		const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
		setTouched(newTouched);

		// Validate all fields
		allFields.forEach((field) => {
			const value = passingFormData[field as keyof typeof passingFormData];
			validateField(field, value as string);
		});

		const causesValid = validateCausesOfDeath();
		const placesValid = validateBurialPlaces();
		const datesValid = validateDates();

		// Check if all validations pass
		const hasErrors = Object.keys(errors).length > 0 || !causesValid || !placesValid || !datesValid;

		if (hasErrors) {
			// Scroll to first error
			const firstErrorField = document.querySelector('[data-error="true"]');
			if (firstErrorField) {
				firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
			return;
		}

		// Check if family member already has a passing record
		if (passingFormData.familyMemberId) {
			const hasExistingRecord = await checkExistingPassingRecord(passingFormData.familyMemberId);
			if (hasExistingRecord) {
				setErrors((prev) => ({
					...prev,
					familyMemberId:
						'This family member already has a passing record. Each person can only have one passing record.',
				}));
				return;
			}
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/passing-records`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					familyMemberId: parseInt(passingFormData.familyMemberId),
					dateOfPassing: passingFormData.dateOfPassing,
					causesOfDeath: passingFormData.causesOfDeath,
					burialPlaces: passingFormData.burialPlaces,
				}),
			});

			if (response.ok) {
				toast.success('Passing record created successfully!');
				onPassingRecorded();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to record passing');
			}
		} catch (error) {
			console.error('Error recording passing:', error);
			toast.error('Failed to record passing');
		} finally {
			setIsSubmitting(false);
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
			case 'dateOfPassing':
				if (!value) {
					newErrors.dateOfPassing = 'Date of passing is required';
				} else {
					delete newErrors.dateOfPassing;
				}
				break;
		}

		setErrors(newErrors);
	};

	const validateCausesOfDeath = () => {
		const newErrors = { ...errors };
		const hasValidCause = passingFormData.causesOfDeath.some((cause) => cause.trim() !== '');

		if (!hasValidCause) {
			newErrors.causesOfDeath = 'At least one cause of passing is required';
		} else {
			delete newErrors.causesOfDeath;
		}

		setErrors(newErrors);
		return hasValidCause;
	};

	const validateBurialPlaces = () => {
		const newErrors = { ...errors };
		const hasValidPlace = passingFormData.burialPlaces.some(
			(place) => place.location.trim() !== '' && place.startDate !== ''
		);

		if (!hasValidPlace) {
			newErrors.burialPlaces = 'At least one burial place with location and start date is required';
		} else {
			delete newErrors.burialPlaces;
		}

		setErrors(newErrors);
		return hasValidPlace;
	};

	const validateDates = () => {
		const newErrors = { ...errors };
		let hasDateErrors = false;

		// Validate date of passing is after birth date
		if (
			passingFormData.dateOfPassing &&
			selectedMemberBirthDate &&
			passingFormData.dateOfPassing <= selectedMemberBirthDate
		) {
			newErrors.dateOfPassing = 'Date of passing must be after the birth date';
			hasDateErrors = true;
		} else {
			delete newErrors.dateOfPassing;
		}

		// Validate burial dates
		passingFormData.burialPlaces.forEach((place, index) => {
			// Validate burial start date is on or after date of passing
			if (place.startDate && passingFormData.dateOfPassing && place.startDate < passingFormData.dateOfPassing) {
				newErrors[`burialPlaces_${index}_startDate`] = `Burial start date must be on or after the date of passing`;
				hasDateErrors = true;
			} else {
				delete newErrors[`burialPlaces_${index}_startDate`];
			}
		});

		setErrors(newErrors);
		return !hasDateErrors;
	};

	const checkExistingPassingRecord = async (familyMemberId: string) => {
		try {
			const response = await fetch(`/api/family-trees/${familyTreeId}/passing-records/check/${familyMemberId}`);
			const data = await response.json();
			return data.hasRecord;
		} catch (error) {
			console.error('Error checking existing passing record:', error);
			return false;
		}
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

	const addCauseOfDeath = () => {
		if (passingFormData.causesOfDeath.length < 12) {
			setPassingFormData({
				...passingFormData,
				causesOfDeath: [...passingFormData.causesOfDeath, ''],
			});
		}
	};

	const updateCauseOfDeath = (index: number, value: string) => {
		const updatedCauses = [...passingFormData.causesOfDeath];
		updatedCauses[index] = value;
		setPassingFormData({
			...passingFormData,
			causesOfDeath: updatedCauses,
		});
		// Clear causes of death error when user makes changes
		if (errors.causesOfDeath) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors.causesOfDeath;
				return newErrors;
			});
		}
	};

	const removeCauseOfDeath = (index: number) => {
		// Don't allow removing the last cause of death
		if (passingFormData.causesOfDeath.length <= 1) return;

		const updatedCauses = passingFormData.causesOfDeath.filter((_, i) => i !== index);
		setPassingFormData({
			...passingFormData,
			causesOfDeath: updatedCauses,
		});
	};

	const addBurialPlace = () => {
		if (passingFormData.burialPlaces.length < 3) {
			setPassingFormData({
				...passingFormData,
				burialPlaces: [...passingFormData.burialPlaces, { location: '', startDate: '' }],
			});
		}
	};

	const updateBurialPlace = (index: number, field: keyof BurialPlace, value: string) => {
		const updatedPlaces = [...passingFormData.burialPlaces];
		updatedPlaces[index] = { ...updatedPlaces[index], [field]: value };
		setPassingFormData({
			...passingFormData,
			burialPlaces: updatedPlaces,
		});

		// Clear burial places error when user makes changes
		if (errors.burialPlaces) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors.burialPlaces;
				return newErrors;
			});
		}
	};

	const removeBurialPlace = (index: number) => {
		// Don't allow removing the last burial place
		if (passingFormData.burialPlaces.length <= 1) return;

		const updatedPlaces = passingFormData.burialPlaces.filter((_, i) => i !== index);
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
			passingFormData.causesOfDeath.every((cause) => cause.trim() !== '') &&
			passingFormData.burialPlaces.length > 0 &&
			passingFormData.burialPlaces.every((place) => place.location.trim() !== '' && place.startDate !== '')
		);
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
					<button
						onClick={onClose}
						className="flex items-center text-black hover:text-gray-600 transition-colors mb-6"
					>
						<span className="font-light mr-1">&lt;</span>
						<span className="font-normal">Back</span>
					</button>

					{/* Passing Icon */}
					<div className="flex justify-center mb-4">
						<div className="w-[50px] h-[50px] bg-white border-[1.5px] border-black rounded-[15px] flex items-center justify-center">
							<Image src="/icons/passing.png" alt="Passing" width={20} height={20} />
						</div>
					</div>

					{/* Title */}
					<h2 className="text-[26px] font-normal text-black text-center">Edit Passing Information</h2>
				</div>

				{/* Form Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-220px)]">
					<form onSubmit={handleSubmit} className="px-[69px] pb-8 space-y-5">
						{/* Family Member Selection */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Family Member *</label>
							<div className="relative">
								<select
									value={passingFormData.familyMemberId}
									onChange={(e) => {
										const selectedId = e.target.value;
										const selectedMember = existingMembers.find((member) => member.id.toString() === selectedId);

										setPassingFormData({
											...passingFormData,
											familyMemberId: selectedId,
										});
										setSelectedMemberBirthDate(
											selectedMember?.birthday ? selectedMember.birthday.toISOString().split('T')[0] : ''
										);
										handleFieldChange('familyMemberId');
									}}
									onBlur={() => validateField('familyMemberId', passingFormData.familyMemberId)}
									className="w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
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

						{/* Date of Passing */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Date Of Passing *</label>
							<div className="relative">
								<input
									type="date"
									value={passingFormData.dateOfPassing}
									onChange={(e) => {
										setPassingFormData({
											...passingFormData,
											dateOfPassing: e.target.value,
										});
										handleFieldChange('dateOfPassing');
									}}
									onBlur={() => validateField('dateOfPassing', passingFormData.dateOfPassing)}
									className="w-full h-[35px] px-4 pr-10 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
									data-error={errors.dateOfPassing && touched.dateOfPassing ? 'true' : 'false'}
								/>
								<Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
							</div>
							{errors.dateOfPassing && touched.dateOfPassing && (
								<p className="mt-1 text-sm text-red-600">{errors.dateOfPassing}</p>
							)}
						</div>

						{/* Cause of Passing */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="block text-[16px] font-normal text-black">Cause Of Passing *</label>
								<button
									type="button"
									onClick={addCauseOfDeath}
									disabled={passingFormData.causesOfDeath.length >= 12}
									className="flex items-center justify-center w-[92px] h-[24px] bg-white border border-black/50 rounded-[20px] text-[12px] text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									<Plus className="w-3 h-3 mr-1" />
									<span>Add Cause</span>
								</button>
							</div>
							{passingFormData.causesOfDeath.length > 0 && (
								<div className="space-y-2">
									{passingFormData.causesOfDeath.map((cause, index) => (
										<div key={index} className="relative flex items-center">
											<input
												type="text"
												value={cause}
												onChange={(e) => updateCauseOfDeath(index, e.target.value)}
												placeholder="e.g. old age"
												className={`w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
													passingFormData.causesOfDeath.length > 1 ? 'pr-10' : ''
												}`}
											/>
											{passingFormData.causesOfDeath.length > 1 && (
												<button
													type="button"
													onClick={() => removeCauseOfDeath(index)}
													className="absolute right-3 text-red-500 hover:text-red-700 transition-colors"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
									))}
								</div>
							)}
							{errors.causesOfDeath && <p className="mt-2 text-sm text-red-600">{errors.causesOfDeath}</p>}
						</div>

						{/* Burial Places */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="block text-[16px] font-normal text-black">Burial Places *</label>
								<button
									type="button"
									onClick={addBurialPlace}
									disabled={passingFormData.burialPlaces.length >= 3}
									className="flex items-center justify-center w-[92px] h-[24px] bg-white border border-black/50 rounded-[20px] text-[12px] text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									<Plus className="w-3 h-3 mr-1" />
									<span>Add Place</span>
								</button>
							</div>
							{passingFormData.burialPlaces.length > 0 && (
								<div className="space-y-4">
									{passingFormData.burialPlaces.map((place, index) => (
										<div key={index} className="relative p-4 bg-[#dbeafe] border border-black/50 rounded-[15px]">
											{passingFormData.burialPlaces.length > 1 && (
												<button
													type="button"
													onClick={() => removeBurialPlace(index)}
													className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}

											{/* Location */}
											<div className="mb-3">
												<label className="block text-[11.584px] font-normal text-black mb-1.5">Location *</label>
												<input
													type="text"
													value={place.location}
													onChange={(e) => updateBurialPlace(index, 'location', e.target.value)}
													placeholder="Enter location"
													className="w-full h-[34px] px-4 bg-[#eff6ff] border border-black/50 rounded-[29px] text-[11.584px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400"
												/>
											</div>

											{/* Start Date */}
											<div>
												<label className="block text-[11.584px] font-normal text-black mb-1.5">Start Date *</label>
												<div className="relative">
													<input
														type="date"
														value={place.startDate}
														onChange={(e) => updateBurialPlace(index, 'startDate', e.target.value)}
														className="w-full h-[34px] px-4 pr-10 bg-[#eff6ff] border border-black/50 rounded-[29px] text-[11.584px] text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
													/>
													<Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50 pointer-events-none" />
												</div>
												{errors[`burialPlaces_${index}_startDate`] && (
													<p className="mt-1 text-xs text-red-600">{errors[`burialPlaces_${index}_startDate`]}</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
							{errors.burialPlaces && <p className="mt-2 text-sm text-red-600">{errors.burialPlaces}</p>}
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
