'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { TabNavigation, EventCard, YearSection } from '@/components/ui/life-events';
import LoadingScreen from '@/components/LoadingScreen';
import RecordAchievementModal from '@/components/modals/RecordAchievementModal';
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

export default function LifeEventsPage() {
	const params = useParams();
	const familyTreeId = params.id as string;

	const [activeTab, setActiveTab] = useState<'achievement' | 'passing' | 'life-event'>('achievement');
	const [achievements, setAchievements] = useState<Achievement[]>([]);
	const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	// Filters
	const [selectedYear, setSelectedYear] = useState<string>('all');
	const [selectedType, setSelectedType] = useState<string>('all');

	// Modal
	const [showAchievementModal, setShowAchievementModal] = useState(false);

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

	useEffect(() => {
		fetchAchievements();
		fetchAchievementTypes();
	}, [fetchAchievements, fetchAchievementTypes]);

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

	// Get unique years for filter dropdown
	const availableYears = Array.from(
		new Set(
			achievements
				.filter((a) => a.achieveDate)
				.map((a) => new Date(a.achieveDate!).getFullYear())
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

						{/* Type Filter */}
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

						{/* Spacer */}
						<div className="flex-1" />

						{/* Add Achievement Button */}
						<button
							onClick={() => setShowAchievementModal(true)}
							className="flex items-center gap-[8px] bg-white border border-[rgba(0,0,0,0.5)] rounded-[20px] px-[20px] py-[10px] text-[16px] font-inter font-normal text-black hover:bg-gray-50 transition-all h-[43px]"
						>
							<Plus className="w-[15px] h-[15px] text-black" />
							Add Achievement
						</button>
					</div>

					{/* Content based on active tab */}
					{activeTab === 'achievement' && (
						<>
							{sortedYears.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-gray-500 text-lg">No achievements recorded yet</p>
									<button
										onClick={() => setShowAchievementModal(true)}
										className="mt-4 text-black hover:underline"
									>
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
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg">Passing records feature coming soon</p>
						</div>
					)}

					{activeTab === 'life-event' && (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg">Life events feature coming soon</p>
						</div>
					)}
				</div>
			</div>

			{/* Modals */}
			<RecordAchievementModal
				isOpen={showAchievementModal}
				onClose={() => setShowAchievementModal(false)}
				familyTreeId={familyTreeId}
				existingMembers={[] as FamilyMember[]}
				onAchievementRecorded={fetchAchievements}
			/>
		</div>
	);
}

