import { FamilyMember } from '@prisma/client';
import Image from 'next/image';
import React from 'react';

interface ExSpouseCardProps {
	member: FamilyMember;
	style: React.CSSProperties;
	onClick?: () => void;
}

export default function ExSpouseCard({ member, style, onClick }: ExSpouseCardProps) {
	const formatDate = (date: Date | null) => {
		if (!date) return '';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(date));
	};

	return (
		<div
			className="absolute flex flex-col items-center justify-start gap-1.5 rounded-[32px] border p-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
			style={{
				...style,
				width: '108px',
				height: '108px',
				backgroundColor: '#fbcbb0',
				borderColor: 'rgba(0,0,0,0.04)',
				borderWidth: '0.845px',
			}}
			onClick={onClick}
		>
			{/* Profile Image Container - Smaller */}
			<div className="w-10 h-10 rounded-[16px] bg-white shadow-sm overflow-hidden flex items-center justify-center border border-gray-100">
				{member.profilePicture ? (
					<Image
						src={`/api/family-members/${member.id}/profile-picture`}
						alt={member.fullName}
						width={40}
						height={40}
						className="w-full h-full object-cover"
						unoptimized
					/>
				) : (
					<span className="text-gray-600 text-sm font-bold">{member.fullName.charAt(0).toUpperCase()}</span>
				)}
			</div>

			{/* Full Name - Smaller */}
			<div className="text-center w-full px-0.5">
				<h3 className="font-nunito font-black text-xs text-gray-900 leading-tight truncate">{member.fullName}</h3>
			</div>

			{/* Role Badge */}
			<div className="bg-gray-900 text-white px-1 py-0.5 rounded-sm text-center">
				<span className="font-nunito font-semibold text-xs leading-none">Ex Husband</span>
			</div>

			{/* Birthday - Smaller */}
			{member.birthday && (
				<div className="text-center text-xs text-gray-700 leading-none">
					<div className="flex items-center justify-center gap-0.5">
						<span className="text-2xs">🎂</span>
						<span className="font-nunito font-semibold text-xs">{formatDate(member.birthday)}</span>
					</div>
				</div>
			)}
		</div>
	);
}
