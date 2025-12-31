'use client';

import { ChevronLeft, Baby } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import classNames from 'classnames';

import LoadingScreen from '@/components/LoadingScreen';
import { FamilyMember } from '@/types';

interface BirthRecord {
	parent: {
		id: number;
		fullName: string;
	};
	child: {
		id: number;
		fullName: string;
	};
	birthDate: Date | null;
}

interface BirthPanelProps {
	mode: 'view' | 'edit';
	childMemberId?: number;
	familyTreeId: string;
	familyMembers: FamilyMember[];
	onModeChange: (mode: 'view' | 'edit') => void;
	onClose: () => void;
	onSuccess: () => void;
}

export default function BirthPanel({
	mode,
	childMemberId,
	familyTreeId,
	familyMembers,
	onModeChange,
	onClose,
	onSuccess,
}: BirthPanelProps) {
	const [birthRecord, setBirthRecord] = useState<BirthRecord | null>(null);
	const [loading, setLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState({
		birthDate: '',
	});

	const [selectedChildBirthDate, setSelectedChildBirthDate] = useState<string>('');
	const [parentBirthDate, setParentBirthDate] = useState<string>('');

	// Validation state
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const fetchBirthRecord = useCallback(async () => {
		if (!childMemberId) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/family-trees/${familyTreeId}/birth-records/${childMemberId}`);
			if (res.ok) {
				const data = await res.json();
				setBirthRecord(data);

				// Populate form data
				setFormData({
					birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
				});

				// Set child birth date for validation
				const childMember = familyMembers.find((m) => m.id === data.child.id);
				if (childMember?.birthday) {
					setSelectedChildBirthDate(new Date(childMember.birthday).toISOString().split('T')[0]);
				}

				// Set parent birth date
				if (data.parent?.birthday) {
					setParentBirthDate(new Date(data.parent.birthday).toISOString().split('T')[0]);
				}
			} else {
				const error = await res.json();
				toast.error(error.error || 'Failed to load birth information');
				onClose();
			}
		} catch (error) {
			console.error('Error fetching birth record:', error);
			toast.error('Failed to load birth information');
			onClose();
		} finally {
			setLoading(false);
		}
	}, [childMemberId, familyTreeId, familyMembers, onClose]);

	useEffect(() => {
		fetchBirthRecord();
	}, [fetchBirthRecord]);

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.birthDate) {
			newErrors.birthDate = 'Birth date is required';
		} else {
			const birthDate = new Date(formData.birthDate);
			const today = new Date();

			if (birthDate > today) {
				newErrors.birthDate = 'Birth date cannot be in the future';
			}

			if (parentBirthDate) {
				const parentDate = new Date(parentBirthDate);
				if (birthDate < parentDate) {
					newErrors.birthDate = 'Birth date must be after parent\'s birthday';
				}
			}

			if (selectedChildBirthDate && formData.birthDate !== selectedChildBirthDate) {
				// Warn if different from child's birthday
				console.warn('Birth date differs from child member\'s birthday');
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validateForm() || !childMemberId) return;

		setIsSubmitting(true);
		try {
			const res = await fetch(`/api/family-trees/${familyTreeId}/birth-records/${childMemberId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					birthDate: formData.birthDate,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				setBirthRecord(data);
				toast.success('Birth information updated successfully');
				onModeChange('view');
				onSuccess();
			} else {
				const error = await res.json();
				toast.error(error.error || 'Failed to update birth information');
			}
		} catch (error) {
			console.error('Error updating birth record:', error);
			toast.error('Failed to update birth information');
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

	if (!birthRecord) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<p className="text-gray-500">No birth information found</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white">
			{/* Header */}
			<div className="border-b border-gray-200 p-6 pb-4">
				<button
					onClick={onClose}
					className="flex items-center gap-2 text-[16px] text-black mb-4 hover:opacity-70"
				>
					<ChevronLeft className="w-4 h-4" />
					<span>Back</span>
				</button>

				<div className="flex items-center justify-center gap-4 mb-4">
					<Baby className="w-[50px] h-[50px] text-black" />
					<h2 className="text-[26px] font-normal text-black">Birth Information</h2>
				</div>
			</div>

			{/* Form Content */}
			<div className="flex-1 overflow-y-auto p-6">
				<div className="space-y-6">
					{/* Parent Field */}
					<div>
						<label className="block text-[16px] font-normal text-black mb-2">Parent *</label>
						<div className="w-full h-[35px] rounded-[30px] bg-[#f3f2f2] border border-[rgba(0,0,0,0.5)] flex items-center px-4">
							<span className="text-[12px] text-black">{birthRecord.parent.fullName}</span>
						</div>
					</div>

					{/* Child Field */}
					<div>
						<label className="block text-[16px] font-normal text-black mb-2">Child *</label>
						<div className="w-full h-[35px] rounded-[30px] bg-[#f3f2f2] border border-[rgba(0,0,0,0.5)] flex items-center px-4">
							<span className="text-[12px] text-black">{birthRecord.child.fullName}</span>
						</div>
					</div>

					{/* Date of Child's Birth Field */}
					<div>
						<label className="block text-[16px] font-normal text-black mb-2">
							Date of Child's Birth *
						</label>
						{mode === 'view' ? (
							<div className="w-full h-[35px] rounded-[30px] bg-[#f3f2f2] border border-[rgba(0,0,0,0.5)] flex items-center px-4">
								<span className="text-[12px] text-black">
									{formData.birthDate
										? new Date(formData.birthDate).toLocaleDateString('en-US', {
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
									name="birthDate"
									value={formData.birthDate}
									onChange={handleInputChange}
									onBlur={() => handleBlur('birthDate')}
									className={classNames(
										'w-full h-[35px] rounded-[30px] bg-white border-2 px-4 text-[12px]',
										'placeholder-gray-400 focus:outline-none transition-colors',
										errors.birthDate && touched.birthDate
											? 'border-red-500 focus:border-red-500'
											: 'border-[rgba(0,0,0,0.5)] focus:border-black'
									)}
									disabled={isSubmitting}
								/>
								{errors.birthDate && touched.birthDate && (
									<p className="text-red-500 text-[12px] mt-1">{errors.birthDate}</p>
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

