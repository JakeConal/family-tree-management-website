'use client';

import classNames from 'classnames';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Skull, ArrowLeft, Calendar, Check, Plus, AlertTriangle, Trash2 } from 'lucide-react';

interface FamilyMember {
	id: number;
	fullName: string;
	gender: string;
	birthday: string;
}

interface BurialPlace {
	location: string;
	startDate: string;
	endDate: string;
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
				burialPlaces: [{ location: '', startDate: '', endDate: '' }], // Start with one empty burial place
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

			// Validate burial end date is after start date
			if (place.endDate && place.startDate && place.endDate <= place.startDate) {
				newErrors[`burialPlaces_${index}_endDate`] = `Burial end date must be after the start date`;
				hasDateErrors = true;
			} else {
				delete newErrors[`burialPlaces_${index}_endDate`];
			}

			// Validate consecutive burial places: current start date must be after previous end date
			if (index > 0) {
				const previousPlace = passingFormData.burialPlaces[index - 1];
				if (place.startDate && previousPlace.endDate && place.startDate <= previousPlace.endDate) {
					newErrors[`burialPlaces_${index}_startDate`] =
						`Start date must be after the end date of the previous burial place`;
					hasDateErrors = true;
				} else if (place.startDate && !previousPlace.endDate) {
					newErrors[`burialPlaces_${index}_startDate`] = `Previous burial place must have an end date`;
					hasDateErrors = true;
				}
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
				burialPlaces: [...passingFormData.burialPlaces, { location: '', startDate: '', endDate: '' }],
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
			<div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<button onClick={onClose} className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
						<ArrowLeft className="w-5 h-5 mr-2" />
						<span className="font-medium">Back</span>
					</button>
					<div className="flex items-center">
						<div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
							<Skull className="w-5 h-5 text-gray-600" />
						</div>
						<h2 className="text-xl font-semibold text-gray-900">Record Passing</h2>
					</div>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Form Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-140px)]">
					<form onSubmit={handleSubmit} className="p-6 space-y-6">
						{/* Family Member Selection */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Family Member <span className="text-red-500">*</span>
							</label>
							<select
								value={passingFormData.familyMemberId}
								onChange={(e) => {
									const selectedId = e.target.value;
									const selectedMember = existingMembers.find((member) => member.id.toString() === selectedId);

									setPassingFormData({
										...passingFormData,
										familyMemberId: selectedId,
									});
									setSelectedMemberBirthDate(selectedMember?.birthday || '');
									handleFieldChange('familyMemberId', selectedId);
								}}
								onBlur={() => validateField('familyMemberId', passingFormData.familyMemberId)}
								className={classNames(
									'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
									{
										'border-red-500 bg-red-50': errors.familyMemberId && touched.familyMemberId,
										'border-gray-300': !(errors.familyMemberId && touched.familyMemberId),
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
							{errors.familyMemberId && touched.familyMemberId && (
								<p className="mt-1 text-sm text-red-600">{errors.familyMemberId}</p>
							)}
						</div>

						{/* Date of Passing */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Date of Passing <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<input
									type="date"
									value={passingFormData.dateOfPassing}
									onChange={(e) => {
										setPassingFormData({
											...passingFormData,
											dateOfPassing: e.target.value,
										});
										handleFieldChange('dateOfPassing', e.target.value);
									}}
									onBlur={() => validateField('dateOfPassing', passingFormData.dateOfPassing)}
									className={classNames(
										'w-full px-3 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
										{
											'border-red-500 bg-red-50': errors.dateOfPassing && touched.dateOfPassing,
											'border-gray-300': !(errors.dateOfPassing && touched.dateOfPassing),
										}
									)}
									placeholder="MM/DD/YYYY"
									data-error={errors.dateOfPassing && touched.dateOfPassing ? 'true' : 'false'}
								/>
								<Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
							</div>
							{errors.dateOfPassing && touched.dateOfPassing && (
								<p className="mt-1 text-sm text-red-600">{errors.dateOfPassing}</p>
							)}
						</div>

						{/* Cause of Passing */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="block text-sm font-medium text-gray-700">
									Cause of Passing <span className="text-red-500">*</span>
								</label>
								<button
									type="button"
									onClick={addCauseOfDeath}
									disabled={passingFormData.causesOfDeath.length >= 12}
									className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
								>
									<Plus className="w-4 h-4 mr-1" />
									Add Cause
								</button>
							</div>
							{passingFormData.causesOfDeath.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<p>No causes added yet. Click "Add Cause" to add a cause of passing.</p>
								</div>
							) : (
								<div className="space-y-3">
									{passingFormData.causesOfDeath.map((cause, index) => (
										<div key={index} className="flex items-center space-x-2">
											<input
												type="text"
												value={cause}
												onChange={(e) => updateCauseOfDeath(index, e.target.value)}
												placeholder="e.g. old age"
												className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												required
											/>
											{passingFormData.causesOfDeath.length > 1 && (
												<button
													type="button"
													onClick={() => removeCauseOfDeath(index)}
													className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</div>
						{errors.causesOfDeath && <p className="mt-2 text-sm text-red-600">{errors.causesOfDeath}</p>}
						<p className="text-xs text-gray-500 mt-2">Maximum 12 causes of death per record</p>

						{/* Burial Places */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<label className="block text-sm font-medium text-gray-700">
									Burial Places <span className="text-red-500">*</span>
								</label>
								<button
									type="button"
									onClick={addBurialPlace}
									disabled={passingFormData.burialPlaces.length >= 3}
									className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
								>
									<Plus className="w-4 h-4 mr-1" />
									Add Place
								</button>
							</div>
							{passingFormData.burialPlaces.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<p>No burial places added yet. Click "Add Place" to add a burial location.</p>
								</div>
							) : (
								<div className="space-y-4">
									{passingFormData.burialPlaces.map((place, index) => (
										<div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
											<div className="flex items-center justify-between">
												<h4 className="text-sm font-medium text-gray-700">Burial Place {index + 1}</h4>
												{passingFormData.burialPlaces.length > 1 && (
													<button
														type="button"
														onClick={() => removeBurialPlace(index)}
														className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												)}
											</div>
											<div>
												<label className="block text-xs font-medium text-gray-600 mb-1">Location*</label>
												<input
													type="text"
													value={place.location}
													onChange={(e) => updateBurialPlace(index, 'location', e.target.value)}
													placeholder="Enter location"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													required
												/>
											</div>
											<div className="grid grid-cols-2 gap-3">
												<div>
													<label className="block text-xs font-medium text-gray-600 mb-1">Start Date*</label>
													<div className="relative">
														<input
															type="date"
															value={place.startDate}
															onChange={(e) => updateBurialPlace(index, 'startDate', e.target.value)}
															className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
															placeholder="MM/DD/YYYY"
															required
														/>
														<Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
													</div>
													{errors[`burialPlaces_${index}_startDate`] && (
														<p className="mt-1 text-xs text-red-600">{errors[`burialPlaces_${index}_startDate`]}</p>
													)}
												</div>
												<div>
													<label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
													<div className="relative">
														<input
															type="date"
															value={place.endDate}
															onChange={(e) => updateBurialPlace(index, 'endDate', e.target.value)}
															className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
															placeholder="MM/DD/YYYY"
														/>
														<Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
													</div>
													{errors[`burialPlaces_${index}_endDate`] && (
														<p className="mt-1 text-xs text-red-600">{errors[`burialPlaces_${index}_endDate`]}</p>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
						{errors.burialPlaces && <p className="mt-2 text-sm text-red-600">{errors.burialPlaces}</p>}
						<p className="text-xs text-gray-500 mt-2">Maximum 3 burial places per record</p>

						{/* Important Notice */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="flex items-start">
								<AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
								<div>
									<h3 className="text-sm font-medium text-blue-800 mb-1">Important</h3>
									<p className="text-sm text-blue-700">
										The Family Member selected for this record cannot be changed once saved. Furthermore, this record is
										permanent and cannot be deleted.
									</p>
								</div>
							</div>
						</div>

						{/* Error Message */}
						{Object.keys(errors).length > 0 && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
								<p className="text-sm font-medium text-red-800">Please check your information</p>
							</div>
						)}

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
								disabled={isSubmitting || !isFormValid()}
								className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Saving...
									</>
								) : (
									<>
										<Check className="w-4 h-4 mr-2" />
										Save
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
