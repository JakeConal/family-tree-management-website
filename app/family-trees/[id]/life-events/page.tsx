'use client';

import type { FamilyMember } from '@prisma/client';
import classNames from 'classnames';
import { ChevronDown, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FormattedMessage, useIntl } from 'react-intl';

import LoadingScreen from '@/components/LoadingScreen';
import { TabNavigation, EventCard, PassingCard, YearSection, LifeEventCard } from '@/components/ui/life-events';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import { usePanel } from '@/lib/hooks/usePanel';
import { FamilyTreeService } from '@/lib/services';
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
	const intl = useIntl();

	const tabs = ['achievement', 'passing', 'lifeEvent'] as const;
	const [activeTab, setActiveTab] = useState<string>(tabs[0]);
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
			const data = await FamilyTreeService.getAchievements(familyTreeId);
			setAchievements(data);
			setError('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	const fetchAchievementTypes = useCallback(async () => {
		try {
			const types = await FamilyTreeService.getAchievementTypes(familyTreeId);
			setAchievementTypes(types);
		} catch (err) {
			console.error('Failed to fetch achievement types:', err);
		}
	}, [familyTreeId]);

	const fetchPassingRecords = useCallback(async () => {
		try {
			setLoading(true);
			const data = await FamilyTreeService.getPassingRecords(familyTreeId);
			setPassingRecords(data);
			setError('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	const fetchFamilyMembers = useCallback(async () => {
		try {
			const data = await FamilyTreeService.getMembers(familyTreeId);
			setFamilyMembers(data);
		} catch (err) {
			console.error('Failed to fetch family members:', err);
		}
	}, [familyTreeId]);

	const fetchLifeEvents = useCallback(async () => {
		try {
			setLoading(true);
			const data = await FamilyTreeService.getLifeEvents(familyTreeId);
			setSpouseRelationships(data);
			setError('');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
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
		} else if (activeTab === 'lifeEvent') {
			fetchLifeEvents();
		}
	}, [activeTab, fetchAchievements, fetchAchievementTypes, fetchPassingRecords, fetchFamilyMembers, fetchLifeEvents]);

	// Refresh data when panel closes
	useEffect(() => {
		// When panel closes (activePanel becomes null), refresh the data
		if (activePanel === null) {
			if (activeTab === 'achievement') {
				fetchAchievements();
				fetchFamilyMembers();
			} else if (activeTab === 'passing') {
				fetchPassingRecords();
				fetchFamilyMembers();
			} else if (activeTab === 'lifeEvent') {
				fetchLifeEvents();
				fetchFamilyMembers();
			}
		}
	}, [activePanel, activeTab, fetchAchievements, fetchPassingRecords, fetchLifeEvents, fetchFamilyMembers]);

	// Handle errors with intl
	useEffect(() => {
		if (error) {
			toast.error(intl.formatMessage({ id: 'errors.generic' }));
		}
	}, [error, intl]);

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
			title: intl.formatMessage(
				{ id: 'lifeEvents.lifeEventCard.marriageTitle' },
				{
					name1: relationship.familyMember1.fullName,
					name2: relationship.familyMember2.fullName,
				}
			),
			description: intl.formatMessage({ id: 'lifeEvents.lifeEventCard.marriageDescription' }),
			relationshipId: relationship.id,
		});

		// Add divorce event if exists
		if (relationship.divorceDate) {
			events.push({
				id: `divorce-${relationship.id}`,
				type: 'Divorce',
				date: relationship.divorceDate,
				title: intl.formatMessage(
					{ id: 'lifeEvents.divorceTitle' },
					{
						name1: relationship.familyMember1.fullName,
						name2: relationship.familyMember2.fullName,
					}
				),
				description: intl.formatMessage({ id: 'lifeEvents.divorceDescription' }),
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
				title: intl.formatMessage({ id: 'lifeEvents.lifeEventCard.birthTitle' }, { name: member.fullName }),
				description: intl.formatMessage({ id: 'lifeEvents.lifeEventCard.birthDescription' }, { parent: parentName }),
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
			achievementId: id,
			familyTreeId,
			familyMembers,
		});
	};

	const handleOpenPassingPanel = (id?: number) => {
		openPanel('passing', {
			mode: id ? 'view' : 'add',
			passingRecordId: id,
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

	return (
		<div className="flex h-full overflow-hidden bg-white">
			{/* Main Content */}
			<div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
				<div className="p-4 sm:p-6 lg:p-8">
					<div className="max-w-360 mx-auto">
						{/* Tab Navigation */}
						<div className="mb-6 sm:mb-8 lg:mb-13">
							<TabNavigation
								tabs={['achievement', 'passing', 'lifeEvent']}
								activeTab={activeTab}
								onTabChange={setActiveTab}
							/>
						</div>

						{/* Container */}
						<div className="relative">
							{/* Filters and Add Button */}
							<div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-8">
								{/* Year Filter */}
								<div className="relative w-full sm:w-auto">
									<select
										value={selectedYear}
										onChange={(e) => setSelectedYear(e.target.value)}
										className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-5 py-2.5 pr-10 sm:pr-12 text-sm sm:text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-10.75 w-full sm:w-auto"
									>
										<option value="all">
											<FormattedMessage id="lifeEvents.filters.allYears" />
										</option>
										{availableYears.map((year) => (
											<option key={year} value={year}>
												{year}
											</option>
										))}
									</select>
									<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
								</div>

								{/* Type Filter - Show for Achievement and Life Event tabs */}
								{activeTab === 'achievement' && (
									<div className="relative w-full sm:w-auto">
										<select
											value={selectedType}
											onChange={(e) => setSelectedType(e.target.value)}
											className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-5 py-2.5 pr-10 sm:pr-12 text-sm sm:text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-10.75 w-full sm:w-auto"
										>
											<option value="all">
												<FormattedMessage id="lifeEvents.filters.allTypes" />
											</option>
											{achievementTypes.map((type) => (
												<option key={type.id} value={type.id}>
													{type.typeName}
												</option>
											))}
										</select>
										<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
									</div>
								)}
								{activeTab === 'lifeEvent' && (
									<div className="relative w-full sm:w-auto">
										<select
											value={selectedType}
											onChange={(e) => setSelectedType(e.target.value)}
											className="appearance-none bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-5 py-2.5 pr-10 sm:pr-12 text-sm sm:text-[16px] font-inter font-normal text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer h-10.75 w-full sm:w-auto"
										>
											<option value="all">
												<FormattedMessage id="lifeEvents.filters.allTypes" />
											</option>
											<option value="Married">
												<FormattedMessage id="lifeEvents.filters.married" />
											</option>
											<option value="Divorce">
												<FormattedMessage id="lifeEvents.filters.divorce" />
											</option>
										</select>
										<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
									</div>
								)}

								{/* Spacer */}
								<div className="flex-1" />

								{/* Add Button - Changes based on active tab */}
								{/* Hide Add Achievement and Add Divorce buttons for guests */}
								{activeTab === 'achievement' && !isGuest && (
									<button
										onClick={() => handleOpenAchievementPanel()}
										className="flex items-center gap-2 bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-5 py-2.5 text-sm sm:text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-10.75 w-full sm:w-auto"
									>
										<Plus className="w-3.75 h-3.75 text-black" />
										<span className="whitespace-nowrap">
											<FormattedMessage id="lifeEvents.actions.addAchievement" />
										</span>
									</button>
								)}
								{activeTab === 'passing' && !isGuest && (
									<button
										onClick={() => handleOpenPassingPanel()}
										className="flex items-center gap-2 bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-5 py-2.5 text-sm sm:text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-10.75 w-full sm:w-auto"
									>
										<Plus className="w-3.75 h-3.75 text-black" />
										<span className="whitespace-nowrap">
											<FormattedMessage id="lifeEvents.actions.addPassing" />
										</span>
									</button>
								)}
								{activeTab === 'lifeEvent' && !isGuest && (
									<button
										onClick={() => handleOpenDivorcePanel()}
										className="flex items-center gap-2 bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-4 sm:px-5 py-2.5 text-sm sm:text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-10.75 w-full sm:w-auto"
									>
										<Plus className="w-3.75 h-3.75 text-black" />
										<span className="whitespace-nowrap">
											<FormattedMessage id="lifeEvents.actions.addDivorce" />
										</span>
									</button>
								)}
							</div>

							{/* Content based on active tab */}
							{activeTab === 'achievement' && (
								<>
									{sortedYears.length === 0 ? (
										<div className="text-center py-12">
											<p className="text-gray-500 text-lg">
												<FormattedMessage id="lifeEvents.empty.noAchievements" />
											</p>
											<button onClick={() => handleOpenAchievementPanel()} className="mt-4 text-black hover:underline">
												<FormattedMessage id="lifeEvents.empty.addFirstAchievement" />
											</button>
										</div>
									) : (
										<div className="space-y-8 sm:space-y-12 lg:space-y-16">
											{sortedYears.map((year) => (
												<div key={year}>
													<YearSection year={parseInt(year)} />
													<div
														className={classNames('grid gap-11', {
															'grid-cols-1': activePanel !== null,
															'grid-cols-1 md:grid-cols-2': activePanel === null,
														})}
													>
														{groupedAchievements[year].map((achievement) => (
															<EventCard
																key={achievement.id}
																id={achievement.id}
																title={
																	achievement.title ||
																	intl.formatMessage({ id: 'lifeEvents.cards.untitledAchievement' })
																}
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
											<p className="text-gray-500 text-lg">
												<FormattedMessage id="lifeEvents.empty.noPassing" />
											</p>
											<button onClick={() => handleOpenPassingPanel()} className="mt-4 text-black hover:underline">
												<FormattedMessage id="lifeEvents.empty.addFirstPassing" />
											</button>
										</div>
									) : (
										<div className="space-y-8 sm:space-y-12 lg:space-y-16">
											{sortedPassingYears.map((year) => (
												<div key={year}>
													<YearSection year={parseInt(year)} />
													<div
														className={classNames('grid gap-11', {
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
																	record.buriedPlaces.length > 0
																		? record.buriedPlaces[0].location
																		: intl.formatMessage({ id: 'lifeEvents.cards.notSpecified' })
																}
																description={
																	record.causeOfDeath && record.causeOfDeath.length > 0
																		? `Cause: ${record.causeOfDeath.map(c => c.causeName).join(', ')}`
																		: `Cause: ${intl.formatMessage({ id: 'lifeEvents.cards.causeNotSpecified' })}`
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

							{activeTab === 'lifeEvent' && (
								<>
									{sortedLifeEventYears.length === 0 ? (
										<div className="text-center py-12">
											<p className="text-gray-500 text-lg">
												<FormattedMessage id="lifeEvents.empty.noLifeEvents" />
											</p>
											<button onClick={() => handleOpenDivorcePanel()} className="mt-4 text-black hover:underline">
												<FormattedMessage id="lifeEvents.empty.addDivorceRecord" />
											</button>
										</div>
									) : (
										<div className="space-y-8 sm:space-y-12 lg:space-y-16">
											{sortedLifeEventYears.map((year) => (
												<div key={year}>
													<YearSection year={parseInt(year)} />
													<div
														className={classNames('grid gap-11', {
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

							{/* Loading Screen Overlay */}
							{loading && <LoadingScreen message={intl.formatMessage({ id: 'lifeEvents.loading' })} />}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
