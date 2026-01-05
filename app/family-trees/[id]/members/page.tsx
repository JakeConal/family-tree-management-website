'use client';

import { Search, Eye, Pencil, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import GenerateAccessCodePanel from '@/components/modals/GenerateAccessCodeModal';
import PanelRenderer from '@/components/PanelRenderer';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import { usePanel } from '@/lib/hooks/usePanel';
import { FamilyTreeService } from '@/lib/services';
import { FamilyMember } from '@/types';

const MemberAvatar = ({
	memberId,
	fullName,
	hasProfilePicture,
}: {
	memberId: number;
	fullName: string;
	hasProfilePicture?: boolean | null;
}) => {
	const [error, setError] = useState(false);

	// Use the profile picture API only if we know it exists and haven't encountered an error
	const src =
		!error && hasProfilePicture ? `/api/family-members/${memberId}/profile-picture` : '/images/forrest-avatar.svg';

	return (
		<div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 relative">
			<Image
				src={src}
				alt={fullName}
				width={40}
				height={40}
				className="object-cover w-full h-full"
				onError={() => setError(true)}
				unoptimized
			/>
		</div>
	);
};

// Controls Component
interface MemberControlsProps {
	selectedGeneration: string;
	searchQuery: string;
	generations: string[];
	parents: { id: number; fullName: string }[];
	selectedParent: string;
	birthDateRange: { from: string; to: string };
	onGenerationChange: (gen: string) => void;
	onSearchChange: (query: string) => void;
	onParentChange: (parentId: string) => void;
	onBirthDateRangeChange: (range: { from: string; to: string }) => void;
}

const MemberControls = ({
	selectedGeneration,
	searchQuery,
	generations,
	parents,
	selectedParent,
	birthDateRange,
	onGenerationChange,
	onSearchChange,
	onParentChange,
	onBirthDateRangeChange,
}: MemberControlsProps) => {
	const intl = useIntl();
	return (
		<div className="mb-4 sm:mb-6 bg-[#f4f4f5] p-3 sm:p-4 rounded-xl">
			{/* All Filters in One Row */}
			<div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 items-center">
				{/* Generation Filter */}
				<div className="relative shrink-0 w-full sm:w-auto">
					<select
						value={selectedGeneration}
						onChange={(e) => onGenerationChange(e.target.value)}
						className="appearance-none bg-white h-10.75 w-full sm:w-auto px-4 sm:px-6 pr-10 mr-2 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 cursor-pointer outline-none"
					>
						{generations.map((gen) => (
							<option key={gen} value={gen}>
								{gen === 'All Generation' ? <FormattedMessage id="memberList.controls.allGeneration" /> : gen}
							</option>
						))}
					</select>
					<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
						<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M1 1L6 6L11 1" stroke="black" strokeWidth="2" strokeLinecap="round" />
						</svg>
					</div>
				</div>

				{/* Search by Name */}
				<div className="relative flex-1 w-full sm:min-w-50">
					<Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
					<input
						type="text"
						placeholder={intl.formatMessage({ id: 'memberList.controls.searchByName' })}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full bg-white h-10.75 pl-10 sm:pl-12 pr-4 sm:pr-6 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 outline-none"
					/>
				</div>

				{/* Search by Birth Date From */}
				<div className="relative shrink-0 flex items-center gap-2 w-full sm:w-auto">
					<span className="text-sm sm:text-[16px] font-inter text-black">
						<FormattedMessage id="memberList.controls.from" />
					</span>
					<input
						type="date"
						placeholder={intl.formatMessage({ id: 'memberList.controls.birthDateFromPlaceholder' })}
						value={birthDateRange.from}
						onChange={(e) => onBirthDateRangeChange({ ...birthDateRange, from: e.target.value })}
						className="flex-1 sm:flex-none bg-white h-10.75 px-3 sm:px-4 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 outline-none"
					/>
				</div>

				{/* Search by Birth Date To */}
				<div className="relative shrink-0 flex items-center gap-2 w-full sm:w-auto">
					<span className="text-sm sm:text-[16px] font-inter text-black">
						<FormattedMessage id="memberList.controls.to" />
					</span>
					<input
						type="date"
						placeholder={intl.formatMessage({ id: 'memberList.controls.birthDateToPlaceholder' })}
						value={birthDateRange.to}
						onChange={(e) => onBirthDateRangeChange({ ...birthDateRange, to: e.target.value })}
						className="flex-1 sm:flex-none bg-white h-10.75 px-3 sm:px-4 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 outline-none"
					/>
				</div>

				{/* Search by Parent */}
				<div className="relative shrink-0 w-full sm:w-auto">
					<select
						value={selectedParent}
						onChange={(e) => onParentChange(e.target.value)}
						className="appearance-none bg-white h-10.75 w-full sm:w-auto px-4 sm:px-6 pr-10 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 cursor-pointer outline-none sm:min-w-45"
					>
						<option value="">
							<FormattedMessage id="memberList.controls.allParents" />
						</option>
						{parents.map((parent) => (
							<option key={parent.id} value={parent.id.toString()}>
								{parent.fullName}
							</option>
						))}
					</select>
					<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
						<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M1 1L6 6L11 1" stroke="black" strokeWidth="2" strokeLinecap="round" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
};

// Table Component
interface MemberTableProps {
	members: FamilyMember[];
	onViewMember: (id: number) => void;
	onEditMember: (id: number) => void;
	onGenerateAccessCode: (id: number, name: string) => void;
	isGuest: boolean;
	guestMemberId: number | null;
}

const MemberTable = ({
	members,
	onViewMember,
	onEditMember,
	onGenerateAccessCode,
	isGuest,
	guestMemberId,
}: MemberTableProps) => {
	const intl = useIntl();
	return (
		<div className="rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
			<table className="w-full border-collapse text-left min-w-160">
				<thead className="sticky top-0 bg-white z-10">
					<tr className="border-b border-gray-100">
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center w-16 sm:w-20">
							<FormattedMessage id="memberList.table.no" />
						</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black">
							<FormattedMessage id="memberList.table.fullName" />
						</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center">
							<FormattedMessage id="memberList.table.birthDate" />
						</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center">
							<FormattedMessage id="memberList.table.genNo" />
						</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black hidden md:table-cell">
							<FormattedMessage id="memberList.table.parent" />
						</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center">
							<FormattedMessage id="memberList.table.action" />
						</th>
					</tr>
				</thead>
				<tbody>
					{members.map((member, index) => (
						<tr
							key={member.id}
							className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'} hover:bg-gray-50 transition-colors`}
						>
							<td className="px-6 py-4 font-playfair text-[16px] text-black text-center">{index + 1}</td>
							<td className="px-6 py-4">
								<div className="flex items-center gap-3">
									<MemberAvatar
										memberId={member.id}
										fullName={member.fullName}
										hasProfilePicture={member.hasProfilePicture}
									/>
									<span className="font-playfair text-[16px] text-black">{member.fullName}</span>
								</div>
							</td>
							<td className="px-6 py-4 font-playfair text-[16px] text-black text-center">
								{member.birthday ? (
									new Date(member.birthday).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short',
										year: 'numeric',
									})
								) : (
									<FormattedMessage id="memberList.common.dash" />
								)}
							</td>
							<td className="px-6 py-4 font-playfair text-[16px] text-black text-center">
								<FormattedMessage id="memberList.common.generationPrefix" values={{ number: member.generation }} />
							</td>
							<td className="px-6 py-4 font-playfair text-[16px] text-black">
								{member.parent?.fullName || <FormattedMessage id="memberList.common.dash" />}
							</td>
							<td className="px-6 py-4">
								<div className="flex items-center justify-center gap-3">
									<button
										onClick={() => onViewMember(member.id)}
										className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
										title={intl.formatMessage({ id: 'memberList.table.viewDetails' })}
									>
										<Eye className="w-5 h-5" />
									</button>
									{/* Only show edit button if not guest, or if guest and it's their own member */}
									{(!isGuest || (isGuest && guestMemberId === member.id)) && (
										<button
											onClick={() => onEditMember(member.id)}
											className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
											title={intl.formatMessage({ id: 'memberList.table.editMember' })}
										>
											<Pencil className="w-5 h-5" />
										</button>
									)}
									<button
										onClick={() => onGenerateAccessCode(member.id, member.fullName)}
										className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
										title={intl.formatMessage({ id: 'memberList.table.generateAccessCode' })}
									>
										<KeyRound className="w-5 h-5" />
									</button>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{members.length === 0 && (
				<div className="py-20 text-center text-gray-500 font-inter">
					<FormattedMessage id="memberList.table.noMembers" />
				</div>
			)}
		</div>
	);
};

export default function MemberListPage() {
	const { isGuest, guestMemberId } = useGuestSession();
	const params = useParams();
	const familyTreeId = params.id as string;
	const { openPanel } = usePanel();

	const [members, setMembers] = useState<FamilyMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedGeneration, setSelectedGeneration] = useState('All Generation');
	const [selectedParent, setSelectedParent] = useState('');
	const [birthDateRange, setBirthDateRange] = useState({ from: '', to: '' });
	const [panelState, setPanelState] = useState<{ type: 'accessCode'; memberId: number; memberName: string } | null>(
		null
	);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const membersData = await FamilyTreeService.getMembers(familyTreeId);
			setMembers(membersData);
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	useEffect(() => {
		if (familyTreeId) {
			fetchData();
		}
	}, [familyTreeId, fetchData]);

	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			// Generation filter
			const matchesGen =
				selectedGeneration === 'All Generation' ||
				`Gen. ${member.generation}` === selectedGeneration ||
				`F${member.generation}` === selectedGeneration;

			if (!matchesGen) return false;

			// Name filter (if provided)
			if (searchQuery && !member.fullName.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}

			// Birth date filter (if provided)
			if (birthDateRange.from || birthDateRange.to) {
				if (!member.birthday) return false;
				const birthDate = new Date(member.birthday);
				const fromDate = birthDateRange.from ? new Date(birthDateRange.from) : null;
				const toDate = birthDateRange.to ? new Date(birthDateRange.to) : null;

				if (fromDate && birthDate < fromDate) return false;
				if (toDate && birthDate > toDate) return false;
			}

			// Parent filter (if provided)
			if (selectedParent && member.parent?.id !== parseInt(selectedParent)) {
				return false;
			}

			return true;
		});
	}, [members, searchQuery, selectedGeneration, selectedParent, birthDateRange]);

	const generations = useMemo(() => {
		const gens = Array.from(new Set(members.map((m) => m.generation))).sort();
		return ['All Generation', ...gens.map((g) => `F${g}`)];
	}, [members]);

	const parents = useMemo(() => {
		const uniqueParents = new Map<number, string>();
		members.forEach((member) => {
			if (member.parent && !uniqueParents.has(member.parent.id)) {
				uniqueParents.set(member.parent.id, member.parent.fullName);
			}
		});
		return Array.from(uniqueParents, ([id, fullName]) => ({ id, fullName })).sort((a, b) =>
			a.fullName.localeCompare(b.fullName)
		);
	}, [members]);

	const handleGenerateAccessCode = (id: number, name: string) => {
		setPanelState({ type: 'accessCode', memberId: id, memberName: name });
	};

	const handleViewMember = (id: number) => {
		openPanel('member', {
			mode: 'view',
			memberId: id,
			familyTreeId,
			existingMembers: members,
		});
	};

	const handleEditMember = (id: number) => {
		openPanel('member', {
			mode: 'edit',
			memberId: id,
			familyTreeId,
			existingMembers: members,
		});
	};

	const handleClosePanel = () => {
		setPanelState(null);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
				<span className="sr-only">
					<FormattedMessage id="memberList.loading" />
				</span>
			</div>
		);
	}

	return (
		<div className="flex h-full overflow-hidden bg-white">
			{/* Main Content */}
			<div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
				<div className="p-4 lg:p-8">
					{/* Controls Component */}
					<MemberControls
						selectedGeneration={selectedGeneration}
						searchQuery={searchQuery}
						generations={generations}
						parents={parents}
						selectedParent={selectedParent}
						birthDateRange={birthDateRange}
						onGenerationChange={setSelectedGeneration}
						onSearchChange={setSearchQuery}
						onParentChange={setSelectedParent}
						onBirthDateRangeChange={setBirthDateRange}
					/>

					{/* Table Component */}
					<MemberTable
						members={filteredMembers}
						onViewMember={handleViewMember}
						onEditMember={handleEditMember}
						onGenerateAccessCode={handleGenerateAccessCode}
						isGuest={isGuest}
						guestMemberId={guestMemberId}
					/>

					{/* Pagination */}
					<div className="flex items-center justify-center gap-4 mt-6">
						<button className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50" disabled>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<div className="flex items-center gap-2">
							<span className="w-8 h-8 flex items-center justify-center bg-green-600 text-white rounded-full text-sm font-medium">
								{1}
							</span>
						</div>
						<button className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50" disabled>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>

			{/* Panel Renderer */}
			<PanelRenderer />

			{/* Access Code Modal */}
			{panelState?.type === 'accessCode' && (
				<GenerateAccessCodePanel
					familyTreeId={familyTreeId}
					memberId={panelState.memberId}
					memberName={panelState.memberName}
					onClose={handleClosePanel}
				/>
			)}
		</div>
	);
}
