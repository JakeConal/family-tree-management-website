import { FamilyMember } from '@prisma/client';
import Image from 'next/image';
import React from 'react';
import type { ExtNode } from 'relatives-tree/lib/types';
import { Skull } from 'lucide-react';

interface ExtendedFamilyMember extends FamilyMember {
	passingRecords?: {
		id: number;
		dateOfPassing: Date;
	}[];
}

interface FamilyNodeProps {
	node: ExtNode;
	member: ExtendedFamilyMember;
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

	const getFirstName = (fullName: string) => {
		// Extract the last part of the full name as the first name
		const parts = fullName.trim().split(' ');
		return parts[parts.length - 1];
	};

	// Check if member has passed away
	const hasPassed = member.passingRecords && member.passingRecords.length > 0;

	// Gender-based background colors matching Figma
	const bgColor = member.gender === 'FEMALE' ? '#fbebf7' : '#c4d6fa';
	const borderColor = 'rgba(0,0,0,0.04)';

	return (
		<div
			className="absolute flex flex-col items-center justify-start gap-3 rounded-[32px] border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
			style={{
				...style,
				width: '160px',
				height: '240px',
				backgroundColor: bgColor,
				borderColor: borderColor,
			}}
			onClick={onClick}
		>
			{/* Profile Image Container */}
			<div className="relative">
				<div className="w-24 h-24 rounded-[20px] bg-white shadow-md overflow-hidden flex items-center justify-center border-2 border-gray-100">
					{member.profilePicture ? (
						<Image
							src={`/api/family-members/${member.id}/profile-picture`}
							alt={member.fullName}
							width={96}
							height={96}
							className="w-full h-full object-cover"
						/>
					) : (
						<span className="text-gray-600 text-2xl font-bold">
							{getFirstName(member.fullName).charAt(0).toUpperCase()}
						</span>
					)}
				</div>
				{/* Passed Away Indicator */}
				{hasPassed && (
					<div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200">
						<Skull className="w-4 h-4 text-black" />
					</div>
				)}
			</div>

			{/* First Name - Nunito Black 28px */}
			<div className="text-center w-full px-1">
				<h3 className="font-nunito font-black text-2xl text-gray-900 leading-tight truncate">
					{getFirstName(member.fullName)}
				</h3>
			</div>

			{/* Role Badge or Family Head Label */}
			{getRoleLabel() && (
				<div className="bg-gray-900 text-white px-2 py-1 rounded-full text-center">
					<span className="font-nunito font-semibold text-xs">{getRoleLabel()}</span>
				</div>
			)}

			{/* Birthday */}
			{member.birthday && (
				<div className="text-center text-xs text-gray-700">
					<div className="flex items-center justify-center gap-1">
						<span>🎂</span>
						<span className="font-nunito font-semibold text-xs">{formatDate(member.birthday)}</span>
					</div>
				</div>
			)}
		</div>
	);
}
