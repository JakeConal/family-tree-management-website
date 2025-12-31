import { FamilyMember } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import type { ExtNode } from 'relatives-tree/lib/types';

interface FamilyNodeProps {
	node: ExtNode;
	member: FamilyMember;
	style: React.CSSProperties;
	onClick?: () => void;
}

export default function FamilyNode({ member, style, onClick }: FamilyNodeProps) {
	const formatDate = (date: Date | null) => {
		if (!date) return '';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(date));
	};

	const getRoleLabel = () => {
		// Only show "Family Head" for the root person
		if (member.isRootPerson) return 'Family Head';
		return '';
	};

	return (
		<div
			className={`
        absolute rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105
        ${member.gender === 'FEMALE' ? 'bg-blue-50 border-blue-200' : 'bg-pink-50 border-pink-200'}
        border-2 p-3 cursor-pointer
      `}
			style={{
				...style,
				width: '150px',
				height: '200px',
			}}
			onClick={onClick}
		>
			{/* Profile Image */}
			<div className="flex justify-center mb-2">
				<div className="w-20 h-20 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden">
					{member.profilePicture ? (
						<Image
							src={`/api/family-members/${member.id}/profile-picture`}
							alt={member.fullName}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-gray-600 text-xl font-bold">{member.fullName.charAt(0).toUpperCase()}</span>
					)}
				</div>
			</div>

			{/* Full Name */}
			<div className="text-center mb-1">
				<h3 className="font-bold text-sm text-gray-800 truncate">{member.fullName}</h3>
			</div>

			{/* Role Label */}
			{getRoleLabel() && (
				<div className="text-center mb-2">
					<span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
						{getRoleLabel()}
					</span>
				</div>
			)}

			{/* Date of Birth */}
			{member.birthday && (
				<div className="text-center mb-2">
					<div className="flex items-center justify-center text-gray-500 text-xs">
						<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
								clipRule="evenodd"
							/>
						</svg>
						{formatDate(member.birthday)}
					</div>
				</div>
			)}
		</div>
	);
}
