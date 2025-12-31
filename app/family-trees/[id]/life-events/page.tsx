'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { TabNavigation, EventCard, PassingCard, YearSection, LifeEventCard } from '@/components/ui/life-events';
import LoadingScreen from '@/components/LoadingScreen';
import RecordAchievementModal from '@/components/modals/RecordAchievementModal';
import RecordPassingModal from '@/components/modals/RecordPassingModal';
import AchievementService from '@/lib/services/AchievementService';
import type { FamilyMember } from '@prisma/client';

interface Achievement {
	id: number;
	title: string;
	achieveDate: Date | null;
	description: string | null;
	familyMember: {
		id: number;
		fullName: string;
	};
	achievementType: {
		id: number;
		typeName: string;
	};
}

interface AchievementType {
	id: number;
	typeName: string;
}

interface GroupedAchievements {
	[year: string]: Achievement[];
}

interface PassingRecord {
	id: number;
	dateOfPassing: Date;
	familyMember: {
		id: number;
		fullName: string;
	};
	causeOfDeath: {
		id: number;
		causeName: string;
	} | null;
	buriedPlaces: {
		id: number;
		location: string;
		startDate: Date | null;
		endDate: Date | null;
	}[];
}

interface GroupedPassingRecords {
	[year: string]: PassingRecord[];
}

interface SpouseRelationship {
	id: number;
	marriageDate: Date;
	divorceDate: Date | null;
	familyMember1: {
		id: number;
		fullName: string;
	};
	familyMember2: {
		id: number;
		fullName: string;
	};
}

interface LifeEvent {
	id: string;
	type: 'Married' | 'Divorce';
	date: Date;
	title: string;
	description: string;
	relationshipId: number;
}

interface GroupedLifeEvents {
	[year: string]: LifeEvent[];
}

