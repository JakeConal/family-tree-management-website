'use client';

import classNames from 'classnames';
import { Search, Eye, Pencil, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo, useCallback } from 'react';

import AddMemberPanel from '@/components/panels/AddMemberPanel';
import GenerateAccessCodePanel from '@/components/modals/GenerateAccessCodeModal';
import ViewEditMemberPanel from '@/components/panels/ViewEditMemberPanel';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
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
		<div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
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
	return (
		<div className="mb-4 sm:mb-6 bg-[#f4f4f5] p-3 sm:p-4 rounded-xl">
			{/* All Filters in One Row */}
			<div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 items-center">
				{/* Generation Filter */}
				<div className="relative flex-shrink-0 w-full sm:w-auto">
					<select
						value={selectedGeneration}
						onChange={(e) => onGenerationChange(e.target.value)}
						className="appearance-none bg-white h-[43px] w-full sm:w-auto px-4 sm:px-6 pr-10 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 cursor-pointer outline-none"
					>
						{generations.map((gen) => (
							<option key={gen} value={gen}>
								{gen}
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
				<div className="relative flex-1 w-full sm:min-w-[200px]">
					<Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search by name"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full bg-white h-[43px] pl-10 sm:pl-12 pr-4 sm:pr-6 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 outline-none"
					/>
				</div>

				{/* Search by Birth Date From */}
				<div className="relative flex-shrink-0 flex items-center gap-2 w-full sm:w-auto">
					<span className="text-sm sm:text-[16px] font-inter text-black">From</span>
					<input
						type="date"
						placeholder="Birth Date From"
						value={birthDateRange.from}
						onChange={(e) => onBirthDateRangeChange({ ...birthDateRange, from: e.target.value })}
						className="flex-1 sm:flex-none bg-white h-[43px] px-3 sm:px-4 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 outline-none"
					/>
				</div>

				{/* Search by Birth Date To */}
				<div className="relative flex-shrink-0 flex items-center gap-2 w-full sm:w-auto">
					<span className="text-sm sm:text-[16px] font-inter text-black">To</span>
					<input
						type="date"
						placeholder="Birth Date To"
						value={birthDateRange.to}
						onChange={(e) => onBirthDateRangeChange({ ...birthDateRange, to: e.target.value })}
						className="flex-1 sm:flex-none bg-white h-[43px] px-3 sm:px-4 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 outline-none"
					/>
				</div>

				{/* Search by Parent */}
				<div className="relative flex-shrink-0 w-full sm:w-auto">
					<select
						value={selectedParent}
						onChange={(e) => onParentChange(e.target.value)}
						className="appearance-none bg-white h-[43px] w-full sm:w-auto px-4 sm:px-6 pr-10 rounded-[20px] text-sm sm:text-[16px] font-inter text-black border-none focus:ring-2 focus:ring-green-500 cursor-pointer outline-none sm:min-w-[180px]"
					>
						<option value=""> All Parents </option>
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
	return (
		<div className="rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
			<table className="w-full border-collapse text-left min-w-[640px]">
				<thead className="sticky top-0 bg-white z-10">
					<tr className="border-b border-gray-100">
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center w-16 sm:w-20">No.</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black">Full Name</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center">Birth Date</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center">Gen. No.</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black hidden md:table-cell">Parent</th>
						<th className="px-3 sm:px-6 py-3 sm:py-4 font-inter font-semibold text-sm sm:text-[16px] text-black text-center">Action</th>
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
								{member.birthday
									? new Date(member.birthday).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
										})
									: '-'}
							</td>
							<td className="px-6 py-4 font-playfair text-[16px] text-black text-center">F{member.generation}</td>
							<td className="px-6 py-4 font-playfair text-[16px] text-black">{member.parent?.fullName || '-'}</td>
							<td className="px-6 py-4">
								<div className="flex items-center justify-center gap-3">
									<button
										onClick={() => onViewMember(member.id)}
										className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
										title="View Details"
									>
										<Eye className="w-5 h-5" />
									</button>
									{/* Only show edit button if not guest, or if guest and it's their own member */}
									{(!isGuest || (isGuest && guestMemberId === member.id)) && (
										<button
											onClick={() => onEditMember(member.id)}
											className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
											title="Edit Member"
										>
											<Pencil className="w-5 h-5" />
										</button>
									)}
									<button
										onClick={() => onGenerateAccessCode(member.id, member.fullName)}
										className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors"
										title="Generate Guest Access Code"
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
				<div className="py-20 text-center text-gray-500 font-inter">No members found matching your criteria.</div>
			)}
		</div>
	);
};

export default function MemberListPage() {
	const { data: session } = useSession();
	const { isGuest, guestMemberId } = useGuestSession();
	const params = useParams();
	const familyTreeId = params.id as string;

	const [members, setMembers] = useState<FamilyMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedGeneration, setSelectedGeneration] = useState('All Generation');
	const [selectedParent, setSelectedParent] = useState('');
	const [birthDateRange, setBirthDateRange] = useState({ from: '', to: '' });
	const [panelState, setPanelState] = useState<
		| { type: 'add' }
		| { type: 'view'; memberId: number }
		| { type: 'edit'; memberId: number }
		| { type: 'accessCode'; memberId: number; memberName: string }
		| null
	>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const membersRes = await fetch(`/api/family-trees/${familyTreeId}/members`);

			if (membersRes.ok) {
				const membersData = await membersRes.json();
				setMembers(membersData);
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	useEffect(() => {
		if (session && familyTreeId) {
			fetchData();
		}
	}, [session, familyTreeId, fetchData]);

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
		setPanelState({ type: 'view', memberId: id });
	};

	const handleEditMember = (id: number) => {
		setPanelState({ type: 'edit', memberId: id });
	};

	const handleClosePanel = () => {
		setPanelState(null);
	};

	const handlePanelModeChange = (mode: 'view' | 'edit') => {
		if (panelState && (panelState.type === 'view' || panelState.type === 'edit')) {
			setPanelState({ type: mode, memberId: panelState.memberId });
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
								1
							</span>
						</div>
						<button className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50" disabled>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			</div>

			{/* Member Panel Sidebar - Push Style */}
			<aside
				className={classNames(
					'transition-all duration-300 ease-in-out border-l border-gray-100 bg-white overflow-hidden shrink-0 h-full',
					{
						'fixed md:relative inset-y-0 right-0 md:right-auto z-50 w-full md:w-[600px]': panelState !== null,
						'w-0': panelState === null,
					}
				)}
			>
				{panelState?.type === 'add' && (
					<AddMemberPanel
						familyTreeId={familyTreeId}
						existingMembers={members}
						onClose={handleClosePanel}
						onSuccess={() => {
							fetchData();
							handleClosePanel();
						}}
					/>
				)}
				{(panelState?.type === 'view' || panelState?.type === 'edit') && (
					<ViewEditMemberPanel
						memberId={panelState.memberId}
						familyTreeId={familyTreeId}
						existingMembers={members}
						mode={panelState.type}
						onModeChange={handlePanelModeChange}
						onClose={handleClosePanel}
						onSuccess={fetchData}
					/>
				)}
				{panelState?.type === 'accessCode' && (
					<GenerateAccessCodePanel
						familyTreeId={familyTreeId}
						memberId={panelState.memberId}
						memberName={panelState.memberName}
						onClose={handleClosePanel}
					/>
				)}
			</aside>
		</div>
	);
}
