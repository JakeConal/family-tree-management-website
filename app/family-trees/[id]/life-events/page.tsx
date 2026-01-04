'use client';

import type { FamilyMember } from '@prisma/client';
import classNames from 'classnames';
import { ChevronDown, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import LoadingScreen from '@/components/LoadingScreen';
import PanelRenderer from '@/components/PanelRenderer';
import { TabNavigation, EventCard, PassingCard, YearSection, LifeEventCard } from '@/components/ui/life-events';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import { usePanel } from '@/lib/hooks/usePanel';
import {
	Achievement,
	PassingRecord,
	SpouseRelationship,
	LifeEvent,
	GroupedAchievements,
	GroupedPassingRecords,
	GroupedLifeEvents,
} from '@/types';

interface AchievementType {
	id: number;
	typeName: string;
}

export default function LifeEventsPage() {
	const params = useParams();
	const familyTreeId = params.id as string;
	const { isGuest } = useGuestSession();
	const { openPanel, activePanel } = usePanel();

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

	// Transform family members with parents into birth events
	const birthEvents: LifeEvent[] = familyMembers
		.filter(
			(member): member is typeof member & { relationshipEstablishedDate: Date } =>
				!!member.parentId && member.relationshipEstablishedDate !== null
		)
		.map((member) => {
			// Find parent from familyMembers
			const parentName = familyMembers.find((m) => m.id === member.parentId)?.fullName || 'their parent';
			return {
				id: `birth-${member.id}`,
				type: 'Birth Event' as const,
				date: member.relationshipEstablishedDate,
				title: `${member.fullName}'s Birth`,
				description: `Born to ${parentName}`,
				relationshipId: member.id,
			};
		});

	// Merge life events and birth events
	const allLifeEvents = [...lifeEvents, ...birthEvents];

	// Filter life events
	const filteredLifeEvents = allLifeEvents.filter((event) => {
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
					: allLifeEvents
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

	// Panel handlers
	const handleOpenAchievementPanel = (id?: number) => {
		openPanel('achievement', {
			mode: id ? 'view' : 'add',
			familyTreeId,
			familyMembers,
		});
	};

	const handleOpenPassingPanel = (id?: number) => {
		openPanel('passing', {
			mode: id ? 'view' : 'add',
			familyTreeId,
			familyMembers,
		});
	};

	const handleOpenDivorcePanel = (id?: number) => {
		openPanel('divorce', {
			mode: id ? 'view' : 'add',
			divorceId: id,
			familyTreeId,
			familyMembers,
		});
	};

	const handleOpenBirthPanel = (id?: number) => {
		if (!id) return; // Birth records can only be viewed/edited, not added directly
		openPanel('birth', {
			mode: 'view',
			childMemberId: id,
			familyTreeId,
			familyMembers,
		});
	};

	const handleOpenMarriagePanel = (id?: number) => {
		if (!id) return; // Marriage records can only be viewed/edited, not added directly
		openPanel('marriage', {
			mode: 'view',
			relationshipId: id,
			familyTreeId,
			familyMembers,
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
		<div className="flex h-full overflow-hidden bg-white">
			{/* Main Content */}
			<div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
				<div className="p-4 sm:p-6 lg:p-8">
					<div className="max-w-[1440px] mx-auto">
						{/* Tab Navigation */}
						<div className="mb-6 sm:mb-8 lg:mb-[52px]">
							<TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
						</div>

						{/* Filters and Add Button */}
						<div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-[24px] mb-6 sm:mb-8 lg:mb-[32px]">
							{/* Year Filter */}
							<div className="relative w-full sm:w-auto">
								<select
									value={selectedYear}
									onChange={(e) => setSelectedYear(e.target.value)}
									className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-[20px] py-[10px] pr-10 sm:pr-[48px] text-sm sm:text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-[43px] w-full sm:w-auto"
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
								<div className="relative w-full sm:w-auto">
									<select
										value={selectedType}
										onChange={(e) => setSelectedType(e.target.value)}
										className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-[20px] py-[10px] pr-10 sm:pr-[48px] text-sm sm:text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-[43px] w-full sm:w-auto"
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
								<div className="relative w-full sm:w-auto">
									<select
										value={selectedType}
										onChange={(e) => setSelectedType(e.target.value)}
										className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-[20px] py-[10px] pr-10 sm:pr-[48px] text-sm sm:text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-[43px] w-full sm:w-auto"
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
							{/* Hide Add Achievement and Add Divorce buttons for guests */}
							{activeTab === 'achievement' && !isGuest && (
								<button
									onClick={() => handleOpenAchievementPanel()}
									className="flex items-center gap-[8px] bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-[20px] py-[10px] text-sm sm:text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-[43px] w-full sm:w-auto"
								>
									<Plus className="w-[15px] h-[15px] text-black" />
									<span className="whitespace-nowrap">Add Achievement</span>
								</button>
							)}
							{activeTab === 'passing' && !isGuest && (
								<button
									onClick={() => handleOpenPassingPanel()}
									className="flex items-center gap-[8px] bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-[20px] py-[10px] text-sm sm:text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-[43px] w-full sm:w-auto"
								>
									<Plus className="w-[15px] h-[15px] text-black" />
									<span className="whitespace-nowrap">Add Passing</span>
								</button>
							)}
							{activeTab === 'life-event' && !isGuest && (
								<button
									onClick={() => handleOpenDivorcePanel()}
									className="flex items-center gap-[8px] bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-[20px] py-[10px] text-sm sm:text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-[43px] w-full sm:w-auto"
								>
									<Plus className="w-[15px] h-[15px] text-black" />
									<span className="whitespace-nowrap">Add Divorce</span>
								</button>
							)}
						</div>

						{/* Content based on active tab */}
						{activeTab === 'achievement' && (
							<>
								{sortedYears.length === 0 ? (
									<div className="text-center py-12">
										<p className="text-gray-500 text-lg">No achievements recorded yet</p>
										<button onClick={() => handleOpenAchievementPanel()} className="mt-4 text-black hover:underline">
											Add your first achievement
										</button>
									</div>
								) : (
									<div className="space-y-8 sm:space-y-12 lg:space-y-[64px]">
										{sortedYears.map((year) => (
											<div key={year}>
												<YearSection year={parseInt(year)} />
												<div
													className={classNames('grid gap-[44px]', {
														'grid-cols-1': activePanel !== null,
														'grid-cols-1 md:grid-cols-2': activePanel === null,
													})}
												>
													{groupedAchievements[year].map((achievement) => (
														<EventCard
															key={achievement.id}
															id={achievement.id}
															title={achievement.title || 'Untitled Achievement'}
															person={achievement.familyMember.fullName}
															date={formatDate(achievement.achieveDate)}
															description={achievement.description || ''}
															type={achievement.achievementType.typeName}
															onClick={handleOpenAchievementPanel}
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
										<button onClick={() => handleOpenPassingPanel()} className="mt-4 text-black hover:underline">
											Add your first passing record
										</button>
									</div>
								) : (
									<div className="space-y-8 sm:space-y-12 lg:space-y-[64px]">
										{sortedPassingYears.map((year) => (
											<div key={year}>
												<YearSection year={parseInt(year)} />
												<div
													className={classNames('grid gap-[44px]', {
														'grid-cols-1': activePanel !== null,
														'grid-cols-1 md:grid-cols-2': activePanel === null,
													})}
												>
													{groupedPassingRecords[year].map((record) => (
														<PassingCard
															key={record.id}
															id={record.id}
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
															onClick={handleOpenPassingPanel}
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
										<button onClick={() => handleOpenDivorcePanel()} className="mt-4 text-black hover:underline">
											Add divorce record
										</button>
									</div>
								) : (
									<div className="space-y-8 sm:space-y-12 lg:space-y-[64px]">
										{sortedLifeEventYears.map((year) => (
											<div key={year}>
												<YearSection year={parseInt(year)} />
												<div
													className={classNames('grid gap-[44px]', {
														'grid-cols-1': activePanel !== null,
														'grid-cols-1 md:grid-cols-2': activePanel === null,
													})}
												>
													{groupedLifeEvents[year].map((event) => (
														<LifeEventCard
															key={event.id}
															id={event.relationshipId}
															title={event.title}
															date={formatDate(event.date)}
															description={event.description}
															type={event.type}
															onClick={
																event.type === 'Married'
																	? handleOpenMarriagePanel
																	: event.type === 'Divorce'
																		? handleOpenDivorcePanel
																		: event.type === 'Birth Event'
																			? handleOpenBirthPanel
																			: undefined
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
					</div>
				</div>
			</div>

			{/* Panel Renderer */}
			<PanelRenderer />
		</div>
	);
}
