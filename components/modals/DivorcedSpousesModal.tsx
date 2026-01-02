import { FamilyMember } from '@prisma/client';
import { X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface ExtendedFamilyMember extends FamilyMember {
	hasProfilePicture?: boolean;
	divorceDate?: Date | null;
}

interface DivorcedSpousesModalProps {
	isOpen: boolean;
	onClose: () => void;
	spouses: ExtendedFamilyMember[];
	memberName: string;
	onSpouseClick?: (spouseId: number) => void;
}

export default function DivorcedSpousesModal({
	isOpen,
	onClose,
	spouses,
	memberName,
	onSpouseClick,
}: DivorcedSpousesModalProps) {
	if (!isOpen) return null;

	const formatDate = (date: Date | null | undefined) => {
		if (!date) return 'Unknown';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(date));
	};

	const getFirstName = (fullName: string) => {
		const parts = fullName.trim().split(' ');
		return parts[parts.length - 1];
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-50" onClick={onClose}>
			<div
				className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
					<h2 className="text-xl font-nunito font-black text-gray-900">Former Spouses of {getFirstName(memberName)}</h2>
					<button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close">
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				{/* Content */}
				<div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-80px)]">
					{spouses.length === 0 ? (
						<div className="text-center py-8 text-gray-500">No divorced spouses found</div>
					) : (
						<div className="space-y-3">
							{spouses.map((spouse) => (
								<div
									key={spouse.id}
									className="flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 rounded-2xl border-2 border-orange-200 cursor-pointer transition-all duration-200 hover:shadow-md"
									onClick={() => {
										if (onSpouseClick) {
											onSpouseClick(spouse.id);
										}
										onClose();
									}}
								>
									{/* Profile Picture */}
									<div className="flex-shrink-0">
										<div className="w-16 h-16 rounded-xl bg-white shadow-sm overflow-hidden flex items-center justify-center border-2 border-gray-100">
											{spouse.hasProfilePicture ? (
												<Image
													src={`/api/family-members/${spouse.id}/profile-picture`}
													alt={spouse.fullName}
													width={64}
													height={64}
													className="w-full h-full object-cover"
													unoptimized
												/>
											) : (
												<span className="text-gray-600 text-xl font-bold">
													{getFirstName(spouse.fullName).charAt(0).toUpperCase()}
												</span>
											)}
										</div>
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<h3 className="font-nunito font-black text-lg text-gray-900 truncate">{spouse.fullName}</h3>
										<div className="flex items-center gap-2 mt-1">
											<span className="text-xs font-inter font-semibold text-gray-600">
												{spouse.gender === 'MALE' ? 'Ex-Husband' : 'Ex-Wife'}
											</span>
										</div>
										{spouse.divorceDate && (
											<div className="text-xs text-gray-600 mt-1">Divorced: {formatDate(spouse.divorceDate)}</div>
										)}
									</div>

									{/* Arrow */}
									<div className="flex-shrink-0">
										<svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