export default function LifeEventsPage() {
	const params = useParams();
	const familyTreeId = params.id as string;

	const [activeTab, setActiveTab] = useState<'achievement' | 'passing' | 'life-event'>('achievement');
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
	const [passingRecords, setPassingRecords] = useState<PassingRecord[]>([]);
	const [spouseRelationships, setSpouseRelationships] = useState<SpouseRelationship[]>([]);
	const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	// Filters
	const [selectedYear, setSelectedYear] = useState<string>('all');
	const [selectedType, setSelectedType] = useState<string>('all');

	// Modals
	const [showAchievementModal, setShowAchievementModal] = useState(false);
	const [showPassingModal, setShowPassingModal] = useState(false);

	const fetchAchievements = useCallback(async () => {
		try {
			setLoading(true);
			const data = await fetch(`/api/family-trees/${familyTreeId}/achievements`).then((res) => {
				if (!res.ok) throw new Error('Failed to fetch achievements');
				return res.json();
			});
			setAchievements(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			toast.error('Failed to load achievements');
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	const fetchAchievementTypes = useCallback(async () => {
		try {
			const types = await fetch(`/api/family-trees/${familyTreeId}/achievement-types`).then((res) => {
				if (!res.ok) throw new Error('Failed to fetch achievement types');
				return res.json();
			});
			setAchievementTypes(types);
		} catch (err) {
			console.error('Failed to fetch achievement types:', err);
		}
	}, [familyTreeId]);

	const fetchPassingRecords = useCallback(async () => {
		try {
			setLoading(true);
			const data = await fetch(`/api/family-trees/${familyTreeId}/passing-records`).then((res) => {
				if (!res.ok) throw new Error('Failed to fetch passing records');
				return res.json();
			});
			setPassingRecords(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			toast.error('Failed to load passing records');
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	const fetchFamilyMembers = useCallback(async () => {
		try {
			const data = await fetch(`/api/family-trees/${familyTreeId}/members`).then((res) => {
				if (!res.ok) throw new Error('Failed to fetch family members');
				return res.json();
			});
			setFamilyMembers(data);
		} catch (err) {
			console.error('Failed to fetch family members:', err);
			toast.error('Failed to load family members');
		}
	}, [familyTreeId]);

	const fetchLifeEvents = useCallback(async () => {
		try {
			setLoading(true);
			const data = await fetch(`/api/family-trees/${familyTreeId}/life-events`).then((res) => {
				if (!res.ok) throw new Error('Failed to fetch life events');
				return res.json();
			});
			setSpouseRelationships(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			toast.error('Failed to load life events');
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	useEffect(() => {
		// Always fetch family members for the modals
		fetchFamilyMembers();

		if (activeTab === 'achievement') {
			fetchAchievements();
			fetchAchievementTypes();
		} else if (activeTab === 'passing') {
			fetchPassingRecords();
		} else if (activeTab === 'life-event') {
			fetchLifeEvents();
		}
	}, [activeTab, fetchAchievements, fetchAchievementTypes, fetchPassingRecords, fetchFamilyMembers, fetchLifeEvents]);

	// Filter achievements
	const filteredAchievements = achievements.filter((achievement) => {
		if (selectedYear !== 'all' && achievement.achieveDate) {
			const year = new Date(achievement.achieveDate).getFullYear();
			if (year.toString() !== selectedYear) return false;
		}
		if (selectedType !== 'all') {
			if (achievement.achievementType.id.toString() !== selectedType) return false;
		}
		return true;
	});

	// Group achievements by year
	const groupedAchievements: GroupedAchievements = filteredAchievements.reduce(
		(acc: GroupedAchievements, achievement) => {
			if (!achievement.achieveDate) return acc;
			const year = new Date(achievement.achieveDate).getFullYear().toString();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(achievement);
			return acc;
		},
		{}
	);

	// Sort years in descending order
	const sortedYears = Object.keys(groupedAchievements).sort((a, b) => parseInt(b) - parseInt(a));

	// Filter passing records
	const filteredPassingRecords = passingRecords.filter((record) => {
		if (selectedYear !== 'all' && record.dateOfPassing) {
			const year = new Date(record.dateOfPassing).getFullYear();
			if (year.toString() !== selectedYear) return false;
		}
		return true;
	});

	// Group passing records by year
	const groupedPassingRecords: GroupedPassingRecords = filteredPassingRecords.reduce(
		(acc: GroupedPassingRecords, record) => {
			if (!record.dateOfPassing) return acc;
			const year = new Date(record.dateOfPassing).getFullYear().toString();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(record);
			return acc;
		},
		{}
	);

	// Sort years in descending order for passing records
	const sortedPassingYears = Object.keys(groupedPassingRecords).sort((a, b) => parseInt(b) - parseInt(a));

	// Transform spouse relationships into life events
	const lifeEvents: LifeEvent[] = spouseRelationships.flatMap((relationship) => {
		const events: LifeEvent[] = [];

		// Add marriage event
		events.push({
			id: `marriage-${relationship.id}`,
			type: 'Married',
			date: relationship.marriageDate,
			title: `${relationship.familyMember1.fullName} & ${relationship.familyMember2.fullName} Say 'I Do'`,
			description:
				'Happiness starts here! The couple held an intimate ceremony, marking the beginning of a new chapter in their lives.',
			relationshipId: relationship.id,
		});

		// Add divorce event if exists
		if (relationship.divorceDate) {
			events.push({
				id: `divorce-${relationship.id}`,
				type: 'Divorce',
				date: relationship.divorceDate,
				title: `${relationship.familyMember1.fullName}'s Separation from ${relationship.familyMember2.fullName}`,
				description:
					'The end of a relationship. The two agreed to separate peacefully and move on with their individual lives.',
				relationshipId: relationship.id,
			});
		}

		return events;
	});

	// Filter life events
	const filteredLifeEvents = lifeEvents.filter((event) => {
		if (selectedYear !== 'all' && event.date) {
			const year = new Date(event.date).getFullYear();
			if (year.toString() !== selectedYear) return false;
		}
		if (selectedType !== 'all') {
			if (event.type !== selectedType) return false;
		}
		return true;
	});

	// Group life events by year
	const groupedLifeEvents: GroupedLifeEvents = filteredLifeEvents.reduce((acc: GroupedLifeEvents, event) => {
		if (!event.date) return acc;
		const year = new Date(event.date).getFullYear().toString();
		if (!acc[year]) {
			acc[year] = [];
		}
		acc[year].push(event);
		return acc;
	}, {});

	// Sort years in descending order for life events
	const sortedLifeEventYears = Object.keys(groupedLifeEvents).sort((a, b) => parseInt(b) - parseInt(a));

	// Get unique years for filter dropdown based on active tab
	const availableYears = Array.from(
		new Set(
			activeTab === 'achievement'
				? achievements
						.filter((a) => a.achieveDate)
						.map((a) => new Date(a.achieveDate!).getFullYear())
						.sort((a, b) => b - a)
				: activeTab === 'passing'
					? passingRecords
							.filter((p) => p.dateOfPassing)
							.map((p) => new Date(p.dateOfPassing).getFullYear())
							.sort((a, b) => b - a)
					: lifeEvents
							.filter((e) => e.date)
							.map((e) => new Date(e.date).getFullYear())
							.sort((a, b) => b - a)
		)
	);

	const formatDate = (date: Date | null) => {
		if (!date) return '';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	if (loading) {
		return <LoadingScreen message="Loading life events..." />;
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-red-500 text-lg">Error: {error}</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white">
			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-[1440px] mx-auto">
					{/* Tab Navigation */}
					<div className="mb-[52px]">
						<TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
					</div>

					{/* Filters and Add Button */}
					<div className="flex items-center gap-[24px] mb-[32px]">
						{/* Year Filter */}
						<div className="relative">
							<select
								value={selectedYear}
								onChange={(e) => setSelectedYear(e.target.value)}
								className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-[20px] py-[10px] pr-[48px] text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-[43px]"
							>
								<option value="all">All Years</option>
								{availableYears.map((year) => (
									<option key={year} value={year}>
										{year}
									</option>
								))}
							</select>
							<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-black pointer-events-none" />
						</div>

						{/* Type Filter - Show for Achievement and Life Event tabs */}
						{activeTab === 'achievement' && (
							<div className="relative">
								<select
									value={selectedType}
									onChange={(e) => setSelectedType(e.target.value)}
									className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-[20px] py-[10px] pr-[48px] text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-[43px]"
								>
									<option value="all">All Types</option>
									{achievementTypes.map((type) => (
										<option key={type.id} value={type.id}>
											{type.typeName}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-black pointer-events-none" />
							</div>
						)}
						{activeTab === 'life-event' && (
							<div className="relative">
								<select
									value={selectedType}
									onChange={(e) => setSelectedType(e.target.value)}
									className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-[20px] py-[10px] pr-[48px] text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-[43px]"
								>
									<option value="all">All Types</option>
									<option value="Married">Married</option>
									<option value="Divorce">Divorce</option>
								</select>
								<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-[20px] h-[20px] text-black pointer-events-none" />
							</div>
						)}

						{/* Spacer */}
						<div className="flex-1" />

						{/* Add Button - Changes based on active tab */}
						{activeTab === 'achievement' && (
							<button
								onClick={() => setShowAchievementModal(true)}
								className="flex items-center gap-[8px] bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-[20px] py-[10px] text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-[43px]"
							>
								<Plus className="w-[15px] h-[15px] text-black" />
								Add Achievement
							</button>
						)}
						{activeTab === 'passing' && (
							<button
								onClick={() => setShowPassingModal(true)}
								className="flex items-center gap-[8px] bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-[20px] py-[10px] text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-[43px]"
							>
								<Plus className="w-[15px] h-[15px] text-black" />
								Add Passing
							</button>
						)}
						{activeTab === 'life-event' && (
							<button
								onClick={() => toast('Add Divorce feature coming soon')}
								className="flex items-center gap-[8px] bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-[20px] py-[10px] text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-[43px]"
							>
								<Plus className="w-[15px] h-[15px] text-black" />
								Add Divorce
							</button>
						)}
					</div>

					{/* Content based on active tab */}
					{activeTab === 'achievement' && (
						<>
							{sortedYears.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-gray-500 text-lg">No achievements recorded yet</p>
									<button onClick={() => setShowAchievementModal(true)} className="mt-4 text-black hover:underline">
										Add your first achievement
									</button>
								</div>
							) : (
								<div className="space-y-[64px]">
									{sortedYears.map((year) => (
										<div key={year}>
											<YearSection year={parseInt(year)} />
											<div className="grid grid-cols-2 gap-[44px]">
												{groupedAchievements[year].map((achievement) => (
													<EventCard
														key={achievement.id}
														title={achievement.title || 'Untitled Achievement'}
														person={achievement.familyMember.fullName}
														date={formatDate(achievement.achieveDate)}
														description={achievement.description || ''}
														type={achievement.achievementType.typeName}
													/>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</>
					)}

					{activeTab === 'passing' && (
						<>
							{sortedPassingYears.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-gray-500 text-lg">No passing records yet</p>
									<button onClick={() => setShowPassingModal(true)} className="mt-4 text-black hover:underline">
										Add your first passing record
									</button>
								</div>
							) : (
								<div className="space-y-[64px]">
									{sortedPassingYears.map((year) => (
										<div key={year}>
											<YearSection year={parseInt(year)} />
											<div className="grid grid-cols-2 gap-[44px]">
												{groupedPassingRecords[year].map((record) => (
													<PassingCard
														key={record.id}
														title={`The passing of ${record.familyMember.fullName}`}
														person={record.familyMember.fullName}
														date={formatDate(record.dateOfPassing)}
														buriedPlace={
															record.buriedPlaces.length > 0 ? record.buriedPlaces[0].location : 'Not specified'
														}
														description={
															record.causeOfDeath
																? `Causes: ${record.causeOfDeath.causeName}`
																: 'Cause of death not specified'
														}
													/>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</>
					)}

					{activeTab === 'life-event' && (
						<>
							{sortedLifeEventYears.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-gray-500 text-lg">No life events recorded yet</p>
									<button
										onClick={() => toast('Add Marriage feature coming soon')}
										className="mt-4 text-black hover:underline"
									>
										Add your first life event
									</button>
								</div>
							) : (
								<div className="space-y-[64px]">
									{sortedLifeEventYears.map((year) => (
										<div key={year}>
											<YearSection year={parseInt(year)} />
											<div className="grid grid-cols-2 gap-[44px]">
												{groupedLifeEvents[year].map((event) => (
													<LifeEventCard
														key={event.id}
														title={event.title}
														date={formatDate(event.date)}
														description={event.description}
														type={event.type}
													/>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Modals */}
			<RecordAchievementModal
				isOpen={showAchievementModal}
				onClose={() => setShowAchievementModal(false)}
				familyTreeId={familyTreeId}
				existingMembers={familyMembers}
				onAchievementRecorded={fetchAchievements}
			/>
			<RecordPassingModal
				isOpen={showPassingModal}
				onClose={() => setShowPassingModal(false)}
				familyTreeId={familyTreeId}
				existingMembers={familyMembers}
				onPassingRecorded={fetchPassingRecords}
			/>
		</div>
	);
}
