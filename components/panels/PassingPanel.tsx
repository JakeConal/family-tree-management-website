'use client';

import { X, ChevronLeft, Calendar, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';

import LoadingScreen from '@/components/LoadingScreen';
import { FamilyMember } from '@/types';

interface BurialPlace {
	id?: number;
	location: string;
	startDate: string;
	endDate?: string | null;
}

interface PassingRecord {
	id: number;
	dateOfPassing: Date;
	familyMember: {
		id: number;
		fullName: string;
	};
	causeOfDeath: {
		id: number;
		causeName: string;
	} | null;
	buriedPlaces: BurialPlace[];
}

interface PassingPanelProps {
	mode: 'add' | 'view' | 'edit';
	passingRecordId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
	onSuccess: () => void;
}

export default function PassingPanel({
	mode,
	passingRecordId,
	familyTreeId,
	familyMembers,
	onModeChange,
	onClose,
	onSuccess,
}: PassingPanelProps) {
	const [passingRecord, setPassingRecord] = useState<PassingRecord | null>(null);
	const [loading, setLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		familyMemberId: '',
		dateOfPassing: '',
		causesOfDeath: [''] as string[],
		burialPlaces: [{ location: '', startDate: '' }] as BurialPlace[],
	});

	const [selectedMemberBirthDate, setSelectedMemberBirthDate] = useState<string>('');

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const fetchPassingRecord = useCallback(async () => {
		if (!passingRecordId) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/family-trees/${familyTreeId}/passing-records/${passingRecordId}`);
			if (res.ok) {
				const data = await res.json();
				setPassingRecord(data);

				// Populate form data
				setFormData({
					familyMemberId: data.familyMember.id.toString(),
					dateOfPassing: data.dateOfPassing ? new Date(data.dateOfPassing).toISOString().split('T')[0] : '',
					causesOfDeath: data.causeOfDeath ? [data.causeOfDeath.causeName] : [''],
					burialPlaces:
						data.buriedPlaces.length > 0
							? data.buriedPlaces.map((place: BurialPlace) => ({
									id: place.id,
									location: place.location,
									startDate: place.startDate ? new Date(place.startDate).toISOString().split('T')[0] : '',
									endDate: place.endDate ? new Date(place.endDate).toISOString().split('T')[0] : '',
								}))
							: [{ location: '', startDate: '' }],
				});

				// Set member birth date for validation
				const member = familyMembers.find((m) => m.id === data.familyMember.id);
				if (member?.birthday) {
					setSelectedMemberBirthDate(new Date(member.birthday).toISOString().split('T')[0]);
				}
			}
		} catch (error) {
			console.error('Error fetching passing record:', error);
			toast.error('Failed to load passing record');
		} finally {
			setLoading(false);
		}
	}, [passingRecordId, familyTreeId, familyMembers]);

	useEffect(() => {
		if (mode !== 'add' && passingRecordId) {
			fetchPassingRecord();
		} else {
			// Reset form for add mode
			setFormData({
				familyMemberId: '',
				dateOfPassing: '',
				causesOfDeath: [''],
				burialPlaces: [{ location: '', startDate: '' }],
			});
			setPassingRecord(null);
		}
	}, [mode, passingRecordId, fetchPassingRecord]);

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
		const hasValidCause = formData.causesOfDeath.some((cause) => cause.trim() !== '');

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
		const hasValidPlace = formData.burialPlaces.some(
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
		if (formData.dateOfPassing && selectedMemberBirthDate && formData.dateOfPassing <= selectedMemberBirthDate) {
			newErrors.dateOfPassing = 'Date of passing must be after the birth date';
			hasDateErrors = true;
		} else {
			delete newErrors.dateOfPassing;
		}

		// Validate burial dates
		formData.burialPlaces.forEach((place, index) => {
			if (place.startDate && formData.dateOfPassing && place.startDate < formData.dateOfPassing) {
				newErrors[`burialPlaces_${index}_startDate`] = `Burial start date must be on or after the date of passing`;
				hasDateErrors = true;
			} else {
				delete newErrors[`burialPlaces_${index}_startDate`];
			}
		});

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

	const addCauseOfDeath = () => {
		if (formData.causesOfDeath.length < 12) {
			setFormData({
				...formData,
				causesOfDeath: [...formData.causesOfDeath, ''],
			});
		}
	};

	const updateCauseOfDeath = (index: number, value: string) => {
		const updatedCauses = [...formData.causesOfDeath];
		updatedCauses[index] = value;
		setFormData({
			...formData,
			causesOfDeath: updatedCauses,
		});
		if (errors.causesOfDeath) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors.causesOfDeath;
				return newErrors;
			});
		}
	};

	const removeCauseOfDeath = (index: number) => {
		if (formData.causesOfDeath.length <= 1) return;

		const updatedCauses = formData.causesOfDeath.filter((_, i) => i !== index);
		setFormData({
			...formData,
			causesOfDeath: updatedCauses,
		});
	};

	const addBurialPlace = () => {
		if (formData.burialPlaces.length < 3) {
			setFormData({
				...formData,
				burialPlaces: [...formData.burialPlaces, { location: '', startDate: '' }],
			});
		}
	};

	const updateBurialPlace = (index: number, field: keyof BurialPlace, value: string) => {
		const updatedPlaces = [...formData.burialPlaces];
		updatedPlaces[index] = { ...updatedPlaces[index], [field]: value };
		setFormData({
			...formData,
			burialPlaces: updatedPlaces,
		});

		if (errors.burialPlaces) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors.burialPlaces;
				return newErrors;
			});
		}
	};

	const removeBurialPlace = (index: number) => {
		if (formData.burialPlaces.length <= 1) return;

		const updatedPlaces = formData.burialPlaces.filter((_, i) => i !== index);
		setFormData({
			...formData,
			burialPlaces: updatedPlaces,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Mark all fields as touched
		const allFields = ['familyMemberId', 'dateOfPassing'];
		const newTouched = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
		setTouched(newTouched);

		// Validate all fields
		allFields.forEach((field) => {
			const value = formData[field as keyof typeof formData];
			validateField(field, value as string);
		});

		const causesValid = validateCausesOfDeath();
		const placesValid = validateBurialPlaces();
		const datesValid = validateDates();

		const hasErrors = Object.keys(errors).length > 0 || !causesValid || !placesValid || !datesValid;

		if (hasErrors) {
			return;
		}

		setIsSubmitting(true);

		try {
			const url =
				mode === 'add'
					? `/api/family-trees/${familyTreeId}/passing-records`
					: `/api/family-trees/${familyTreeId}/passing-records/${passingRecordId}`;

			const method = mode === 'add' ? 'POST' : 'PUT';

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					familyMemberId: parseInt(formData.familyMemberId),
					dateOfPassing: formData.dateOfPassing,
					causesOfDeath: formData.causesOfDeath.filter((c) => c.trim() !== ''),
					burialPlaces: formData.burialPlaces.filter((p) => p.location.trim() !== '' && p.startDate !== ''),
				}),
			});

			if (response.ok) {
				toast.success(mode === 'add' ? 'Passing record created successfully!' : 'Passing record updated successfully!');
				onSuccess();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || `Failed to ${mode === 'add' ? 'create' : 'update'} passing record`);
			}
		} catch (error) {
			console.error('Error saving passing record:', error);
			toast.error(`Failed to ${mode === 'add' ? 'create' : 'update'} passing record`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatDate = (dateString: string | Date | null) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	if (loading) {
		return (
			<div className="w-full h-full">
				<LoadingScreen message="Loading passing record..." />
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
					<h2 className="text-[26px] font-normal text-black text-center mb-10">Passing Record Details</h2>

					<div className="space-y-6">
						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Family Member *</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{passingRecord?.familyMember.fullName}
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Date of Passing *</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{formatDate(passingRecord?.dateOfPassing || '')}
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Cause of Passing *</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
								{passingRecord?.causeOfDeath?.causeName || 'Not specified'}
							</div>
						</div>

						<div>
							<label className="block text-base font-normal text-black mb-1.5 ml-1">Burial Places *</label>
							<div className="space-y-4">
								{passingRecord?.buriedPlaces.map((place, index) => (
									<div key={index} className="bg-[#dbeafe] border border-black/50 rounded-[15px] p-4 space-y-3">
										<div>
											<label className="block text-[11.584px] font-normal text-black mb-1.5">Location *</label>
											<div className="bg-[#eff6ff] border border-black/50 rounded-[29px] px-4 py-2 text-[11.584px] text-black">
												{place.location}
											</div>
										</div>
										<div>
											<label className="block text-[11.584px] font-normal text-black mb-1.5">Start Date *</label>
											<div className="bg-[#eff6ff] border border-black/50 rounded-[29px] px-4 py-2 text-[11.584px] text-black">
												{formatDate(place.startDate)}
											</div>
										</div>
									</div>
								))}
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
						{isAddMode ? 'Add Passing Record' : 'Edit Passing Record'}
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

						{/* Date of Passing */}
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">Date Of Passing *</label>
							<div className="relative">
								<input
									type="date"
									value={formData.dateOfPassing}
									onChange={(e) => {
										setFormData({
											...formData,
											dateOfPassing: e.target.value,
										});
										handleFieldChange('dateOfPassing');
									}}
									onBlur={() => validateField('dateOfPassing', formData.dateOfPassing)}
									className={classNames(
										'w-full h-[35px] px-4 pr-10 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black focus:outline-none focus:ring-2 focus:ring-gray-400',
										{
											'border-red-500 bg-red-50': errors.dateOfPassing && touched.dateOfPassing,
										}
									)}
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
									disabled={formData.causesOfDeath.length >= 12}
									className="flex items-center justify-center w-[92px] h-[24px] bg-white border border-black/50 rounded-[20px] text-[12px] text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									<Plus className="w-3 h-3 mr-1" />
									<span>Add Cause</span>
								</button>
							</div>
							{formData.causesOfDeath.length > 0 && (
								<div className="space-y-2">
									{formData.causesOfDeath.map((cause, index) => (
										<div key={index} className="relative flex items-center">
											<input
												type="text"
												value={cause}
												onChange={(e) => updateCauseOfDeath(index, e.target.value)}
												placeholder="e.g. old age"
												className={`w-full h-[35px] px-4 bg-[#f3f2f2] border border-black/50 rounded-[30px] text-[12px] text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-gray-400 ${
													formData.causesOfDeath.length > 1 ? 'pr-10' : ''
												}`}
											/>
											{formData.causesOfDeath.length > 1 && (
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
									disabled={formData.burialPlaces.length >= 3}
									className="flex items-center justify-center w-[92px] h-[24px] bg-white border border-black/50 rounded-[20px] text-[12px] text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									<Plus className="w-3 h-3 mr-1" />
									<span>Add Place</span>
								</button>
							</div>
							{formData.burialPlaces.length > 0 && (
								<div className="space-y-4">
									{formData.burialPlaces.map((place, index) => (
										<div key={index} className="relative p-4 bg-[#dbeafe] border border-black/50 rounded-[15px]">
											{formData.burialPlaces.length > 1 && (
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

