'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { X, Camera, Plus, Info, ArrowLeft, User, Heart } from 'lucide-react';
import { PlaceOfOriginForm, OccupationForm, FamilyMember } from '@/types';

interface AddMemberModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	existingMembers: FamilyMember[];
	onMemberAdded: () => void;
	selectedMemberId?: string;
}

export default function AddMemberModal({
	isOpen,
	onClose,
	familyTreeId,
	existingMembers,
	onMemberAdded,
	selectedMemberId,
}: AddMemberModalProps) {
	const [memberFormData, setMemberFormData] = useState({
		fullName: '',
		gender: '',
		birthDate: '',
		address: '',
		relatedMemberId: '',
		relationship: '',
		relationshipDate: '',
	});
	const [placesOfOrigin, setPlacesOfOrigin] = useState<PlaceOfOriginForm[]>([
		{ id: 1, location: '', startDate: '', endDate: '' },
	]);
	const [occupations, setOccupations] = useState<OccupationForm[]>([{ id: 1, title: '', startDate: '', endDate: '' }]);
	const [profilePicture, setProfilePicture] = useState<File | null>(null);
	const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
	const [confirmAccuracy, setConfirmAccuracy] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Validation state
	const [validationErrors, setValidationErrors] = useState({
		fullName: '',
		gender: '',
		birthDate: '',
		address: '',
		relatedMemberId: '',
		relationship: '',
		relationshipDate: '',
		placesOfOrigin: '',
		occupations: '',
	});
	const [generalError, setGeneralError] = useState('');

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			let initialRelationship = '';
			let initialRelatedMemberId = '';

			if (selectedMemberId) {
				if (selectedMemberId.includes(',')) {
					// Adding child to spouse pair - use first spouse as parent
					initialRelatedMemberId = selectedMemberId.split(',')[0];
					initialRelationship = 'child';
				} else {
					// Adding to single member
					initialRelatedMemberId = selectedMemberId;
					initialRelationship = 'child'; // Default to child, user can change
				}
			}

			setMemberFormData({
				fullName: '',
				gender: '',
				birthDate: '',
				address: '',
				relatedMemberId: initialRelatedMemberId,
				relationship: initialRelationship,
				relationshipDate: '',
			});
			setPlacesOfOrigin([{ id: '1', location: '', startDate: '', endDate: '' }]);
			setOccupations([{ id: '1', title: '', startDate: '', endDate: '' }]);
			setProfilePicture(null);
			setProfilePicturePreview(null);
			setConfirmAccuracy(false);
			setIsSubmitting(false);
		}
	}, [isOpen, selectedMemberId]);

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

	// Validation function
	const validateForm = () => {
		const errors = {
			fullName: '',
			gender: '',
			birthDate: '',
			address: '',
			relatedMemberId: '',
			relationship: '',
			relationshipDate: '',
			placesOfOrigin: '',
			occupations: '',
		};

		if (!memberFormData.fullName.trim()) {
			errors.fullName = 'Full name is required';
		}
		if (!memberFormData.gender) {
			errors.gender = 'Gender is required';
		}
		if (!memberFormData.birthDate) {
			errors.birthDate = 'Birth date is required';
		}
		if (!memberFormData.address.trim()) {
			errors.address = 'Address is required';
		}
		if (!memberFormData.relatedMemberId) {
			errors.relatedMemberId = 'Related member is required';
		}
		if (!memberFormData.relationship) {
			errors.relationship = 'Relationship is required';
		}
		if (!memberFormData.relationshipDate) {
			errors.relationshipDate = 'Relationship date is required';
		} else if (memberFormData.birthDate && memberFormData.relationship) {
			const birthDate = new Date(memberFormData.birthDate);
			const relationshipDate = new Date(memberFormData.relationshipDate);

			if (memberFormData.relationship === 'parent') {
				// Parent relationship: relationship date must be >= birth date
				if (relationshipDate < birthDate) {
					errors.relationshipDate = 'Relationship date must be on or after birth date';
				}
			} else if (memberFormData.relationship === 'spouse') {
				// Spouse relationship: relationship date must be >= birth date + 7 years
				const minSpouseDate = new Date(birthDate);
				minSpouseDate.setFullYear(minSpouseDate.getFullYear() + 7);

				if (relationshipDate < minSpouseDate) {
					errors.relationshipDate = 'Relationship date must be at least 7 years after birth date';
				}
			}
		}

		// Check if at least one place of origin is filled and has required start date
		const hasValidPlaceOfOrigin = placesOfOrigin.some((place) => place.location.trim() !== '');
		if (!hasValidPlaceOfOrigin) {
			errors.placesOfOrigin = 'At least one place of origin is required';
		} else {
			// Check that places with location also have start date
			const invalidPlaces = placesOfOrigin.filter((place) => place.location.trim() !== '' && !place.startDate);
			if (invalidPlaces.length > 0) {
				errors.placesOfOrigin = 'Places of origin must have start dates';
			} else {
				// Check that start dates are after birth date
				const invalidBirthDatePlaces = placesOfOrigin.filter(
					(place) =>
						place.location.trim() !== '' &&
						place.startDate &&
						memberFormData.birthDate &&
						place.startDate < memberFormData.birthDate
				);
				if (invalidBirthDatePlaces.length > 0) {
					errors.placesOfOrigin = 'Place of origin start dates must be after birth date';
				} else {
					// Check consecutive places date constraints
					for (let i = 1; i < placesOfOrigin.length; i++) {
						const currentPlace = placesOfOrigin[i];
						const previousPlace = placesOfOrigin[i - 1];

						if (currentPlace.location.trim() && currentPlace.startDate) {
							if (!previousPlace.endDate) {
								errors.placesOfOrigin = 'Previous place of origin must have an end date';
								break;
							} else if (currentPlace.startDate <= previousPlace.endDate) {
								errors.placesOfOrigin = 'Start date must be after the end date of the previous place';
								break;
							}
						}
					}
				}
			}
		}

		// Check occupations
		const hasValidOccupation = occupations.some((occ) => occ.title.trim() !== '');
		if (!hasValidOccupation) {
			errors.occupations = 'At least one occupation is required';
		} else {
			// Check that occupations with title also have start date
			const invalidOccupations = occupations.filter((occ) => occ.title.trim() !== '' && !occ.startDate);
			if (invalidOccupations.length > 0) {
				errors.occupations = 'Occupations must have start dates';
			} else {
				// Check that start dates are after birth date
				const invalidBirthDateOccupations = occupations.filter(
					(occ) =>
						occ.title.trim() !== '' &&
						occ.startDate &&
						memberFormData.birthDate &&
						occ.startDate < memberFormData.birthDate
				);
				if (invalidBirthDateOccupations.length > 0) {
					errors.occupations = 'Occupation start dates must be after birth date';
				} else {
					// Check consecutive occupations date constraints
					for (let i = 1; i < occupations.length; i++) {
						const currentOccupation = occupations[i];
						const previousOccupation = occupations[i - 1];

						if (currentOccupation.title.trim() && currentOccupation.startDate) {
							if (!previousOccupation.endDate) {
								errors.occupations = 'Previous occupation must have an end date';
								break;
							} else if (currentOccupation.startDate <= previousOccupation.endDate) {
								errors.occupations = 'Start date must be after the end date of the previous occupation';
								break;
							}
						}
					}
				}
			}
		}

		setValidationErrors(errors);

		// Check if any errors
		return Object.values(errors).every((error) => error === '');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Clear any previous general error
		setGeneralError('');

		// Validate form
		if (!validateForm()) {
			setGeneralError('Please check your information');
			return;
		}

		if (!confirmAccuracy) {
			setGeneralError('Please check your information');
			return;
		}

		setIsSubmitting(true);

		try {
			const formData = new FormData();
			formData.append('fullName', memberFormData.fullName);
			formData.append('gender', memberFormData.gender);
			formData.append('birthday', memberFormData.birthDate);
			formData.append('address', memberFormData.address);
			formData.append('isAdopted', 'false');
			formData.append('familyTreeId', familyTreeId);

			if (memberFormData.relatedMemberId) {
				if (memberFormData.relationship === 'parent') {
					formData.append('parentId', memberFormData.relatedMemberId);
					if (memberFormData.relationshipDate) {
						formData.append('relationshipEstablishedDate', memberFormData.relationshipDate);
					}
				} else if (memberFormData.relationship === 'spouse') {
					formData.append('spouseId', memberFormData.relatedMemberId);
					if (memberFormData.relationshipDate) {
						formData.append('marriageDate', memberFormData.relationshipDate);
					}
				}
			}

			if (profilePicture) {
				formData.append('profilePicture', profilePicture);
			}

			const response = await fetch(`/api/family-members`, {
				method: 'POST',
				body: formData,
			});

			if (response.ok) {
				toast.success('Family member added successfully!');
				onMemberAdded();
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || 'Failed to add family member');
			}
		} catch (error) {
			console.error('Error adding member:', error);
			toast.error('Failed to add family member');
		} finally {
			setIsSubmitting(false);
		}
	};

	const addPlaceOfOrigin = () => {
		if (placesOfOrigin.length < 4) {
			setPlacesOfOrigin([
				...placesOfOrigin,
				{
					id: Date.now().toString(),
					location: '',
					startDate: '',
					endDate: '',
				},
			]);
		}
	};

	const removePlaceOfOrigin = (id: string | number) => {
		setPlacesOfOrigin(placesOfOrigin.filter((p) => p.id !== id));
	};

	const addOccupation = () => {
		if (occupations.length < 15) {
			setOccupations([
				...occupations,
				{
					id: Date.now().toString(),
					title: '',
					startDate: '',
					endDate: '',
				},
			]);
		}
	};

	const removeOccupation = (id: string | number) => {
		setOccupations(occupations.filter((o) => o.id !== id));
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
			if (!allowedTypes.includes(file.type)) {
				toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast.error('File size too large. Maximum size is 5MB.');
				return;
			}

			setProfilePicture(file);

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				setProfilePicturePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
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
						<User className="w-6 h-6 text-blue-600 mr-3" />
						<h2 className="text-xl font-semibold text-gray-900">Add New Family Member</h2>
					</div>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Form Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-140px)]">
					<form onSubmit={handleSubmit} className="p-6 space-y-8">
						{/* Personal Information Section */}
						<div>
							<div className="flex items-center mb-4">
								<User className="w-5 h-5 text-blue-600 mr-2" />
								<h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
							</div>

							{/* Full Name - Single Row */}
							<div className="mb-3">
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Full Name <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={memberFormData.fullName}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											fullName: e.target.value,
										});
									}}
									placeholder="Enter full name"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required
								/>
								{validationErrors.fullName && <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>}
							</div>

							{/* Birth Date and Gender - Same Row */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Birth Date <span className="text-red-500">*</span>
									</label>
									<input
										type="date"
										value={memberFormData.birthDate}
										onChange={(e) => {
											setMemberFormData({
												...memberFormData,
												birthDate: e.target.value,
											});
										}}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									/>
									{validationErrors.birthDate && (
										<p className="text-red-500 text-xs mt-1">{validationErrors.birthDate}</p>
									)}
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Gender <span className="text-red-500">*</span>
									</label>
									<select
										value={memberFormData.gender}
										onChange={(e) => {
											setMemberFormData({
												...memberFormData,
												gender: e.target.value,
											});
										}}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										required
									>
										<option value="">Select gender</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
									</select>
									{validationErrors.gender && <p className="text-red-500 text-xs mt-1">{validationErrors.gender}</p>}
								</div>
							</div>

							{/* Address - Single Row */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Address <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									value={memberFormData.address}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											address: e.target.value,
										});
									}}
									placeholder="Enter full address"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required
								/>
								{validationErrors.address && <p className="text-red-500 text-xs mt-1">{validationErrors.address}</p>}
							</div>

							{/* Places of Origin */}
							<div className="mt-6">
								<div className="flex items-center justify-between mb-3">
									<label className="block text-sm font-medium text-gray-700">
										Place of Origin <span className="text-red-500">*</span>
									</label>
									<button
										type="button"
										onClick={addPlaceOfOrigin}
										disabled={placesOfOrigin.length >= 4}
										className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
									>
										<Plus className="w-4 h-4 mr-1" />
										Add Place
									</button>
								</div>
								{validationErrors.placesOfOrigin && (
									<p className="text-red-500 text-xs mt-1 mb-3">{validationErrors.placesOfOrigin}</p>
								)}

								{placesOfOrigin.map((place, index) => (
									<div key={place.id} className="mb-3 p-4 bg-gray-50 rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-gray-700">Place {index + 1}</span>
											{placesOfOrigin.length > 1 && (
												<button
													type="button"
													onClick={() => removePlaceOfOrigin(place.id)}
													className="text-red-500 hover:text-red-700"
												>
													<X className="w-4 h-4" />
												</button>
											)}
										</div>

										<div className="space-y-3">
											<div>
												<select
													value={place.location}
													onChange={(e) => {
														const updated = placesOfOrigin.map((p) =>
															p.id === place.id ? { ...p, location: e.target.value } : p
														);
														setPlacesOfOrigin(updated);
													}}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												>
													<option value="">Select place of origin</option>
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

											<div className="grid grid-cols-2 gap-3">
												<div>
													<label className="block text-xs font-medium text-gray-600 mb-1">
														Start Date <span className="text-red-500">*</span>
													</label>
													<input
														type="date"
														value={place.startDate}
														onChange={(e) => {
															const updated = placesOfOrigin.map((p) =>
																p.id === place.id ? { ...p, startDate: e.target.value } : p
															);
															setPlacesOfOrigin(updated);
														}}
														placeholder="Start date"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
												</div>

												<div>
													<label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
													<input
														type="date"
														value={place.endDate}
														onChange={(e) => {
															const updated = placesOfOrigin.map((p) =>
																p.id === place.id ? { ...p, endDate: e.target.value } : p
															);
															setPlacesOfOrigin(updated);
														}}
														placeholder="End date (optional)"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
												</div>
											</div>
										</div>
									</div>
								))}

								<p className="text-xs text-gray-500 mt-2">Maximum 4 places of origin per person</p>
							</div>

							{/* Occupations */}
							<div className="mt-6">
								<div className="flex items-center justify-between mb-3">
									<label className="block text-sm font-medium text-gray-700">
										Occupation <span className="text-red-500">*</span>
									</label>
									<button
										type="button"
										onClick={addOccupation}
										disabled={occupations.length >= 15}
										className="flex items-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
									>
										<Plus className="w-4 h-4 mr-1" />
										Add Occupation
									</button>
								</div>
								{validationErrors.occupations && (
									<p className="text-red-500 text-xs mt-1 mb-3">{validationErrors.occupations}</p>
								)}

								{occupations.map((occupation, index) => (
									<div key={occupation.id} className="mb-3 p-4 bg-gray-50 rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<span className="text-sm font-medium text-gray-700">Occupation {index + 1}</span>
											{occupations.length > 1 && (
												<button
													type="button"
													onClick={() => removeOccupation(occupation.id)}
													className="text-red-500 hover:text-red-700"
												>
													<X className="w-4 h-4" />
												</button>
											)}
										</div>

										<div className="space-y-3">
											<div>
												<input
													type="text"
													value={occupation.title}
													onChange={(e) => {
														const updated = occupations.map((o) =>
															o.id === occupation.id ? { ...o, title: e.target.value } : o
														);
														setOccupations(updated);
													}}
													placeholder="e.g. Software Engineer"
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
												/>
											</div>

											<div className="grid grid-cols-2 gap-3">
												<div>
													<label className="block text-xs font-medium text-gray-600 mb-1">
														Start Date <span className="text-red-500">*</span>
													</label>
													<input
														type="date"
														value={occupation.startDate}
														onChange={(e) => {
															const updated = occupations.map((o) =>
																o.id === occupation.id ? { ...o, startDate: e.target.value } : o
															);
															setOccupations(updated);
														}}
														placeholder="Start date"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
												</div>

												<div>
													<label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
													<input
														type="date"
														value={occupation.endDate}
														onChange={(e) => {
															const updated = occupations.map((o) =>
																o.id === occupation.id ? { ...o, endDate: e.target.value } : o
															);
															setOccupations(updated);
														}}
														placeholder="End date (optional)"
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
													/>
												</div>
											</div>
										</div>
									</div>
								))}

								<p className="text-xs text-gray-500 mt-2">Maximum 15 occupations per person</p>
							</div>

							{/* Profile Picture */}
							<div className="mt-6">
								<label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture (optional)</label>

								{profilePicturePreview ? (
									<div className="flex items-center space-x-4">
										<Image
											src={profilePicturePreview}
											alt="Profile preview"
											width={80}
											height={80}
											className="rounded-lg object-cover"
										/>
										<button
											type="button"
											onClick={() => {
												setProfilePicture(null);
												setProfilePicturePreview(null);
											}}
											className="text-red-500 hover:text-red-700 text-sm"
										>
											Remove
										</button>
									</div>
								) : (
									<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
										<Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
										<p className="text-sm text-gray-600 mb-2">Click to upload profile picture</p>
										<input
											type="file"
											accept="image/*"
											onChange={handleFileUpload}
											className="hidden"
											id="profile-picture"
										/>
										<label
											htmlFor="profile-picture"
											className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm font-medium"
										>
											Choose file
										</label>
									</div>
								)}
							</div>
						</div>

						{/* Family Connection Section */}
						<div>
							<div className="flex items-center mb-4">
								<Heart className="w-5 h-5 text-red-600 mr-2" />
								<h3 className="text-lg font-semibold text-gray-900">Family Connection</h3>
							</div>

							{/* Related Family Member - Single Row */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Related Family Member <span className="text-red-500">*</span>
								</label>
								<select
									value={memberFormData.relatedMemberId}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											relatedMemberId: e.target.value,
										});
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required
								>
									<option value="">Select family member</option>
									{existingMembers.map((member) => (
										<option key={member.id} value={member.id}>
											{member.fullName}
										</option>
									))}
								</select>
								{validationErrors.relatedMemberId && (
									<p className="text-red-500 text-xs mt-1">{validationErrors.relatedMemberId}</p>
								)}
								<p className="text-xs text-gray-500 mt-1 mb-3">
									Choose the existing family member this person is related to
								</p>
							</div>

							{/* Relationship - Single Row */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Relationship <span className="text-red-500">*</span>
								</label>
								<select
									value={memberFormData.relationship}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											relationship: e.target.value,
										});
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required
								>
									<option value="">Select relationship</option>
									<option value="parent">Parent</option>
									<option value="spouse">Spouse</option>
								</select>
								{validationErrors.relationship && (
									<p className="text-red-500 text-xs mt-1">{validationErrors.relationship}</p>
								)}
								<p className="text-xs text-gray-500 mt-1 mb-3">
									Select how this person is related to the chosen family member
								</p>
							</div>

							{/* Relationship Established Date - Single Row */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Relationship Established Date <span className="text-red-500">*</span>
								</label>
								<input
									type="date"
									value={memberFormData.relationshipDate}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											relationshipDate: e.target.value,
										});
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									required
								/>
								{validationErrors.relationshipDate && (
									<p className="text-red-500 text-xs mt-1">{validationErrors.relationshipDate}</p>
								)}
								<p className="text-xs text-gray-500 mt-1">When did this relationship begin or get established?</p>
							</div>
						</div>

						{/* Confirmation */}
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<div className="flex items-start">
								<Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 shrink-0" />
								<div>
									<h4 className="text-sm font-semibold text-blue-900 mb-1">Important Notice</h4>
									<p className="text-sm text-blue-800">
										Once a family member is added, their record becomes permanent and cannot be deleted from the system.
										Please ensure all information is accurate before submitting.
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								id="confirm-accuracy"
								checked={confirmAccuracy}
								onChange={(e) => setConfirmAccuracy(e.target.checked)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label htmlFor="confirm-accuracy" className="ml-2 text-sm text-gray-700">
								I confirm that all information provided is accurate and truthful
							</label>
						</div>

						{/* General Error Message */}
						{generalError && (
							<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-red-600 font-medium text-center">{generalError}</p>
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
								disabled={isSubmitting}
								className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
										Adding Member...
									</>
								) : (
									'Add Member'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
