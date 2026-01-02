'use client';

import { ChevronLeft, Heart, Lightbulb, AlertTriangle, Camera, X } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { PlaceOfOriginForm, OccupationForm, FamilyMember } from '@/types';

interface AddMemberPanelProps {
	familyTreeId: string;
	existingMembers: FamilyMember[];
	onClose: () => void;
	onSuccess: () => void;
	selectedMemberId?: string;
}

export default function AddMemberPanel({
	familyTreeId,
	existingMembers,
	onClose,
	onSuccess,
	selectedMemberId,
}: AddMemberPanelProps) {
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

	// Reset form when panel opens
	useEffect(() => {
		let initialRelationship = '';
		let initialRelatedMemberId = '';

		if (selectedMemberId) {
			if (selectedMemberId.includes(',')) {
				initialRelatedMemberId = selectedMemberId.split(',')[0];
				initialRelationship = 'parent';
			} else {
				initialRelatedMemberId = selectedMemberId;
				initialRelationship = 'parent';
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
		setGeneralError('');
		setValidationErrors({
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
	}, [selectedMemberId]);

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
				if (relationshipDate < birthDate) {
					errors.relationshipDate = 'Relationship date must be on or after birth date';
				}
			} else if (memberFormData.relationship === 'spouse') {
				const minSpouseDate = new Date(birthDate);
				minSpouseDate.setFullYear(minSpouseDate.getFullYear() + 7);

				if (relationshipDate < minSpouseDate) {
					errors.relationshipDate = 'Relationship date must be at least 7 years after birth date';
				}
			}
		}

		const hasValidPlaceOfOrigin = placesOfOrigin.some((place) => place.location.trim() !== '');
		if (!hasValidPlaceOfOrigin) {
			errors.placesOfOrigin = 'At least one place of origin is required';
		} else {
			const invalidPlaces = placesOfOrigin.filter((place) => place.location.trim() !== '' && !place.startDate);
			if (invalidPlaces.length > 0) {
				errors.placesOfOrigin = 'Places of origin must have start dates';
			} else {
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

		const hasValidOccupation = occupations.some((occ) => occ.title.trim() !== '');
		if (!hasValidOccupation) {
			errors.occupations = 'At least one occupation is required';
		} else {
			const invalidOccupations = occupations.filter((occ) => occ.title.trim() !== '' && !occ.startDate);
			if (invalidOccupations.length > 0) {
				errors.occupations = 'Occupations must have start dates';
			} else {
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
		return Object.values(errors).every((error) => error === '');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setGeneralError('');

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

			// Add places of origin
			const validPlaces = placesOfOrigin.filter(p => p.location.trim() && p.startDate);
			formData.append('placesOfOrigin', JSON.stringify(validPlaces));

			// Add occupations
			const validOccupations = occupations.filter(o => o.title.trim() && o.startDate);
			formData.append('occupations', JSON.stringify(validOccupations));

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
				onSuccess();
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
		setOccupations(occupations.filter((p) => p.id !== id));
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.currentTarget.files?.[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				toast.error('File size must be less than 5MB');
				return;
			}

			const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
			if (!validTypes.includes(file.type)) {
				toast.error('Only JPEG, PNG, GIF, and WebP files are allowed');
				return;
			}

			setProfilePicture(file);

			const reader = new FileReader();
			reader.onload = (event) => {
				setProfilePicturePreview(event.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

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

			{/* Form Content */}
			<div className="flex-1 overflow-y-auto px-10 py-8">
				<h2 className="text-[26px] font-normal text-black text-center mb-10">Add New Family Member</h2>

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Personal Information Section */}
					<section>
						<div className="flex items-center mb-6">
							<div className="w-5 h-5 mr-3">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="w-full h-full text-black"
								>
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
									<line x1="7" y1="8" x2="17" y2="8" />
									<line x1="7" y1="12" x2="17" y2="12" />
									<line x1="7" y1="16" x2="13" y2="16" />
								</svg>
							</div>
							<h3 className="text-base font-normal text-black">Personal Information</h3>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-base font-normal text-black mb-1.5 ml-1">Full Name *</label>
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
									className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
									required
								/>
								{validationErrors.fullName && (
									<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.fullName}</p>
								)}
							</div>

							<div className="grid grid-cols-2 gap-6">
								<div>
									<label className="block text-base font-normal text-black mb-1.5 ml-1">Gender *</label>
									<select
										value={memberFormData.gender}
										onChange={(e) => {
											setMemberFormData({
												...memberFormData,
												gender: e.target.value,
											});
										}}
										className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none appearance-none"
										required
									>
										<option value="">Select gender</option>
										<option value="MALE">Male</option>
										<option value="FEMALE">Female</option>
									</select>
									{validationErrors.gender && (
										<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.gender}</p>
									)}
								</div>
								<div>
									<label className="block text-base font-normal text-black mb-1.5 ml-1">Birth Date *</label>
									<input
										type="date"
										value={memberFormData.birthDate}
										onChange={(e) => {
											setMemberFormData({
												...memberFormData,
												birthDate: e.target.value,
											});
										}}
										className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
										required
									/>
									{validationErrors.birthDate && (
										<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.birthDate}</p>
									)}
								</div>
							</div>

							{/* Place of Origin */}
							<div>
								<div className="flex justify-between items-center mb-1.5 ml-1">
									<label className="text-base font-normal text-black">Place of Origin *</label>
									<button
										type="button"
										onClick={addPlaceOfOrigin}
										disabled={placesOfOrigin.length >= 4}
										className="text-[11.5px] text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
									>
										+ Add Place
									</button>
								</div>
								{validationErrors.placesOfOrigin && (
									<p className="text-red-500 text-[10px] mb-2 ml-3">{validationErrors.placesOfOrigin}</p>
								)}
								<div className="space-y-4">
									{placesOfOrigin.map((place, index) => (
										<div
											key={place.id}
											className="bg-[#dbeafe] border border-black/50 rounded-[15px] p-4 space-y-3 relative"
										>
											{placesOfOrigin.length > 1 && (
												<button
													type="button"
													onClick={() => removePlaceOfOrigin(place.id)}
													className="absolute top-2 right-2 text-black/40 hover:text-red-500 transition-colors"
												>
													<X className="w-4 h-4" />
												</button>
											)}
											<div>
												<label className="block text-[11.5px] font-normal text-black mb-1 ml-0.5">
													{index === 0 ? 'Current Origin *' : 'Origin *'}
												</label>
												<select
													value={place.location}
													onChange={(e) => {
														const updatedPlaces = [...placesOfOrigin];
														updatedPlaces[index].location = e.target.value;
														setPlacesOfOrigin(updatedPlaces);
													}}
													className="w-full bg-[#eff6ff] border-[0.965px] border-black/50 rounded-[28.9px] px-4 py-2 text-[11.5px] text-black focus:ring-1 focus:ring-black/20 outline-none"
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
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="block text-[11.5px] font-normal text-black mb-1 ml-0.5">
														Start Date *
													</label>
													<input
														type="date"
														value={place.startDate}
														onChange={(e) => {
															const updatedPlaces = [...placesOfOrigin];
															updatedPlaces[index].startDate = e.target.value;
															setPlacesOfOrigin(updatedPlaces);
														}}
														className="w-full bg-[#eff6ff] border-[0.965px] border-black/50 rounded-[28.9px] px-4 py-2 text-[11.5px] text-black focus:ring-1 focus:ring-black/20 outline-none"
													/>
												</div>
												<div>
													<div className="flex items-center">
														<label className="block text-[11.5px] font-normal text-black mb-1 ml-0.5">End Date</label>
														{index === 0 && <span className="text-[11.5px] text-black/50 ml-1 mb-1">(optional)</span>}
														{index !== 0 && <span className="text-[11.5px] text-black ml-1 mb-1">*</span>}
													</div>
													<input
														type="date"
														value={place.endDate}
														onChange={(e) => {
															const updatedPlaces = [...placesOfOrigin];
															updatedPlaces[index].endDate = e.target.value;
															setPlacesOfOrigin(updatedPlaces);
														}}
														className="w-full bg-[#eff6ff] border-[0.965px] border-black/50 rounded-[28.9px] px-4 py-2 text-[11.5px] text-black focus:ring-1 focus:ring-black/20 outline-none"
													/>
												</div>
											</div>
										</div>
									))}
								</div>
								<p className="text-xs text-black/50 mt-2">Maximum 4 places of origin per person</p>
							</div>

							{/* Occupation */}
							<div>
								<div className="flex justify-between items-center mb-1.5 ml-1">
									<label className="text-base font-normal text-black">Occupation *</label>
									<button
										type="button"
										onClick={addOccupation}
										disabled={occupations.length >= 15}
										className="text-[11.5px] text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
									>
										+ Add Occupation
									</button>
								</div>
								{validationErrors.occupations && (
									<p className="text-red-500 text-[10px] mb-2 ml-3">{validationErrors.occupations}</p>
								)}
								<div className="space-y-4">
									{occupations.map((occ, index) => (
										<div
											key={occ.id}
											className="bg-[#dbeafe] border border-black/50 rounded-[15px] p-4 space-y-3 relative"
										>
											{occupations.length > 1 && (
												<button
													type="button"
													onClick={() => removeOccupation(occ.id)}
													className="absolute top-2 right-2 text-black/40 hover:text-red-500 transition-colors"
												>
													<X className="w-4 h-4" />
												</button>
											)}
											<div>
												<label className="block text-[11.5px] font-normal text-black mb-1 ml-0.5">
													{index === 0 ? 'Current Job *' : 'Job *'}
												</label>
												<input
													type="text"
													value={occ.title}
													onChange={(e) => {
														const updatedOccupations = [...occupations];
														updatedOccupations[index].title = e.target.value;
														setOccupations(updatedOccupations);
													}}
													placeholder="Enter job title"
													className="w-full bg-[#eff6ff] border-[0.965px] border-black/50 rounded-[28.9px] px-4 py-2 text-[11.5px] text-black focus:ring-1 focus:ring-black/20 outline-none"
												/>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="block text-[11.5px] font-normal text-black mb-1 ml-0.5">
														Start Date *
													</label>
													<input
														type="date"
														value={occ.startDate}
														onChange={(e) => {
															const updatedOccupations = [...occupations];
															updatedOccupations[index].startDate = e.target.value;
															setOccupations(updatedOccupations);
														}}
														className="w-full bg-[#eff6ff] border-[0.965px] border-black/50 rounded-[28.9px] px-4 py-2 text-[11.5px] text-black focus:ring-1 focus:ring-black/20 outline-none"
													/>
												</div>
												<div>
													<div className="flex items-center">
														<label className="block text-[11.5px] font-normal text-black mb-1 ml-0.5">End Date</label>
														{index === 0 && <span className="text-[11.5px] text-black/50 ml-1 mb-1">(optional)</span>}
														{index !== 0 && <span className="text-[11.5px] text-black ml-1 mb-1">*</span>}
													</div>
													<input
														type="date"
														value={occ.endDate}
														onChange={(e) => {
															const updatedOccupations = [...occupations];
															updatedOccupations[index].endDate = e.target.value;
															setOccupations(updatedOccupations);
														}}
														className="w-full bg-[#eff6ff] border-[0.965px] border-black/50 rounded-[28.9px] px-4 py-2 text-[11.5px] text-black focus:ring-1 focus:ring-black/20 outline-none"
													/>
												</div>
											</div>
										</div>
									))}
								</div>
								<p className="text-xs text-black/50 mt-2">Maximum 15 occupations per person</p>
							</div>

							{/* Address */}
							<div>
								<label className="block text-base font-normal text-black mb-1.5 ml-1">Address *</label>
								<input
									type="text"
									value={memberFormData.address}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											address: e.target.value,
										});
									}}
									placeholder="Enter current address"
									className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
									required
								/>
								{validationErrors.address && (
									<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.address}</p>
								)}
							</div>

							{/* Profile Picture */}
							<div>
								<div className="flex items-center mb-2">
									<label className="text-base font-normal text-black mr-1.5">Profile Picture</label>
									<span className="text-[11.5px] text-black/50">(optional)</span>
								</div>
								<div className="flex items-center space-x-6">
									<div className="w-[100px] h-[100px] bg-gray-200 overflow-hidden border border-black/10 relative group">
										{profilePicturePreview ? (
											<Image
												src={profilePicturePreview}
												alt="Profile preview"
												width={100}
												height={100}
												className="w-full h-full object-cover"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center text-gray-400">
												<Camera className="w-8 h-8" />
											</div>
										)}
										<label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
											<input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
											<Camera className="w-6 h-6 text-white" />
										</label>
									</div>
									<div className="flex-1">
										<p className="text-xs text-black/70 mb-1">Click image to upload</p>
										<p className="text-[10px] text-black/40">Max 5MB. JPEG, PNG, GIF, WebP only.</p>
									</div>
								</div>
							</div>
						</div>
					</section>

					<div className="w-full h-px bg-black/20 my-10"></div>

					{/* Family Connection Section */}
					<section>
						<div className="flex items-center mb-6">
							<div className="w-5 h-5 mr-3">
								<Heart className="w-full h-full text-black" strokeWidth={1.5} />
							</div>
							<h3 className="text-base font-normal text-black">Family Connection</h3>
						</div>

						<div className="space-y-6">
							<div>
								<label className="block text-base font-normal text-black mb-1.5 ml-1">Related Family Member *</label>
								<select
									value={memberFormData.relatedMemberId}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											relatedMemberId: e.target.value,
										});
									}}
									className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none appearance-none"
									required
								>
									<option value="">Select family member</option>
									{existingMembers.map((existingMember) => (
										<option key={existingMember.id} value={existingMember.id}>
											{existingMember.fullName}
										</option>
									))}
								</select>
								{validationErrors.relatedMemberId && (
									<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.relatedMemberId}</p>
								)}
								<p className="text-[10px] text-black/50 mt-1.5 ml-3">
									Select the family member this person is connected to
								</p>
							</div>

							<div>
								<label className="block text-base font-normal text-black mb-1.5 ml-1">Relationship *</label>
								<select
									value={memberFormData.relationship}
									onChange={(e) => {
										setMemberFormData({
											...memberFormData,
											relationship: e.target.value,
										});
									}}
									className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none appearance-none"
									required
								>
									<option value="">Select relationship</option>
									<option value="parent">Child - Parent</option>
									<option value="spouse">Spouse</option>
								</select>
								{validationErrors.relationship && (
									<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.relationship}</p>
								)}
								<p className="text-[10px] text-black/50 mt-1.5 ml-3">
									Relationship of the new member to the selected person
								</p>
							</div>

							<div>
								<label className="block text-base font-normal text-black mb-1.5 ml-1">
									Relationship Established Date *
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
									className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
									required
								/>
								{validationErrors.relationshipDate && (
									<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.relationshipDate}</p>
								)}
								<p className="text-[10px] text-black/50 mt-1.5 ml-3">
									Relationship of the new member to the selected person
								</p>
							</div>
						</div>
					</section>

					{/* Confirmation Checkbox */}
					<label className="flex items-center gap-2 cursor-pointer mt-4">
						<input
							type="checkbox"
							checked={confirmAccuracy}
							onChange={(e) => setConfirmAccuracy(e.target.checked)}
							className="w-4 h-4 rounded border-gray-300"
						/>
						<span className="text-sm text-gray-900">
							I confirm that all information provided is accurate and truthful
						</span>
					</label>

					{/* Important Box (Always Show - Blue) */}
					<div className="flex gap-3 bg-[#dbeafe] border border-[#93c5fd] rounded-lg p-4 mt-4">
						<AlertTriangle className="w-5 h-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
						<div>
							<p className="text-sm font-semibold text-gray-900 mb-1">Important</p>
							<p className="text-sm text-gray-700">
								Once a family member is added, their record becomes permanent and cannot be deleted from the system.
								Please ensure all information is accurate before submitting.
							</p>
						</div>
					</div>

					{/* Note Box (Conditional - Yellow) */}
					{memberFormData.relationship === 'parent' && (
						<div className="flex gap-3 bg-[#fef9c3] border border-[#fde047] rounded-lg p-4 mt-4">
							<Lightbulb className="w-5 h-5 text-[#ca8a04] flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-sm font-semibold text-gray-900 mb-1">Note</p>
								<p className="text-sm text-gray-700">
									When adding a <strong>Child - Parent</strong> relationship, the system will automatically
									create <strong>Birth</strong> events. You can view details in the <strong>Life Events</strong>{' '}
									section.
								</p>
							</div>
						</div>
					)}

					{memberFormData.relationship === 'spouse' && (
						<div className="flex gap-3 bg-[#fef9c3] border border-[#fde047] rounded-lg p-4 mt-4">
							<Lightbulb className="w-5 h-5 text-[#ca8a04] flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-sm font-semibold text-gray-900 mb-1">Note</p>
								<p className="text-sm text-gray-700">
									When adding a <strong>Spouse</strong> relationship, the system will automatically create{' '}
									<strong>Marriage</strong> events. You can view details in the <strong>Life Events</strong> section.
								</p>
							</div>
						</div>
					)}

					{/* General Error */}
					{generalError && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
							<p className="text-red-800 text-[11px]">{generalError}</p>
						</div>
					)}

					{/* Footer Buttons */}
					<div className="flex justify-center items-center space-x-4 pt-10 pb-10">
						<button
							type="button"
							onClick={onClose}
							className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!confirmAccuracy || isSubmitting}
							className="w-[150px] h-[40px] bg-[#1f2937] text-white rounded-[10px] font-bold text-sm hover:bg-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
						>
							{isSubmitting ? 'Adding...' : 'Add Member'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

