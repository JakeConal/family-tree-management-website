'use client';

import { ChevronLeft, Heart } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';

import LoadingScreen from '@/components/LoadingScreen';
import { FamilyMember } from '@/types';

interface Marriage {
	id: number;
	familyMember1: {
		id: number;
		fullName: string;
	};
	familyMember2: {
		id: number;
		fullName: string;
	};
	marriageDate: Date;
	divorceDate: Date | null;
}

interface MarriagePanelProps {
	mode: 'view' | 'edit';
	relationshipId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
	onSuccess: () => void;
}

export default function MarriagePanel({
	mode,
	relationshipId,
	familyTreeId,
	familyMembers,
	onModeChange,
	onClose,
	onSuccess,
}: MarriagePanelProps) {
	const [marriage, setMarriage] = useState<Marriage | null>(null);
	const [loading, setLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		marriageDate: '',
	});

	const [member1BirthDate, setMember1BirthDate] = useState<string>('');
	const [member2BirthDate, setMember2BirthDate] = useState<string>('');

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const fetchMarriage = useCallback(async () => {
		if (!relationshipId) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/family-trees/${familyTreeId}/life-events/${relationshipId}`);
			if (res.ok) {
				const data = await res.json();
				setMarriage(data);

				// Populate form data
				setFormData({
					marriageDate: new Date(data.marriageDate).toISOString().split('T')[0],
				});

				// Set member birth dates
				const member1 = familyMembers.find((m) => m.id === data.familyMember1.id);
				const member2 = familyMembers.find((m) => m.id === data.familyMember2.id);

				if (member1?.birthday) {
					setMember1BirthDate(new Date(member1.birthday).toISOString().split('T')[0]);
				}
				if (member2?.birthday) {
					setMember2BirthDate(new Date(member2.birthday).toISOString().split('T')[0]);
				}
			} else {
				const error = await res.json();
				toast.error(error.error || 'Failed to load marriage information');
				onClose();
			}
		} catch (error) {
			console.error('Error fetching marriage:', error);
			toast.error('Failed to load marriage information');
			onClose();
		} finally {
			setLoading(false);
		}
	}, [relationshipId, familyTreeId, familyMembers, onClose]);

	useEffect(() => {
		fetchMarriage();
	}, [fetchMarriage]);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.marriageDate) {
			newErrors.marriageDate = 'Marriage date is required';
		} else {
			const marriageDate = new Date(formData.marriageDate);
			const today = new Date();

			if (marriageDate > today) {
				newErrors.marriageDate = 'Marriage date cannot be in the future';
			}

			if (member1BirthDate) {
				const member1Date = new Date(member1BirthDate);
				if (marriageDate < member1Date) {
					newErrors.marriageDate = "Marriage date must be after first member's birthday";
				}
			}

			if (member2BirthDate) {
				const member2Date = new Date(member2BirthDate);
				if (marriageDate < member2Date) {
					newErrors.marriageDate = "Marriage date must be after second member's birthday";
				}
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm() || !relationshipId) return;

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/family-trees/${familyTreeId}/life-events/${relationshipId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					marriageDate: formData.marriageDate,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				setMarriage(data);
				toast.success('Marriage information updated successfully');
				onModeChange('view');
				onSuccess();
			} else {
				const error = await res.json();
				toast.error(error.error || 'Failed to update marriage information');
			}
		} catch (error) {
			console.error('Error updating marriage:', error);
			toast.error('Failed to update marriage information');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		if (touched[name]) {
			validateForm();
		}
	};

	const handleBlur = (field: string) => {
		setTouched((prev) => ({
			...prev,
			[field]: true,
		}));
		validateForm();
	};

	if (loading) {
		return <LoadingScreen />;
	}

	if (!marriage) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<p className="text-gray-500">No marriage information found</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white">
			{/* Header */}
			<div className="border-b border-gray-200 p-6 pb-4">
				<button onClick={onClose} className="flex items-center gap-2 text-[16px] text-black mb-4 hover:opacity-70">
					<ChevronLeft className="w-4 h-4" />
					<span>Back</span>
				</button>

				<div className="flex items-center justify-center gap-4 mb-4">
					<h2 className="text-[26px] font-normal text-black">Marriage Information</h2>
				</div>
			</div>

			{/* Form Content */}
			<div className="flex-1 overflow-y-auto p-6">
				<div className="space-y-6">
					{/* Member 1 Field */}
					<div>
						<label className="block text-[16px] font-normal text-black mb-2">Member 1 *</label>
						<div className="w-full h-[35px] rounded-[30px] bg-[#f3f2f2] border border-[rgba(0,0,0,0.5)] flex items-center px-4">
							<span className="text-[12px] text-black">{marriage.familyMember1.fullName}</span>
						</div>
					</div>

					{/* Member 2 Field */}
					<div>
						<label className="block text-[16px] font-normal text-black mb-2">Member 2 *</label>
						<div className="w-full h-[35px] rounded-[30px] bg-[#f3f2f2] border border-[rgba(0,0,0,0.5)] flex items-center px-4">
							<span className="text-[12px] text-black">{marriage.familyMember2.fullName}</span>
						</div>
					</div>

					{/* Date of Marriage Field */}
					<div>
						<label className="block text-[16px] font-normal text-black mb-2">Date of Marriage *</label>
						{mode === 'view' ? (
							<div className="w-full h-[35px] rounded-[30px] bg-[#f3f2f2] border border-[rgba(0,0,0,0.5)] flex items-center px-4">
								<span className="text-[12px] text-black">
									{formData.marriageDate
										? new Date(formData.marriageDate).toLocaleDateString('en-US', {
												month: '2-digit',
												day: '2-digit',
												year: 'numeric',
											})
										: ''}
								</span>
							</div>
						) : (
							<>
								<input
									type="date"
									name="marriageDate"
									value={formData.marriageDate}
									onChange={handleInputChange}
									onBlur={() => handleBlur('marriageDate')}
									className={classNames(
										'w-full h-[35px] rounded-[30px] bg-white border-2 px-4 text-[12px]',
										'placeholder-gray-400 focus:outline-none transition-colors',
										errors.marriageDate && touched.marriageDate
											? 'border-red-500 focus:border-red-500'
											: 'border-[rgba(0,0,0,0.5)] focus:border-black'
									)}
									disabled={isSubmitting}
								/>
								{errors.marriageDate && touched.marriageDate && (
									<p className="text-red-500 text-[12px] mt-1">{errors.marriageDate}</p>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Footer - Buttons */}
			<div className="border-t border-gray-200 p-6 flex gap-4 justify-center">
				<button
					onClick={onClose}
					disabled={isSubmitting}
					className="w-[95px] h-[40px] rounded-[10px] border-2 border-black bg-white text-[14px] font-normal text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Back
				</button>

				{mode === 'view' ? (
					<button
						onClick={() => onModeChange('edit')}
						disabled={isSubmitting}
						className="w-[123px] h-[40px] rounded-[10px] bg-[#1f2937] text-[14px] font-normal text-white hover:bg-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Edit
					</button>
				) : (
					<button
						onClick={handleSave}
						disabled={isSubmitting}
						className="w-[123px] h-[40px] rounded-[10px] bg-[#1f2937] text-[14px] font-normal text-white hover:bg-[#111827] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting ? 'Saving...' : 'Save'}
					</button>
				)}
			</div>
		</div>
	);
}
