'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Users, Camera, Plus, Info, ChevronDown, Trash2 } from 'lucide-react';
import { triggerFamilyTreesRefresh } from '@/lib/useFamilyTrees';

interface PlaceOfOrigin {
	id: string;
	location: string;
	startDate: string;
	endDate: string;
}

interface Occupation {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
}

interface CreateFamilyTreePanelProps {
	onClose: () => void;
}

export default function CreateFamilyTreePanel({ onClose }: CreateFamilyTreePanelProps) {
	useSession();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [generalError, setGeneralError] = useState<string>('');
	const [formValidationError, setFormValidationError] = useState<string>('');

	// Family Information
	const [familyData, setFamilyData] = useState({
		familyName: '',
		origin: '',
		establishYear: '',
	});

	// Root Person Information
	const [rootPersonData, setRootPersonData] = useState({
		fullName: '',
		gender: '',
		birthDate: '',
		address: '',
	});

	// Dynamic sections
	const [placesOfOrigin, setPlacesOfOrigin] = useState<PlaceOfOrigin[]>([
		{ id: '1', location: '', startDate: '', endDate: '' },
	]);
	const [occupations, setOccupations] = useState<Occupation[]>([{ id: '1', title: '', startDate: '', endDate: '' }]);

	// Profile picture
	const [profilePicture, setProfilePicture] = useState<string | null>(null);
	const [confirmAccuracy, setConfirmAccuracy] = useState(false);

	const validatePlacesOfOrigin = () => {
		const newErrors = { ...errors };
		const hasValidPlace = placesOfOrigin.some((p) => p.location && p.startDate);

		if (!hasValidPlace) {
			newErrors.placesOfOrigin = 'At least one place of origin with location and start date is required';
		} else {
			// Check that start dates are after birth date
			const invalidBirthDatePlaces = placesOfOrigin.filter(
				(p) => p.location && p.startDate && rootPersonData.birthDate && p.startDate <= rootPersonData.birthDate
			);
			if (invalidBirthDatePlaces.length > 0) {
				newErrors.placesOfOrigin = 'Place of origin start date must be after the birth date';
			} else {
				// Check consecutive places date constraints
				for (let i = 1; i < placesOfOrigin.length; i++) {
					const currentPlace = placesOfOrigin[i];
					const previousPlace = placesOfOrigin[i - 1];

					if (currentPlace.location && currentPlace.startDate) {
						if (!previousPlace.endDate) {
							newErrors.placesOfOrigin = 'Previous place of origin must have an end date';
							break;
						} else if (currentPlace.startDate <= previousPlace.endDate) {
							newErrors.placesOfOrigin = 'Start date must be after the end date of the previous place of origin';
							break;
						}
					}
				}
			}

			if (!newErrors.placesOfOrigin) {
				delete newErrors.placesOfOrigin;
			}
		}

		setErrors((prev) => {
			const updated = { ...prev };
			if (newErrors.placesOfOrigin) {
				updated.placesOfOrigin = newErrors.placesOfOrigin;
			} else {
				delete updated.placesOfOrigin;
			}
			return updated;
		});
		return hasValidPlace && !newErrors.placesOfOrigin;
	};

	const validateOccupations = () => {
		const newErrors = { ...errors };
		const hasValidOccupation = occupations.some((o) => o.title.trim());

		if (!hasValidOccupation) {
			newErrors.occupations = 'At least one occupation is required';
		} else {
			// Check that start dates are after birth date
			const invalidBirthDateOccupations = occupations.filter(
				(o) => o.title.trim() && o.startDate && rootPersonData.birthDate && o.startDate <= rootPersonData.birthDate
			);
			if (invalidBirthDateOccupations.length > 0) {
				newErrors.occupations = 'Occupation start date must be after the birth date';
			} else {
				// Check consecutive occupations date constraints
				for (let i = 1; i < occupations.length; i++) {
					const currentOccupation = occupations[i];
					const previousOccupation = occupations[i - 1];

					if (currentOccupation.title.trim() && currentOccupation.startDate) {
						if (!previousOccupation.endDate) {
							newErrors.occupations = 'Previous occupation must have an end date';
							break;
						} else if (currentOccupation.startDate <= previousOccupation.endDate) {
							newErrors.occupations = 'Start date must be after the end date of the previous occupation';
							break;
						}
					}
				}
			}

			if (!newErrors.occupations) {
				delete newErrors.occupations;
			}
		}

		setErrors((prev) => {
			const updated = { ...prev };
			if (newErrors.occupations) {
				updated.occupations = newErrors.occupations;
			} else {
				delete updated.occupations;
			}
			return updated;
		});
		return hasValidOccupation && !newErrors.occupations;
	};

	const handleAddPlace = () => {
		if (placesOfOrigin.length < 4) {
			setPlacesOfOrigin([
				...placesOfOrigin,
				{
					id: (placesOfOrigin.length + 1).toString(),
					location: '',
					startDate: '',
					endDate: '',
				},
			]);
		}
	};

	const handleAddOccupation = () => {
		if (occupations.length < 15) {
			setOccupations([
				...occupations,
				{
					id: (occupations.length + 1).toString(),
					title: '',
					startDate: '',
					endDate: '',
				},
			]);
		}
	};

	const handleRemovePlace = (index: number) => {
		setPlacesOfOrigin(placesOfOrigin.filter((_, i) => i !== index));
	};

	const handleRemoveOccupation = (index: number) => {
		setOccupations(occupations.filter((_, i) => i !== index));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setProfilePicture(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setGeneralError('');
		setFormValidationError('');

		if (!confirmAccuracy) {
			setGeneralError('Please confirm that the information is accurate.');
			return;
		}

		const isPlacesValid = validatePlacesOfOrigin();
		const isOccupationsValid = validateOccupations();

		if (!isPlacesValid || !isOccupationsValid) {
			setFormValidationError('Please check your information');
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch('/api/family-trees', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...familyData,
					rootPerson: {
						...rootPersonData,
						profilePicture,
						placesOfOrigin: placesOfOrigin.filter((p) => p.location && p.startDate),
						occupations: occupations.filter((o) => o.title && o.startDate),
					},
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create family tree');
			}

			triggerFamilyTreesRefresh();
			onClose();
			router.refresh();
		} catch (error: unknown) {
			setGeneralError(error instanceof Error ? error.message : 'An unknown error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full h-full overflow-y-auto relative flex flex-col bg-white">
			{/* Header */}
			<div className="p-4 lg:p-6 flex flex-col items-center relative">
				<button
					onClick={onClose}
					className="absolute left-4 lg:left-6 top-4 lg:top-6 flex items-center text-black hover:opacity-70 transition-opacity"
				>
					<span className="text-xl font-light mr-2">{'<'}</span>
					<span className="font-medium">Back</span>
				</button>
				<h1 className="text-[20px] lg:text-[26px] font-bold mt-8 text-black text-center">Create New Family Tree</h1>
			</div>

			<form onSubmit={handleSubmit} className="px-4 lg:px-12 pb-12 flex-1">
				{/* Family Information Section */}
				<div className="mb-8">
					<div className="flex items-center gap-2 mb-6">
						<div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
							<Users className="w-4 h-4 text-white" />
						</div>
						<h2 className="text-lg font-bold text-black">Family Information</h2>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-base font-medium mb-1 text-black">Family Name *</label>
							<input
								type="text"
								placeholder="e.g., The Hunter Family"
								className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] h-[35px] px-4 focus:outline-none text-black placeholder:text-black/40"
								value={familyData.familyName}
								onChange={(e) => setFamilyData({ ...familyData, familyName: e.target.value })}
								required
							/>
						</div>

						<div>
							<label className="block text-base font-medium mb-1 text-black">Origin *</label>
							<select
								className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] h-[35px] px-4 focus:outline-none text-black"
								value={familyData.origin}
								onChange={(e) => setFamilyData({ ...familyData, origin: e.target.value })}
								required
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

						<div>
							<label className="block text-base font-medium mb-1 text-black">Establish year *</label>
							<input
								type="text"
								placeholder="e.g., 1945"
								className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] h-[35px] px-4 focus:outline-none text-black placeholder:text-black/40"
								value={familyData.establishYear}
								onChange={(e) =>
									setFamilyData({
										...familyData,
										establishYear: e.target.value,
									})
								}
								required
							/>
						</div>
					</div>
				</div>

				<div className="h-px bg-black/20 my-8" />

				{/* Root Person Section */}
				<div className="mb-8">
					<h2 className="text-lg font-bold mb-6 text-black">Family Header (Root Person)</h2>

					<div className="flex items-center gap-2 mb-6">
						<div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
							<Info className="w-4 h-4 text-white" />
						</div>
						<h3 className="text-lg font-bold text-black">Personal Information</h3>
					</div>

					<div className="space-y-4">
						<div>
							<label className="block text-base font-medium mb-1 text-black">Full Name *</label>
							<input
								type="text"
								placeholder="Enter full name"
								className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] h-[35px] px-4 focus:outline-none text-black placeholder:text-black/40"
								value={rootPersonData.fullName}
								onChange={(e) =>
									setRootPersonData({
										...rootPersonData,
										fullName: e.target.value,
									})
								}
								required
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-base font-medium mb-1 text-black">Gender *</label>
								<div className="relative">
									<select
										className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] h-[35px] px-4 appearance-none focus:outline-none text-black"
										value={rootPersonData.gender}
										onChange={(e) =>
											setRootPersonData({
												...rootPersonData,
												gender: e.target.value,
											})
										}
										required
									>
										<option value="" className="text-black/40">
											Select gender
										</option>
										<option value="MALE" className="text-black">
											Male
										</option>
										<option value="FEMALE" className="text-black">
											Female
										</option>
									</select>
									<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-black" />
								</div>
							</div>
							<div>
								<label className="block text-base font-medium mb-1 text-black">Birth Date *</label>
								<div className="relative">
									<input
										type="date"
										className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] h-[35px] px-4 focus:outline-none appearance-none text-black"
										value={rootPersonData.birthDate}
										onChange={(e) =>
											setRootPersonData({
												...rootPersonData,
												birthDate: e.target.value,
											})
										}
										required
									/>
								</div>
							</div>
						</div>

						{/* Places of Origin */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<label className="text-base font-medium text-black">Place of Origin *</label>
								<button
									type="button"
									onClick={handleAddPlace}
									className="flex items-center gap-1 text-xs bg-white border border-black rounded-full px-3 py-1 hover:bg-gray-50 text-black font-medium"
								>
									<Plus className="w-3 h-3" />
									Add Place
								</button>
							</div>
							<div className="space-y-4">
								{placesOfOrigin.map((place, index) => (
									<div key={place.id} className="bg-[#dbeafe] border border-black/50 rounded-[15px] p-4">
										<div className="mb-3 flex justify-between items-center">
											<label className="block text-[11px] font-bold text-black">Origin {index + 1} *</label>
											{index > 0 && (
												<button
													type="button"
													onClick={() => handleRemovePlace(index)}
													className="text-red-600 hover:text-red-800"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
										<div className="relative">
											<select
												className="w-full bg-[#eff6ff] mb-2 border border-black/50 rounded-[30px] h-[33px] px-4 text-[11px] focus:outline-none text-black"
												value={place.location}
												onChange={(e) => {
													const newPlaces = [...placesOfOrigin];
													newPlaces[index].location = e.target.value;
													setPlacesOfOrigin(newPlaces);
													setErrors((prev) => ({
														...prev,
														placesOfOrigin: '',
													}));
												}}
												required
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
												<label className="block text-[11px] font-bold mb-1 text-black">Start Date *</label>
												<div className="relative">
													<input
														type="date"
														className="w-full bg-[#eff6ff] border border-black/50 rounded-[30px] h-[33px] px-4 text-[11px] focus:outline-none appearance-none text-black"
														value={place.startDate}
														onChange={(e) => {
															const newPlaces = [...placesOfOrigin];
															newPlaces[index].startDate = e.target.value;
															setPlacesOfOrigin(newPlaces);
															setErrors((prev) => ({
																...prev,
																placesOfOrigin: '',
															}));
														}}
														required
													/>
												</div>
											</div>
											<div>
												<label className="block text-[11px] font-bold mb-1 text-black">
													End Date <span className="text-gray-600 font-normal">(optional)</span>
												</label>
												<div className="relative">
													<input
														type="date"
														className="w-full bg-[#eff6ff] border border-black/50 rounded-[30px] h-[33px] px-4 text-[11px] focus:outline-none appearance-none text-black"
														value={place.endDate}
														onChange={(e) => {
															const newPlaces = [...placesOfOrigin];
															newPlaces[index].endDate = e.target.value;
															setPlacesOfOrigin(newPlaces);
															setErrors((prev) => ({
																...prev,
																placesOfOrigin: '',
															}));
														}}
													/>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
							<p className="text-[12px] text-gray-700 mt-2 font-medium">Maximum 4 places of origin per person</p>
							{errors.placesOfOrigin && <p className="text-red-600 text-xs mt-1 font-bold">{errors.placesOfOrigin}</p>}
						</div>

						{/* Occupations */}
						<div>
							<div className="flex justify-between items-center mb-2">
								<label className="text-base font-medium text-black">Occupation *</label>
								<button
									type="button"
									onClick={handleAddOccupation}
									className="flex items-center gap-1 text-xs bg-white border border-black rounded-full px-3 py-1 hover:bg-gray-50 text-black font-medium"
								>
									<Plus className="w-3 h-3" />
									Add Occupation
								</button>
							</div>
							<div className="space-y-4">
								{occupations.map((occ, index) => (
									<div key={occ.id} className="bg-[#dbeafe] border border-black/50 rounded-[15px] p-4">
										<div className="mb-3 flex justify-between items-center">
											<label className="block text-[11px] font-bold text-black">Job {index + 1} *</label>
											{index > 0 && (
												<button
													type="button"
													onClick={() => handleRemoveOccupation(index)}
													className="text-red-600 hover:text-red-800"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
										<input
											type="text"
											placeholder="e.g., Software Engineer"
											className="w-full bg-[#eff6ff] mb-2 border border-black/50 rounded-[30px] h-[33px] px-4 text-[11px] focus:outline-none text-black placeholder:text-black/40"
											value={occ.title}
											onChange={(e) => {
												const newOccs = [...occupations];
												newOccs[index].title = e.target.value;
												setOccupations(newOccs);
												setErrors((prev) => ({ ...prev, occupations: '' }));
											}}
											required
										/>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="block text-[11px] font-bold mb-1 text-black">Start Date *</label>
												<div className="relative">
													<input
														type="date"
														className="w-full bg-[#eff6ff] border border-black/50 rounded-[30px] h-[33px] px-4 text-[11px] focus:outline-none appearance-none text-black"
														value={occ.startDate}
														onChange={(e) => {
															const newOccs = [...occupations];
															newOccs[index].startDate = e.target.value;
															setOccupations(newOccs);
															setErrors((prev) => ({
																...prev,
																occupations: '',
															}));
														}}
														required
													/>
												</div>
											</div>
											<div>
												<label className="block text-[11px] font-bold mb-1 text-black">
													End Date <span className="text-gray-600 font-normal">(optional)</span>
												</label>
												<div className="relative">
													<input
														type="date"
														className="w-full bg-[#eff6ff] border border-black/50 rounded-[30px] h-[33px] px-4 text-[11px] focus:outline-none appearance-none text-black"
														value={occ.endDate}
														onChange={(e) => {
															const newOccs = [...occupations];
															newOccs[index].endDate = e.target.value;
															setOccupations(newOccs);
															setErrors((prev) => ({
																...prev,
																occupations: '',
															}));
														}}
													/>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
							<p className="text-[12px] text-gray-700 mt-2 font-medium">Maximum 15 occupations per person</p>
							{errors.occupations && <p className="text-red-600 text-xs mt-1 font-bold">{errors.occupations}</p>}
						</div>

						<div>
							<label className="block text-base font-medium mb-1 text-black">Address *</label>
							<input
								type="text"
								placeholder="Enter full address"
								className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] h-[35px] px-4 focus:outline-none text-black placeholder:text-black/40"
								value={rootPersonData.address}
								onChange={(e) =>
									setRootPersonData({
										...rootPersonData,
										address: e.target.value,
									})
								}
								required
							/>
						</div>

						{/* Profile Picture */}
						<div>
							<div className="flex items-center gap-2 mb-2">
								<label className="text-base font-medium text-black">Profile Picture</label>
								<span className="text-[11px] text-gray-600">(optional)</span>
							</div>
							<div className="flex items-end gap-4">
								<div className="w-[100px] h-[100px] bg-[#f3f2f2] border-2 border-dashed border-black/20 rounded-lg flex items-center justify-center overflow-hidden relative group">
									{profilePicture ? (
										<Image src={profilePicture} alt="Profile" fill className="object-cover" />
									) : (
										<Camera className="w-8 h-8 text-black/40" />
									)}
									<input
										type="file"
										accept="image/*"
										onChange={handleFileChange}
										className="absolute inset-0 opacity-0 cursor-pointer"
									/>
								</div>
								<button
									type="button"
									className="bg-[#1f1f1f] text-white text-[11px] font-medium px-4 py-1.5 rounded-[10px] hover:bg-black transition-colors"
									onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
								>
									Upload
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Confirmation and Important Box */}
				<div className="mt-12 space-y-6">
					<label className="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							className="w-5 h-5 rounded border-black text-black focus:ring-black"
							checked={confirmAccuracy}
							onChange={(e) => setConfirmAccuracy(e.target.checked)}
						/>
						<span className="text-sm font-medium text-black">
							I confirm that all information provided is accurate and truthful
						</span>
					</label>

					<div className="bg-[#bfdbfe] border border-black/50 rounded-[10px] p-4 flex gap-3">
						<div className="w-5 h-5 flex-shrink-0">
							<Info className="w-5 h-5 text-black" />
						</div>
						<div>
							<p className="font-bold text-sm mb-1 text-black">Important</p>
							<p className="text-xs leading-relaxed text-black font-medium">
								Once a family member is added, their record becomes permanent and cannot be deleted from the system.
								Please ensure all information is accurate before submitting.
							</p>
						</div>
					</div>

					{generalError && <p className="text-red-600 text-sm text-center font-bold">{generalError}</p>}

					{formValidationError && <p className="text-red-600 text-sm text-center font-bold">{formValidationError}</p>}

					<div className="flex justify-end gap-4 pt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-8 py-2 bg-white border border-black rounded-[10px] text-sm font-bold text-black hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isLoading}
							className="px-8 py-2 bg-[#1f2937] text-white rounded-[10px] text-sm font-bold hover:bg-[#111827] transition-colors disabled:opacity-50"
						>
							{isLoading ? 'Creating...' : 'Create'}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
