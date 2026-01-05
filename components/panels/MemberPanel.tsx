'use client';

import { ChevronLeft, Heart, Lightbulb, AlertTriangle, Camera, X, Info } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import LoadingScreen from '@/components/LoadingScreen';
import ProvinceList from '@/components/ui/province-list';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import { PlaceOfOriginForm, ExtendedFamilyMember } from '@/types';
import { ExistingMember, OccupationApiResponse, MemberPanelProps } from '@/types/ui';

export default function MemberPanel({
	mode: initialMode,
	memberId,
	familyTreeId,
	existingMembers,
	selectedMemberId,
	onClose,
	onSuccess,
}: MemberPanelProps) {
	const { isGuest, guestMemberId } = useGuestSession();
	const intl = useIntl();
	const [mode, setMode] = useState<'add' | 'view' | 'edit'>(initialMode);
	const [member, setMember] = useState<ExistingMember | null>(null);
	const [loading, setLoading] = useState(mode !== 'add');
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
		{ id: '1', location: '', startDate: '', endDate: '' },
	]);
	const [occupations, setOccupations] = useState<OccupationApiResponse[]>([
		{ id: '1', jobTitle: '', startDate: '', endDate: '' },
	]);
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

	// Load member data for view/edit modes
	useEffect(() => {
		if (mode === 'add') {
			// Reset form for add mode
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
			setOccupations([{ id: '1', jobTitle: '', startDate: '', endDate: '' }]);
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
			setMember(null);
			setLoading(false);
		} else if (memberId) {
			// Fetch member data for view/edit modes
			const fetchMember = async () => {
				setLoading(true);
				try {
					const res = await fetch(`/api/family-members/${memberId}`);
					if (res.ok) {
						const data = await res.json();
						setMember(data);

						// Determine relationship and related member
						let relationshipType = '';
						let relatedMemberId = '';
						let relationshipDateValue = '';

						if (data.parent) {
							relationshipType = 'parent';
							relatedMemberId = data.parent.id.toString();
							relationshipDateValue = data.relationshipEstablishedDate
								? data.relationshipEstablishedDate.split('T')[0]
								: '';
						} else if (data.spouse1 && data.spouse1.length > 0) {
							relationshipType = 'spouse';
							relatedMemberId = data.spouse1[0].familyMember2.id.toString();
							relationshipDateValue = data.spouse1[0].marriageDate ? data.spouse1[0].marriageDate.split('T')[0] : '';
						} else if (data.spouse2 && data.spouse2.length > 0) {
							relationshipType = 'spouse';
							relatedMemberId = data.spouse2[0].familyMember1.id.toString();
							relationshipDateValue = data.spouse2[0].marriageDate ? data.spouse2[0].marriageDate.split('T')[0] : '';
						}

						setMemberFormData({
							fullName: data.fullName || '',
							gender: data.gender || '',
							birthDate: data.birthday ? data.birthday.split('T')[0] : '',
							address: data.address || '',
							relatedMemberId: relatedMemberId,
							relationship: relationshipType,
							relationshipDate: relationshipDateValue,
						});

						if (data.birthPlaces && data.birthPlaces.length > 0) {
							setPlacesOfOrigin(
								data.birthPlaces.map(
									(
										place: { startDate?: string; endDate?: string; placeOfOrigin: { location: string } },
										index: number
									) => ({
										id: index.toString(),
										location: place.placeOfOrigin?.location || '',
										startDate: place.startDate ? place.startDate.split('T')[0] : '',
										endDate: place.endDate ? place.endDate.split('T')[0] : '',
									})
								)
							);
						} else {
							setPlacesOfOrigin([{ id: '1', location: '', startDate: '', endDate: '' }]);
						}

						if (data.occupations && data.occupations.length > 0) {
							setOccupations(
								data.occupations.map((occ: { id: number; jobTitle: string; startDate?: string; endDate?: string }) => ({
									id: occ.id.toString(),
									jobTitle: occ.jobTitle,
									startDate: occ.startDate ? occ.startDate.split('T')[0] : '',
									endDate: occ.endDate ? occ.endDate.split('T')[0] : '',
								}))
							);
						} else {
							setOccupations([{ id: '1', jobTitle: '', startDate: '', endDate: '' }]);
						}

						if (data.hasProfilePicture) {
							fetch(`/api/family-members/${data.id}/profile-picture`)
								.then((response) => response.blob())
								.then((blob) => {
									const reader = new FileReader();
									reader.onload = (e) => {
										setProfilePicturePreview(e.target?.result as string);
									};
									reader.readAsDataURL(blob);
								})
								.catch(() => {
									setProfilePicturePreview(null);
								});
						} else {
							setProfilePicturePreview(null);
						}

						setProfilePicture(null);
						setConfirmAccuracy(false);
						setIsSubmitting(false);
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
						setGeneralError('');
					}
				} catch (error) {
					console.error('Error fetching member:', error);
				} finally {
					setLoading(false);
				}
			};

			fetchMember();
		}
	}, [mode, memberId, selectedMemberId]);

	// Sync mode with initialMode when it changes
	useEffect(() => {
		setMode(initialMode);
	}, [initialMode]);

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
			errors.fullName = intl.formatMessage({ id: 'panel.member.validation.fullNameRequired' });
		}
		if (!memberFormData.gender) {
			errors.gender = intl.formatMessage({ id: 'panel.member.validation.genderRequired' });
		}
		if (!memberFormData.birthDate) {
			errors.birthDate = intl.formatMessage({ id: 'panel.member.validation.birthDateRequired' });
		}
		if (!memberFormData.address.trim()) {
			errors.address = intl.formatMessage({ id: 'panel.member.validation.addressRequired' });
		}

		// For add mode or root person, related member is required
		if ((mode === 'add' && !member?.isRootPerson) || (mode !== 'add' && !member?.isRootPerson)) {
			if (!memberFormData.relatedMemberId) {
				errors.relatedMemberId = intl.formatMessage({ id: 'panel.member.validation.relatedMemberRequired' });
			}
			if (!memberFormData.relationship) {
				errors.relationship = intl.formatMessage({ id: 'panel.member.validation.relationshipRequired' });
			} else if (memberFormData.relationship === 'spouse' && memberFormData.relatedMemberId) {
				const selectedMember = existingMembers.find(
					(m) => m.id.toString() === memberFormData.relatedMemberId
				) as ExtendedFamilyMember;
				const currentMember = mode === 'add' ? null : member;

				if (selectedMember) {
					const hasOtherActiveSpouse =
						(selectedMember.spouse1 &&
							selectedMember.spouse1.some(
								(s) => !s.divorceDate && (!currentMember || s.familyMember2.id !== currentMember.id)
							)) ||
						(selectedMember.spouse2 &&
							selectedMember.spouse2.some(
								(s) => !s.divorceDate && (!currentMember || s.familyMember1.id !== currentMember.id)
							));

					if (hasOtherActiveSpouse) {
						errors.relatedMemberId = intl.formatMessage({ id: 'panel.member.validation.activeSpouseExists' });
					}
				}
			}
			if (!memberFormData.relationshipDate) {
				errors.relationshipDate = intl.formatMessage({ id: 'panel.member.validation.relationshipDateRequired' });
			} else if (memberFormData.birthDate && memberFormData.relationship) {
				const birthDate = new Date(memberFormData.birthDate);
				const relationshipDate = new Date(memberFormData.relationshipDate);

				if (memberFormData.relationship === 'parent') {
					if (relationshipDate < birthDate) {
						errors.relationshipDate = intl.formatMessage({ id: 'panel.member.validation.relationshipDateAfterBirth' });
					}
				} else if (memberFormData.relationship === 'spouse') {
					const minSpouseDate = new Date(birthDate);
					minSpouseDate.setFullYear(minSpouseDate.getFullYear() + 7);

					if (relationshipDate < minSpouseDate) {
						errors.relationshipDate = intl.formatMessage({ id: 'panel.member.validation.relationshipDateMinSpouse' });
					}
				}
			}
		}

		const hasValidPlaceOfOrigin = placesOfOrigin.some((place) => place.location.trim() !== '');
		if (!hasValidPlaceOfOrigin) {
			errors.placesOfOrigin = intl.formatMessage({ id: 'panel.member.validation.placesOfOriginRequired' });
		} else {
			const invalidPlaces = placesOfOrigin.filter((place) => place.location.trim() !== '' && !place.startDate);
			if (invalidPlaces.length > 0) {
				errors.placesOfOrigin = intl.formatMessage({ id: 'panel.member.validation.placesOfOriginStartDate' });
			} else {
				const invalidBirthDatePlaces = placesOfOrigin.filter(
					(place) =>
						place.location.trim() !== '' &&
						place.startDate &&
						memberFormData.birthDate &&
						place.startDate < memberFormData.birthDate
				);
				if (invalidBirthDatePlaces.length > 0) {
					errors.placesOfOrigin = intl.formatMessage({ id: 'panel.member.validation.placeOfOriginAfterBirth' });
				} else {
					for (let i = 1; i < placesOfOrigin.length; i++) {
						const currentPlace = placesOfOrigin[i];
						const previousPlace = placesOfOrigin[i - 1];

						if (currentPlace.location.trim() && currentPlace.startDate) {
							if (!previousPlace.endDate) {
								errors.placesOfOrigin = intl.formatMessage({
									id: 'panel.member.validation.placesOfOriginEndDate',
								});
								break;
							} else if (currentPlace.startDate <= previousPlace.endDate) {
								errors.placesOfOrigin = intl.formatMessage({ id: 'panel.member.validation.placesOfOriginOrder' });
								break;
							}
						}
					}
				}
			}
		}

		const hasValidOccupation = occupations.some((occ) => occ.jobTitle.trim() !== '');
		if (!hasValidOccupation) {
			errors.occupations = intl.formatMessage({ id: 'panel.member.validation.occupationsRequired' });
		} else {
			const invalidOccupations = occupations.filter((occ) => occ.jobTitle.trim() !== '' && !occ.startDate);
			if (invalidOccupations.length > 0) {
				errors.occupations = intl.formatMessage({ id: 'panel.member.validation.occupationsStartDate' });
			} else {
				const invalidBirthDateOccupations = occupations.filter(
					(occ) =>
						occ.jobTitle.trim() !== '' &&
						occ.startDate &&
						memberFormData.birthDate &&
						occ.startDate < memberFormData.birthDate
				);
				if (invalidBirthDateOccupations.length > 0) {
					errors.occupations = intl.formatMessage({ id: 'panel.member.validation.occupationsAfterBirth' });
				} else {
					for (let i = 1; i < occupations.length; i++) {
						const currentOccupation = occupations[i];
						const previousOccupation = occupations[i - 1];

						if (currentOccupation.jobTitle.trim() && currentOccupation.startDate) {
							if (!previousOccupation.endDate) {
								errors.occupations = intl.formatMessage({
									id: 'panel.member.validation.occupationsEndDate',
								});
								break;
							} else if (currentOccupation.startDate <= previousOccupation.endDate) {
								errors.occupations = intl.formatMessage({
									id: 'panel.member.validation.occupationsDateOrder',
								});
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
			setGeneralError(intl.formatMessage({ id: 'panel.member.general.checkInformation' }));
			return;
		}

		if (!confirmAccuracy) {
			setGeneralError(intl.formatMessage({ id: 'panel.member.general.confirmAccuracy' }));
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

			const validPlaces = placesOfOrigin.filter((p) => p.location.trim() && p.startDate);
			formData.append('placesOfOrigin', JSON.stringify(validPlaces));

			const validOccupations = occupations.filter((o) => o.jobTitle.trim() && o.startDate);
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

			let response;
			if (mode === 'add') {
				response = await fetch(`/api/family-members`, {
					method: 'POST',
					body: formData,
				});
			} else {
				response = await fetch(`/api/family-members/${memberId}`, {
					method: 'PUT',
					body: formData,
				});
			}

			if (response.ok) {
				// Call onSuccess callback if provided
				if (onSuccess) {
					onSuccess();
					toast.success(
						mode === 'add'
							? intl.formatMessage({ id: 'panel.member.toast.addSuccess' })
							: intl.formatMessage({ id: 'panel.member.toast.updateSuccess' })
					);
				} else {
					// Fallback: Refresh the page to show updated data
					window.location.reload();
				}
			} else {
				const error = await response.json();
				toast.error(
					error.error ||
						(mode === 'add'
							? intl.formatMessage({ id: 'panel.member.toast.addFailed' })
							: intl.formatMessage({ id: 'panel.member.toast.updateFailed' }))
				);
			}
		} catch (error) {
			console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} member:`, error);
			toast.error(
				mode === 'add'
					? intl.formatMessage({ id: 'panel.member.toast.addFailed' })
					: intl.formatMessage({ id: 'panel.member.toast.updateFailed' })
			);
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
					jobTitle: '',
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
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
			if (!allowedTypes.includes(file.type)) {
				toast.error(intl.formatMessage({ id: 'panel.member.toast.invalidFileType' }));
				return;
			}

			if (file.size > 5 * 1024 * 1024) {
				toast.error(intl.formatMessage({ id: 'panel.member.toast.fileTooLarge' }));
				return;
			}

			setProfilePicture(file);

			const reader = new FileReader();
			reader.onload = (e) => {
				setProfilePicturePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	if (mode !== 'add' && !member && !loading) {
		return (
			<div className="w-full h-full flex items-center justify-center text-gray-500 bg-white">
				<FormattedMessage id="panel.member.notFound" />
			</div>
		);
	}

	const isViewMode = mode === 'view';
	const isEditMode = mode === 'edit';
	const isAddMode = mode === 'add';
	const canEdit = isGuest ? guestMemberId === memberId : true;

	return (
		<div className="w-full h-full flex flex-col bg-white">
			{/* Header */}
			<div className="px-8 pt-8 pb-4 border-b border-gray-100 flex-shrink-0">
				<button
					onClick={onClose}
					className="flex items-center text-black font-normal text-base hover:opacity-70 transition-opacity"
				>
					<ChevronLeft className="w-5 h-5 mr-2" />
					<span className="font-inter">
						<FormattedMessage id="panel.common.back" />
					</span>
				</button>
			</div>

			<div className="relative overflow-auto flex-1">
				{loading && <LoadingScreen message={intl.formatMessage({ id: 'panel.member.loading' })} />}
				{isViewMode ? (
					/* View Mode */
					<div className="flex-1 overflow-y-auto px-10 py-8">
						<h2 className="text-[26px] font-normal text-black text-center mb-10">
							<FormattedMessage id="panel.member.viewTitle" values={{ name: memberFormData.fullName }} />
						</h2>

						<div className="space-y-8">
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
											className="w-full h-full"
										>
											<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
											<line x1="7" y1="8" x2="17" y2="8" />
											<line x1="7" y1="12" x2="17" y2="12" />
											<line x1="7" y1="16" x2="13" y2="16" />
										</svg>
									</div>
									<h3 className="text-base font-normal text-black">
										<FormattedMessage id="panel.member.personalInformation" />
									</h3>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-base font-normal text-black mb-1.5 ml-1">
											<FormattedMessage id="panel.member.label.fullName" />
										</label>
										<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
											{memberFormData.fullName}
										</div>
									</div>

									<div className="grid grid-cols-2 gap-6">
										<div>
											<label className="block text-base font-normal text-black mb-1.5 ml-1">
												<FormattedMessage id="panel.member.label.gender" />
											</label>
											<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
												{memberFormData.gender === 'MALE' ? (
													<FormattedMessage id="panel.member.male" />
												) : memberFormData.gender === 'FEMALE' ? (
													<FormattedMessage id="panel.member.female" />
												) : (
													<FormattedMessage id="panel.member.notAvailable" />
												)}
											</div>
										</div>
										<div>
											<label className="block text-base font-normal text-black mb-1.5 ml-1">
												<FormattedMessage id="panel.member.label.birthDate" />
											</label>
											<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
												{memberFormData.birthDate && <FormattedDate value={new Date(memberFormData.birthDate)} />}
											</div>
										</div>
									</div>

									{/* Place of Origin */}
									<div>
										<label className="block text-base font-normal text-black mb-1.5 ml-1">
											<FormattedMessage id="panel.member.label.placeOfOrigin" />
										</label>
										<div className="space-y-4">
											{placesOfOrigin.map((place, index) => (
												<div key={place.id} className="space-y-3">
													<div>
														<label className="block text-xs text-black/70 mb-1.5 ml-1">
															<FormattedMessage id="panel.member.locationNumber" values={{ number: index + 1 }} />
														</label>
														<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
															{place.location || <FormattedMessage id="panel.member.notAvailable" />}
														</div>
													</div>
													<div className="flex gap-4">
														<div className="flex-1">
															<label className="block text-xs text-black/70 mb-1.5 ml-1">
																<FormattedMessage id="panel.member.label.startDate" />
															</label>
															<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
																{place.startDate ? (
																	new Date(place.startDate).toLocaleDateString()
																) : (
																	<FormattedMessage id="panel.member.notAvailable" />
																)}
															</div>
														</div>
														<div className="flex-1">
															<label className="block text-xs text-black/70 mb-1.5 ml-1">
																<FormattedMessage id="panel.member.label.endDate" />
															</label>
															<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
																{place.endDate ? (
																	new Date(place.endDate).toLocaleDateString()
																) : (
																	<FormattedMessage id="panel.member.notAvailable" />
																)}
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
										<p className="text-xs text-black/50 mt-2">
											<FormattedMessage id="panel.member.note.maxPlaces" />
										</p>
									</div>

									{/* Occupation */}
									<div>
										<label className="block text-base font-normal text-black mb-1.5 ml-1">
											<FormattedMessage id="panel.member.label.occupation" />
										</label>
										<div className="space-y-4">
											{occupations.map((occ, index) => (
												<div key={occ.id} className="space-y-3">
													<div>
														<label className="block text-xs text-black/70 mb-1.5 ml-1">
															<FormattedMessage id="panel.member.jobTitleNumber" values={{ number: index + 1 }} />
														</label>
														<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
															{occ.jobTitle || <FormattedMessage id="panel.member.notAvailable" />}
														</div>
													</div>
													<div className="flex gap-4">
														<div className="flex-1">
															<label className="block text-xs text-black/70 mb-1.5 ml-1">
																<FormattedMessage id="panel.member.label.startDate" />
															</label>
															<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
																{occ.startDate ? (
																	<FormattedDate value={new Date(occ.startDate)} />
																) : (
																	<FormattedMessage id="panel.member.notAvailable" />
																)}
															</div>
														</div>
														<div className="flex-1">
															<label className="block text-xs text-black/70 mb-1.5 ml-1">
																<FormattedMessage id="panel.member.label.endDate" />
															</label>
															<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
																{occ.endDate ? (
																	<FormattedDate value={new Date(occ.endDate)} />
																) : (
																	<FormattedMessage id="panel.member.notAvailable" />
																)}
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
										<p className="text-xs text-black/50 mt-2">
											<FormattedMessage id="panel.member.note.maxOccupations" />
										</p>
									</div>

									{/* Address */}
									<div>
										<label className="block text-base font-normal text-black mb-1.5 ml-1">
											<FormattedMessage id="panel.member.label.address" />
										</label>
										<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
											{memberFormData.address}
										</div>
									</div>

									{/* Profile Picture */}
									<div>
										<div className="flex items-center mb-2">
											<label className="text-base font-normal text-black mr-1.5">
												<FormattedMessage id="panel.member.label.profilePicture" />
											</label>
											<span className="text-[11.5px] text-black/50">
												<FormattedMessage id="common.optional" />
											</span>
										</div>
										<div className="w-[100px] h-[100px] bg-gray-200 overflow-hidden border border-black/10">
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
													<FormattedMessage id="panel.member.noImage" />
												</div>
											)}
										</div>
									</div>
								</div>
							</section>

							{/* Only show Family Connection section if not root person */}
							{!member?.isRootPerson && (
								<>
									<div className="w-full h-px bg-black/20 my-10"></div>

									{/* Family Connection Section */}
									<section>
										<div className="flex items-center mb-6">
											<div className="w-5 h-5 mr-3">
												<Heart className="w-full h-full text-black" strokeWidth={1.5} />
											</div>
											<h3 className="text-base font-normal text-black">
												<FormattedMessage id="panel.member.familyConnection" />
											</h3>
										</div>

										<div className="space-y-6">
											<div>
												<label className="block text-base font-normal text-black mb-1.5 ml-1">
													<FormattedMessage id="panel.member.label.relatedMember" />
												</label>
												<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
													{memberFormData.relatedMemberId ? (
														existingMembers.find((m) => m.id.toString() === memberFormData.relatedMemberId)
															?.fullName || <FormattedMessage id="panel.common.notAvailable" />
													) : (
														<FormattedMessage id="panel.common.notAvailable" />
													)}
												</div>
											</div>

											<div>
												<label className="block text-base font-normal text-black mb-1.5 ml-1">
													<FormattedMessage id="panel.member.label.relationship" />
												</label>
												<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
													{memberFormData.relationship === 'parent' ? (
														<FormattedMessage id="panel.member.parent" />
													) : memberFormData.relationship === 'spouse' ? (
														<FormattedMessage id="panel.member.spouse" />
													) : (
														<FormattedMessage id="panel.common.notAvailable" />
													)}
												</div>
											</div>

											<div>
												<label className="block text-base font-normal text-black mb-1.5 ml-1">
													<FormattedMessage id="panel.member.label.relationshipDate" />
												</label>
												<div className="bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black">
													{memberFormData.relationshipDate ? (
														new Date(memberFormData.relationshipDate).toLocaleDateString()
													) : (
														<FormattedMessage id="panel.common.notAvailable" />
													)}
												</div>
											</div>
										</div>
									</section>
								</>
							)}

							{/* Footer Buttons */}
							<div className="flex justify-center items-center space-x-4 pt-10 pb-10">
								<button
									onClick={onClose}
									className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
								>
									<FormattedMessage id="panel.common.back" />
								</button>
								{canEdit && (
									<button
										onClick={() => setMode('edit')}
										className="w-[123px] h-[40px] bg-[#1f2937] text-white rounded-[10px] font-bold text-sm hover:bg-[#111827] transition-colors flex items-center justify-center"
									>
										<FormattedMessage id="panel.common.edit" />
									</button>
								)}
							</div>
						</div>
					</div>
				) : (
					/* Add/Edit Mode */
					<div className="flex-1 overflow-y-auto px-10 py-8">
						<h2 className="text-[26px] font-normal text-black text-center mb-10">
							{isAddMode ? (
								<FormattedMessage id="panel.member.addTitle" />
							) : (
								<FormattedMessage id="panel.member.editTitle" values={{ name: memberFormData.fullName }} />
							)}
						</h2>

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
									<h3 className="text-base font-normal text-black">
										<FormattedMessage id="panel.member.personalInformation" />
									</h3>
								</div>

								<div className="space-y-4">
									<div>
										<label className="block text-base font-normal text-black mb-1.5 ml-1">
											<FormattedMessage id="panel.member.label.fullName" />
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
											className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
											required
										/>
										{validationErrors.fullName && (
											<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.fullName}</p>
										)}
									</div>

									<div className="grid grid-cols-2 gap-6">
										<div>
											<label className="block text-base font-normal text-black mb-1.5 ml-1">
												<FormattedMessage id="panel.member.label.gender" />
											</label>
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
												<option value="">
													<FormattedMessage id="panel.member.selectGender" />
												</option>
												<option value="MALE">
													<FormattedMessage id="panel.member.male" />
												</option>
												<option value="FEMALE">
													<FormattedMessage id="panel.member.female" />
												</option>
											</select>
											{validationErrors.gender && (
												<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.gender}</p>
											)}
										</div>
										<div>
											<label className="block text-base font-normal text-black mb-1.5 ml-1">
												<FormattedMessage id="panel.member.label.birthDate" />
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
											<label className="text-base font-normal text-black">
												<FormattedMessage id="panel.member.label.placeOfOrigin" />
											</label>
											<button
												type="button"
												onClick={addPlaceOfOrigin}
												disabled={placesOfOrigin.length >= 4}
												className="text-[11.5px] text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
											>
												<FormattedMessage id="panel.member.addPlace" />
											</button>
										</div>
										{validationErrors.placesOfOrigin && (
											<p className="text-red-500 text-[10px] mb-2 ml-3">{validationErrors.placesOfOrigin}</p>
										)}
										<div className="space-y-4">
											{placesOfOrigin.map((place, index) => (
												<div key={place.id} className="relative border border-black/10 rounded-lg p-4 bg-white">
													{placesOfOrigin.length > 1 && (
														<button
															type="button"
															onClick={() => removePlaceOfOrigin(place.id)}
															className="absolute top-2 right-2 text-red-500 hover:text-red-700"
														>
															<X className="w-4 h-4" />
														</button>
													)}
													<div className="space-y-3">
														<div>
															<label className="block text-xs text-black/70 mb-1.5 ml-1">
																<FormattedMessage id="panel.member.label.origin" />
															</label>
															<div className="relative">
																<select
																	value={place.location}
																	onChange={(e) => {
																		const updated = [...placesOfOrigin];
																		updated[index].location = e.target.value;
																		setPlacesOfOrigin(updated);
																	}}
																	className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 pr-10 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none appearance-none cursor-pointer"
																	style={{
																		backgroundImage:
																			"url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
																		backgroundRepeat: 'no-repeat',
																		backgroundPosition: 'right 1rem center',
																		backgroundSize: '1.25rem',
																	}}
																>
																	<option value="">
																		<FormattedMessage id="panel.member.selectPlaceOfOrigin" />
																	</option>
																	<ProvinceList />
																</select>
															</div>
														</div>
														<div className="flex gap-4">
															<div className="flex-1">
																<label className="block text-xs text-black/70 mb-1.5 ml-1">
																	<FormattedMessage id="panel.member.label.startDate" />
																</label>
																<input
																	type="date"
																	value={place.startDate}
																	onChange={(e) => {
																		const updated = [...placesOfOrigin];
																		updated[index].startDate = e.target.value;
																		setPlacesOfOrigin(updated);
																	}}
																	className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
																/>
															</div>
															<div className="flex-1">
																<label className="block text-xs text-black/70 mb-1.5 ml-1">
																	<FormattedMessage id="panel.member.label.endDate" />
																</label>
																<input
																	type="date"
																	value={place.endDate}
																	onChange={(e) => {
																		const updated = [...placesOfOrigin];
																		updated[index].endDate = e.target.value;
																		setPlacesOfOrigin(updated);
																	}}
																	className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
																/>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
										<p className="text-xs text-black/50 mt-2">
											<FormattedMessage id="panel.member.note.maxPlaces" />
										</p>
									</div>

									{/* Occupation */}
									<div>
										<div className="flex justify-between items-center mb-1.5 ml-1">
											<label className="text-base font-normal text-black">
												<FormattedMessage id="panel.member.label.occupation" />
											</label>
											<button
												type="button"
												onClick={addOccupation}
												disabled={occupations.length >= 15}
												className="text-[11.5px] text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
											>
												<FormattedMessage id="panel.member.addOccupation" />
											</button>
										</div>
										{validationErrors.occupations && (
											<p className="text-red-500 text-[10px] mb-2 ml-3">{validationErrors.occupations}</p>
										)}
										<div className="space-y-4">
											{occupations.map((occ, index) => (
												<div key={occ.id} className="relative border border-black/10 rounded-lg p-4 bg-white">
													{occupations.length > 1 && (
														<button
															type="button"
															onClick={() => removeOccupation(occ.id)}
															className="absolute top-2 right-2 text-red-500 hover:text-red-700"
														>
															<X className="w-4 h-4" />
														</button>
													)}
													<div className="space-y-3">
														<div>
															<label className="block text-xs text-black/70 mb-1.5 ml-1">
																<FormattedMessage id="panel.member.label.jobTitle" values={{ index: index + 1 }} />
															</label>
															<input
																type="text"
																value={occ.jobTitle}
																onChange={(e) => {
																	const updated = [...occupations];
																	updated[index].jobTitle = e.target.value;
																	setOccupations(updated);
																}}
																placeholder={intl.formatMessage({ id: 'panel.member.jobTitlePlaceholder' })}
																className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
															/>
														</div>
														<div className="flex gap-4">
															<div className="flex-1">
																<label className="block text-xs text-black/70 mb-1.5 ml-1 required-label">
																	<FormattedMessage id="panel.member.label.startDate" />
																</label>
																<input
																	type="date"
																	value={occ.startDate}
																	onChange={(e) => {
																		const updated = [...occupations];
																		updated[index].startDate = e.target.value;
																		setOccupations(updated);
																	}}
																	className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
																/>
															</div>
															<div className="flex-1">
																<label className="block text-xs text-black/70 mb-1.5 ml-1">
																	<FormattedMessage id="panel.member.label.endDate" />
																</label>
																<input
																	type="date"
																	value={occ.endDate}
																	onChange={(e) => {
																		const updated = [...occupations];
																		updated[index].endDate = e.target.value;
																		setOccupations(updated);
																	}}
																	className="w-full bg-[#f3f2f2] border border-black/50 rounded-[30px] px-5 py-2 text-xs text-black focus:ring-1 focus:ring-black/30 outline-none"
																/>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
										<p className="text-xs text-black/50 mt-2">
											<FormattedMessage id="panel.member.note.maxOccupations" />
										</p>
									</div>

									{/* Address */}
									<div>
										<label className="block text-base font-normal text-black mb-1.5 ml-1">
											<FormattedMessage id="panel.member.label.address" />
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
											placeholder={intl.formatMessage({ id: 'panel.member.addressPlaceholder' })}
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
											<label className="text-base font-normal text-black mr-1.5">
												<FormattedMessage id="panel.member.label.profilePicture" />
											</label>
											<span className="text-[11.5px] text-black/50">
												<FormattedMessage id="common.optional" />
											</span>
										</div>
										<div className="flex items-center space-x-6">
											<div className="w-[100px] h-[100px] bg-gray-200 overflow-hidden border border-black/10">
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
											</div>
											<label className="cursor-pointer bg-white border border-black/30 rounded-[10px] px-4 py-2 text-xs text-black hover:bg-gray-50 transition-colors">
												<FormattedMessage id="panel.common.chooseFile" />
												<input
													type="file"
													accept="image/jpeg,image/png,image/gif,image/webp"
													onChange={handleFileUpload}
													className="hidden"
												/>
											</label>
										</div>
									</div>
								</div>
							</section>

							{/* Only show Family Connection section if not root person or in add mode with existing members */}
							{((isAddMode && existingMembers.length > 0) || (!isAddMode && !member?.isRootPerson)) && (
								<>
									<div className="w-full h-px bg-black/20 my-10"></div>

									{/* Family Connection Section */}
									<section>
										<div className="flex items-center mb-6">
											<div className="w-5 h-5 mr-3">
												<Heart className="w-full h-full text-black" strokeWidth={1.5} />
											</div>
											<h3 className="text-base font-normal text-black">
												<FormattedMessage id="panel.member.familyConnection" />
											</h3>
										</div>

										<div className="space-y-6">
											<div>
												<label className="block text-base font-normal text-black mb-1.5 ml-1">
													<FormattedMessage id="panel.member.relatedMember" />
												</label>
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
													<option value="">
														<FormattedMessage id="panel.member.selectFamilyMember" />
													</option>
													{existingMembers
														.filter((m) => (isAddMode ? true : m.id !== memberId))
														.map((m) => (
															<option key={m.id} value={m.id}>
																{m.fullName}
															</option>
														))}
												</select>
												{validationErrors.relatedMemberId && (
													<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.relatedMemberId}</p>
												)}
											</div>

											<div>
												<label className="block text-base font-normal text-black mb-1.5 ml-1">
													<FormattedMessage id="panel.member.label.relationship" />
												</label>
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
													<option value="">
														<FormattedMessage id="panel.member.selectRelationship" />
													</option>
													<option value="parent">
														<FormattedMessage id="panel.member.parent" />
													</option>
													<option value="spouse">
														<FormattedMessage id="panel.member.spouse" />
													</option>
												</select>
												{validationErrors.relationship && (
													<p className="text-red-500 text-[10px] mt-1 ml-3">{validationErrors.relationship}</p>
												)}
											</div>

											<div>
												<label className="block text-base font-normal text-black mb-1.5 ml-1 required-label">
													<FormattedMessage id="panel.member.relationshipDate" />
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
												<div className="flex items-start space-x-2 mt-2 ml-3">
													<Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
													<p className="text-[10px] text-black/50">
														{memberFormData.relationship === 'parent' ? (
															<FormattedMessage id="panel.member.parentRelationshipHint" />
														) : memberFormData.relationship === 'spouse' ? (
															<FormattedMessage id="panel.member.spouseRelationshipHint" />
														) : (
															<FormattedMessage id="panel.member.selectRelationshipHint" />
														)}
													</p>
												</div>
											</div>

											{memberFormData.relationship === 'parent' && memberFormData.relatedMemberId && (
												<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
													<div className="flex items-start space-x-3">
														<AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
														<div>
															<p className="text-xs text-blue-900 font-medium">
																<FormattedMessage id="panel.member.parentRelationshipInfo" />
															</p>
															<p className="text-[10px] text-blue-700 mt-1">
																<FormattedMessage
																	id="panel.member.parentRelationshipDetails"
																	values={{
																		memberName:
																			memberFormData.fullName || intl.formatMessage({ id: 'panel.member.thisPerson' }),
																		parentName:
																			existingMembers.find((m) => m.id.toString() === memberFormData.relatedMemberId)
																				?.fullName || '',
																	}}
																/>
															</p>
														</div>
													</div>
												</div>
											)}

											{memberFormData.relationship === 'spouse' && memberFormData.relatedMemberId && (
												<div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
													<div className="flex items-start space-x-3">
														<Heart className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
														<div>
															<p className="text-xs text-pink-900 font-medium">
																<FormattedMessage id="panel.member.spouseRelationshipInfo" />
															</p>
															<p className="text-[10px] text-pink-700 mt-1">
																<FormattedMessage
																	id="panel.member.spouseRelationshipDetails"
																	values={{
																		memberName:
																			memberFormData.fullName || intl.formatMessage({ id: 'panel.member.thisPerson' }),
																		spouseName:
																			existingMembers.find((m) => m.id.toString() === memberFormData.relatedMemberId)
																				?.fullName || '',
																	}}
																/>
															</p>
														</div>
													</div>
												</div>
											)}
										</div>
									</section>
								</>
							)}

							{/* Confirmation Checkbox */}
							<div className="flex items-start space-x-3 pt-6">
								<input
									type="checkbox"
									id="confirm-accuracy"
									checked={confirmAccuracy}
									onChange={(e) => setConfirmAccuracy(e.target.checked)}
									className="mt-1 h-4 w-4 text-black border-black/30 rounded focus:ring-black/20"
								/>
								<div>
									<label htmlFor="confirm-accuracy" className="text-sm text-black font-medium">
										<FormattedMessage id="panel.member.confirmAccuracy" />
									</label>
									<p className="text-[10px] text-black/40 mt-0.5">
										<FormattedMessage id="panel.member.confirmAccuracyHint" />
									</p>
								</div>
							</div>

							{/* General Error */}
							{generalError && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
									<Info className="w-4 h-4 text-red-600 mr-2" />
									<p className="text-red-800 text-[11px]">{generalError}</p>
								</div>
							)}

							{/* Footer Buttons */}
							<div className="flex justify-center items-center space-x-4 pt-10 pb-10">
								<button
									type="button"
									onClick={isEditMode ? () => setMode('view') : onClose}
									className="w-[95px] h-[40px] border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
								>
									{isEditMode ? <FormattedMessage id="common.cancel" /> : <FormattedMessage id="common.back" />}
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									className="w-[150px] h-[40px] bg-[#1f2937] text-white rounded-[10px] font-bold text-sm hover:bg-[#111827] transition-colors flex items-center justify-center disabled:opacity-50"
								>
									{isSubmitting ? (
										isAddMode ? (
											<FormattedMessage id="panel.member.adding" />
										) : (
											<FormattedMessage id="panel.member.updating" />
										)
									) : isAddMode ? (
										<FormattedMessage id="panel.member.addMember" />
									) : (
										<FormattedMessage id="panel.member.updateMember" />
									)}
								</button>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}
