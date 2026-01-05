'use client';

import {
	Users,
	Heart,
	TreePine,
	Calendar,
	UserPlus,
	Trophy,
	Skull,
	Pencil,
	Info,
	MapPin,
	TrendingUp,
	Clock,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import LoadingScreen from '@/components/LoadingScreen';
import AllChangeLogsModal from '@/components/modals/AllChangeLogsModal';
import ChangeLogDetailsModal from '@/components/modals/ChangeLogDetailsModal';
import EditFamilyTreeModal from '@/components/modals/EditFamilyTreeModal';
import PanelRenderer from '@/components/PanelRenderer';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import { usePanel } from '@/lib/hooks/usePanel';
import { FamilyTreeService, FamilyMemberService, ChangeLogService } from '@/lib/services';
import { FamilyMember, FamilyTree, FamilyStatistics, ChangeLog } from '@/types';

const getUserName = (log: ChangeLog) => {
	// Return user name if available, otherwise fallback to email or 'Unknown User'
	if (log.user) {
		return log.user.name || log.user.email || 'Unknown User';
	}
	return log.userId ? 'Unknown User' : 'Unknown User';
};

export default function FamilyTreeDashboard() {
	const router = useRouter();
	const params = useParams();
	const familyTreeId = params.id as string;
	const { isGuest } = useGuestSession();
	const { openPanel } = usePanel();
	const intl = useIntl();

	// State for API data
	const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
	const [statistics, setStatistics] = useState<FamilyStatistics | null>(null);
	const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([]);
	const [selectedChangeLog, setSelectedChangeLog] = useState<ChangeLog | null>(null);
	const [isChangeLogDetailsModalOpen, setIsChangeLogDetailsModalOpen] = useState(false);
	const [isEditFamilyTreeModalOpen, setIsEditFamilyTreeModalOpen] = useState(false);
	const [isAllChangeLogsModalOpen, setIsAllChangeLogsModalOpen] = useState(false);

	// Panel state
	// Removed - now managed globally via usePanel hook

	// Fetch real dashboard data
	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				// Fetch family tree details
				const familyTreeData = await FamilyTreeService.getById(familyTreeId);
				setFamilyTree(familyTreeData);

				// Fetch family members for statistics
				const members = await FamilyMemberService.getAll({ familyTreeId });

				// Calculate statistics from real data
				const totalMembers = members.length;
				const livingMembers = members.filter(
					(member: FamilyMember) => !member.passingRecords || member.passingRecords.length === 0
				).length;
				const totalGenerations = Math.max(
					...members.map((member: FamilyMember) => (member.generation ? parseInt(member.generation.toString()) : 1)),
					1
				);

				// Fetch change logs to calculate trends (skip for guests)
				let changeLogs: ChangeLog[] = [];
				if (!isGuest) {
					try {
						changeLogs = await ChangeLogService.getByFamilyTreeId(familyTreeId);
					} catch (error) {
						console.error('Error fetching change logs:', error);
						changeLogs = [];
					}
				}

				// Calculate trends from change logs (last 30 days)
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const recentLogs = changeLogs.filter((log) => new Date(log.createdAt) >= thirtyDaysAgo);

				const memberGrowthCount = recentLogs.filter(
					(log) => log.entityType === 'FamilyMember' && log.action === 'CREATE'
				).length;
				const deathTrendCount = recentLogs.filter(
					(log) => log.entityType === 'PassingRecord' && log.action === 'CREATE'
				).length;
				const marriagesCount = recentLogs.filter(
					(log) => log.entityType === 'SpouseRelationship' && log.action === 'CREATE'
				).length;
				const divorcesCount = recentLogs.filter((log) => {
					if (log.entityType !== 'SpouseRelationship' || log.action !== 'UPDATE') return false;
					try {
						const oldValues = log.oldValues ? JSON.parse(log.oldValues) : {};
						const newValues = log.newValues ? JSON.parse(log.newValues) : {};
						return oldValues.divorceDate === null && newValues.divorceDate !== null;
					} catch {
						return false;
					}
				}).length;
				const achievementGrowthCount = recentLogs.filter(
					(log) => log.entityType === 'Achievement' && log.action === 'CREATE'
				).length;

				// For percentages, we need previous period data. For simplicity, use total as base
				const memberGrowthPercentage = totalMembers > 0 ? Math.round((memberGrowthCount / totalMembers) * 100) : 0;
				const deathTrendPercentage = totalMembers > 0 ? Math.round((deathTrendCount / totalMembers) * 100) : 0;
				const achievementGrowthPercentage =
					totalMembers > 0 ? Math.round((achievementGrowthCount / totalMembers) * 100) : 0;

				const statistics: FamilyStatistics = {
					totalGenerations,
					totalMembers,
					livingMembers,
					memberGrowth: {
						count: memberGrowthCount,
						percentage: memberGrowthPercentage,
					},
					deathTrend: {
						count: deathTrendCount,
						percentage: deathTrendPercentage,
					},
					marriageTrend: {
						marriages: marriagesCount,
						divorces: divorcesCount,
					},
					achievementGrowth: {
						count: achievementGrowthCount,
						percentage: achievementGrowthPercentage,
					},
				};

				setStatistics(statistics);
				setChangeLogs(changeLogs); // Also set change logs here
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
				setFamilyTree(null);
				setStatistics(null);

				setChangeLogs([]);
			} finally {
				setLoading(false);
			}
		};

		if (familyTreeId) {
			fetchDashboardData();
		}
	}, [familyTreeId, isGuest]);

	const calculateAge = (establishYear: number | null) => {
		if (!establishYear) return null;
		const currentYear = new Date().getFullYear();
		return currentYear - establishYear;
	};

	// Fetch existing family members for the modal dropdown
	const fetchExistingMembers = async () => {
		try {
			const members = await FamilyTreeService.getMembers(familyTreeId);
			setExistingMembers(members);
		} catch (error) {
			console.error('Error fetching existing members:', error);
		}
	};

	// Fetch all dashboard data
	const fetchFamilyTreeData = async () => {
		try {
			const familyTreeData = await FamilyTreeService.getById(familyTreeId);
			setFamilyTree(familyTreeData);
		} catch (error) {
			console.error('Error fetching family tree:', error);
		}
	};

	const fetchStatistics = async () => {
		try {
			// Fetch family members for statistics
			const members = await FamilyMemberService.getAll({ familyTreeId });

			// Calculate statistics from real data
			const totalMembers = members.length;
			const livingMembers = members.filter(
				(member: FamilyMember) => !member.passingRecords || member.passingRecords.length === 0
			).length;
			const totalGenerations = Math.max(
				...members.map((member: FamilyMember) => (member.generation ? parseInt(member.generation.toString()) : 1)),
				1
			);

			// Fetch change logs to calculate trends
			const changeLogs: ChangeLog[] = await ChangeLogService.getByFamilyTreeId(familyTreeId);

			// Calculate trends from change logs (last 30 days)
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const recentLogs = changeLogs.filter((log) => new Date(log.createdAt) >= thirtyDaysAgo);

			const memberGrowthCount = recentLogs.filter(
				(log) => log.entityType === 'FamilyMember' && log.action === 'CREATE'
			).length;
			const deathTrendCount = recentLogs.filter(
				(log) => log.entityType === 'PassingRecord' && log.action === 'CREATE'
			).length;
			const marriagesCount = recentLogs.filter(
				(log) => log.entityType === 'SpouseRelationship' && log.action === 'CREATE'
			).length;
			const divorcesCount = recentLogs.filter((log) => {
				if (log.entityType !== 'SpouseRelationship' || log.action !== 'UPDATE') return false;
				try {
					const oldValues = log.oldValues ? JSON.parse(log.oldValues) : {};
					const newValues = log.newValues ? JSON.parse(log.newValues) : {};
					return oldValues.divorceDate === null && newValues.divorceDate !== null;
				} catch {
					return false;
				}
			}).length;
			const achievementGrowthCount = recentLogs.filter(
				(log) => log.entityType === 'Achievement' && log.action === 'CREATE'
			).length;

			// For percentages, we need previous period data. For simplicity, use total as base
			const memberGrowthPercentage = totalMembers > 0 ? Math.round((memberGrowthCount / totalMembers) * 100) : 0;
			const deathTrendPercentage = totalMembers > 0 ? Math.round((deathTrendCount / totalMembers) * 100) : 0;
			const achievementGrowthPercentage =
				totalMembers > 0 ? Math.round((achievementGrowthCount / totalMembers) * 100) : 0;

			const statistics: FamilyStatistics = {
				totalGenerations,
				totalMembers,
				livingMembers,
				memberGrowth: {
					count: memberGrowthCount,
					percentage: memberGrowthPercentage,
				},
				deathTrend: {
					count: deathTrendCount,
					percentage: deathTrendPercentage,
				},
				marriageTrend: { marriages: marriagesCount, divorces: divorcesCount },
				achievementGrowth: {
					count: achievementGrowthCount,
					percentage: achievementGrowthPercentage,
				},
			};

			setStatistics(statistics);
		} catch (error) {
			console.error('Error fetching statistics:', error);
		}
	};

	const fetchActivities = async () => {
		// Skip fetching change logs for guests
		if (isGuest) {
			setChangeLogs([]);
			return;
		}

		try {
			const logs = await ChangeLogService.getByFamilyTreeId(familyTreeId);
			console.log('Fetched activities - Total logs:', logs.length);
			console.log(
				'SpouseRelationship logs:',
				logs.filter((log: ChangeLog) => log.entityType === 'SpouseRelationship')
			);
			setChangeLogs(logs);
		} catch (error) {
			console.error('Error fetching change logs:', error);
			setChangeLogs([]);
		}
	};

	// Refresh all dashboard data after panel actions
	const refreshDashboardData = async () => {
		try {
			console.log('Refreshing dashboard data...');
			await Promise.all([fetchFamilyTreeData(), fetchStatistics(), fetchActivities(), fetchExistingMembers()]);
			console.log('Dashboard data refreshed successfully');
		} catch (error) {
			console.error('Error refreshing dashboard data:', error);
		}
	};

	if (loading) {
		return <LoadingScreen message={intl.formatMessage({ id: 'familyTreeDashboard.loading' })} />;
	}

	if (!familyTree) {
		return (
			<div className="text-center py-12">
				<div className="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
					<h2 className="text-lg font-semibold text-red-800 mb-2">
						<FormattedMessage id="familyTreeDashboard.notFound.title" />
					</h2>
					<p className="text-red-600 mb-4">
						<FormattedMessage id="familyTreeDashboard.notFound.message" />
					</p>
					<button
						onClick={() => router.push('/dashboard')}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						<FormattedMessage id="familyTreeDashboard.notFound.goToDashboard" />
					</button>
				</div>
			</div>
		);
	}

	const formatChangeLogMessage = (log: ChangeLog) => {
		const entityType = log.entityType;
		const action = log.action.toLowerCase();

		// Only show major events
		const majorEvents = ['FamilyMember', 'PassingRecord', 'Achievement', 'SpouseRelationship', 'FamilyTree'];

		if (!majorEvents.includes(entityType)) {
			return null; // Don't display minor events
		}

		let message = '';

		switch (entityType) {
			case 'FamilyMember':
				if (action === 'create') {
					// Check if this is a birth (child with parent) or new root member
					let newValues = null;
					try {
						newValues = log.newValues ? JSON.parse(log.newValues) : null;
					} catch {
						// Ignore parsing errors
					}
					if (newValues && newValues.parentId) {
						message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.birthRecorded' });
					} else {
						message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.newMemberAdded' });
					}
				} else if (action === 'update') {
					message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.memberUpdated' });
				} else if (action === 'delete') {
					message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.memberRemoved' });
				}
				break;
			case 'PassingRecord':
				message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.passingAdded' });
				break;
			case 'Achievement':
				message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.achievementRecorded' });
				break;
			case 'SpouseRelationship':
				if (action === 'create') {
					message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.marriageRecorded' });
				} else if (action === 'update') {
					// Check if this is a divorce (divorceDate was added)
					let oldValues = null;
					let newValues = null;
					try {
						oldValues = log.oldValues ? JSON.parse(log.oldValues) : null;
						newValues = log.newValues ? JSON.parse(log.newValues) : null;
					} catch {
						// Ignore parsing errors
					}

					if (newValues && newValues.divorceDate && (!oldValues || !oldValues.divorceDate)) {
						message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.divorceRecorded' });
					}
				} else if (action === 'delete') {
					message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.marriageRemoved' });
				} else if (action === 'delete') {
					message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.divorceRecorded' });
				}
				break;
			case 'FamilyTree':
				if (action === 'update') {
					message = intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.treeUpdated' });
				}
				break;
			default:
				message = `${entityType} ${action}d`;
		}

		return message;
	};

	const formatChangeLogTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.justNow' });
		if (diffInMinutes < 60)
			return intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.minutesAgo' }, { count: diffInMinutes });

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24)
			return intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.hoursAgo' }, { count: diffInHours });

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7)
			return intl.formatMessage({ id: 'familyTreeDashboard.recentChanges.daysAgo' }, { count: diffInDays });

		return date.toLocaleDateString();
	};

	return (
		<div className="flex h-full overflow-hidden">
			{/* Main Content */}
			<div className="flex-1 overflow-y-auto p-4 lg:p-8">
				<div className="space-y-8">
					{/* Overview Section */}
					<div className="flex gap-4 sm:gap-6 flex-col xl:flex-row">
						{/* Family Information Overview Box */}
						<div className="flex-1 bg-[#f4f4f5] rounded-[20px] p-4 sm:p-6 relative min-h-62">
							<div className="flex items-center gap-3 mb-6">
								<div className="bg-white p-2 rounded-[10px] shadow-sm">
									<Info className="w-5 h-5 text-black" />
								</div>
								<h2 className="font-inter font-bold text-[15px] text-black">
									<FormattedMessage id="familyTreeDashboard.overview.title" />
								</h2>
								{!isGuest && (
									<button
										onClick={() => setIsEditFamilyTreeModalOpen(true)}
										className="ml-auto p-1 hover:bg-white/50 rounded-lg transition-colors"
									>
										<Pencil className="w-4 h-4 text-gray-500" />
									</button>
								)}
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 mb-8 ml-2">
								<div className="flex items-center gap-3">
									<Users className="w-4 h-4 text-black" />
									<span className="font-inter font-bold text-[15px] text-black">
										<FormattedMessage id="familyTreeDashboard.overview.familyName" />
									</span>
									<span className="font-inter font-normal text-[#827f7f] text-[15px]">{familyTree.familyName}</span>
								</div>
								<div className="flex items-center gap-3">
									<MapPin className="w-4 h-4 text-black" />
									<span className="font-inter font-bold text-[15px] text-black">
										<FormattedMessage id="familyTreeDashboard.overview.origin" />
									</span>
									<span className="font-inter font-normal text-[#827f7f] text-[15px]">
										{familyTree.origin || intl.formatMessage({ id: 'familyTreeDashboard.overview.notSpecified' })}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<Calendar className="w-4 h-4 text-black" />
									<span className="font-inter font-bold text-[15px] text-black">
										<FormattedMessage id="familyTreeDashboard.overview.established" />
									</span>
									<span className="font-inter font-normal text-[#827f7f] text-[15px]">
										{familyTree.establishYear}{' '}
										{calculateAge(familyTree.establishYear) &&
											`(${calculateAge(familyTree.establishYear)} ${intl.formatMessage({ id: 'familyTreeDashboard.overview.years' })})`}{' '}
									</span>
								</div>
							</div>
							{/* Stat Boxes */}
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
								<div className="bg-white rounded-[15px] p-3 text-center shadow-sm border border-gray-100">
									<p className="font-inter font-medium text-[11.6px] text-black mb-1">
										<FormattedMessage id="familyTreeDashboard.overview.totalGenerations" />
									</p>
									<p className="font-inter font-medium text-[17.5px] text-black">{statistics?.totalGenerations}</p>
								</div>
								<div className="bg-white rounded-[15px] p-3 text-center shadow-sm border border-gray-100">
									<p className="font-inter font-medium text-[11.6px] text-black mb-1">
										<FormattedMessage id="familyTreeDashboard.overview.totalMembers" />
									</p>
									<p className="font-inter font-medium text-[17.5px] text-black">{statistics?.totalMembers}</p>
								</div>
								<div className="bg-white rounded-[15px] p-3 text-center shadow-sm border border-gray-100">
									<p className="font-inter font-medium text-[11.6px] text-black mb-1">
										<FormattedMessage id="familyTreeDashboard.overview.livingMembers" />
									</p>
									<p className="font-inter font-medium text-[17.5px] text-black">{statistics?.livingMembers}</p>
								</div>
							</div>
						</div>

						{/* Trends Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full xl:w-117">
							{/* Member Growth */}
							<div className="bg-[#f4f4f5] rounded-[20px] p-4 flex flex-col justify-between">
								<div className="flex justify-between items-start">
									<p className="font-roboto font-normal text-[12px] text-black">
										<FormattedMessage id="familyTreeDashboard.trends.memberGrowth" />
									</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Users className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.memberGrowth.count} <FormattedMessage id="familyTreeDashboard.trends.member" />
									</p>
									<div className="flex items-center gap-1">
										<span className="font-inter font-light text-[12px] text-black">
											+{statistics?.memberGrowth.percentage}%
										</span>
										<TrendingUp className="w-4 h-4 text-green-600" />
									</div>
								</div>
							</div>

							{/* Death Trend */}
							<div className="bg-[#f4f4f5] rounded-[20px] p-4 flex flex-col justify-between">
								<div className="flex justify-between items-start">
									<p className="font-roboto font-normal text-[12px] text-black">
										<FormattedMessage id="familyTreeDashboard.trends.deathTrend" />
									</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Skull className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.deathTrend.count} <FormattedMessage id="familyTreeDashboard.trends.death" />
									</p>
								</div>
							</div>

							{/* Marriage Trend */}
							<div className="bg-[#f4f4f5] rounded-[20px] p-4 flex flex-col justify-between">
								<div className="flex justify-between items-start">
									<p className="font-roboto font-normal text-[14px] text-black">
										<FormattedMessage id="familyTreeDashboard.trends.marriageTrend" />
									</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Heart className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.marriageTrend.marriages} <FormattedMessage id="familyTreeDashboard.trends.married" />
									</p>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.marriageTrend.divorces} <FormattedMessage id="familyTreeDashboard.trends.divorced" />
									</p>
								</div>
							</div>

							{/* Achievement Growth */}
							<div className="bg-[#f4f4f5] rounded-[20px] p-4 flex flex-col justify-between">
								<div className="flex justify-between items-start">
									<p className="font-roboto font-normal text-[14px] text-black">
										<FormattedMessage id="familyTreeDashboard.trends.achievementGrowth" />
									</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Trophy className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.achievementGrowth.count}{' '}
										<FormattedMessage id="familyTreeDashboard.trends.achievements" />
									</p>
									<div className="flex items-center gap-1">
										<span className="font-inter font-light text-[12px] text-black">
											+{statistics?.achievementGrowth.percentage}%
										</span>
										<TrendingUp className="w-4 h-4 text-green-600" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Quick Action Section - Hide for guests */}
				{!isGuest && (
					<div className="space-y-4">
						<h2 className="font-inter font-bold text-base sm:text-[18px] pt-4 text-black">
							<FormattedMessage id="familyTreeDashboard.quickAction.title" />
						</h2>
						<div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
							<button
								onClick={async () => {
									await fetchExistingMembers();
									openPanel('member', {
										mode: 'add',
										familyTreeId,
										existingMembers,
									});
								}}
								className="h-14 bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<UserPlus className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">
									<FormattedMessage id="familyTreeDashboard.quickAction.addMember" />
								</span>
							</button>
							<button
								onClick={async () => {
									await fetchExistingMembers();
									openPanel('achievement', {
										mode: 'add',
										familyTreeId,
										familyMembers: existingMembers,
										onSuccess: refreshDashboardData,
									});
								}}
								className="h-14 bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<Trophy className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">
									<FormattedMessage id="familyTreeDashboard.quickAction.recordAchievement" />
								</span>
							</button>
							<button
								onClick={async () => {
									await fetchExistingMembers();
									openPanel('passing', {
										mode: 'add',
										familyTreeId,
										familyMembers: existingMembers,
										onSuccess: refreshDashboardData,
									});
								}}
								className="h-14 bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<Skull className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">
									<FormattedMessage id="familyTreeDashboard.quickAction.recordPassing" />
								</span>
							</button>
							<button
								onClick={() => router.push(`/family-trees/${familyTreeId}/tree`)}
								className="h-14 bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<TreePine className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">
									<FormattedMessage id="familyTreeDashboard.quickAction.viewFamilyTree" />
								</span>
							</button>
						</div>
					</div>
				)}

				{/* Recent Changes Section - Hidden for guests */}
				{!isGuest && (
					<div className="space-y-4 pt-4">
						<div className="flex items-center justify-between">
							<h2 className="font-inter font-bold text-[18px] text-black">
								<FormattedMessage id="familyTreeDashboard.recentChanges.title" />
							</h2>
							<button
								onClick={() => setIsAllChangeLogsModalOpen(true)}
								className="px-4 py-2 bg-[#1f2937] text-white rounded-[10px] font-normal text-sm hover:bg-[#111827] transition-colors"
							>
								<FormattedMessage id="familyTreeDashboard.recentChanges.seeAll" />
							</button>
						</div>

						<div className="space-y-4">
							{changeLogs.length === 0 ? (
								<div className="text-center py-8 text-gray-500 bg-[#f4f4f5] rounded-[20px]">
									<p>
										<FormattedMessage id="familyTreeDashboard.recentChanges.noChanges" />
									</p>
								</div>
							) : (
								changeLogs
									.filter((log) => {
										const message = formatChangeLogMessage(log);
										return message !== null;
									})
									.slice(0, 3)
									.map((log) => {
										const message = formatChangeLogMessage(log);
										return message ? (
											<div
												key={log.id}
												className="h-25 flex items-center justify-between px-6 bg-[#f4f4f5] rounded-[20px]"
											>
												<div className="flex items-center gap-4 flex-1">
													<div className="w-12.5 h-12.5 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center shrink-0">
														<Users className="w-6 h-6 text-gray-500" />
													</div>
													<div className="flex-1 text-black">
														<p className="font-inter font-medium text-[18px] mb-1">{getUserName(log)}</p>
														<p className="font-inter font-light text-[18px] ">{message}</p>
													</div>
												</div>
												<div className="flex items-center gap-2 shrink-0">
													<Clock className="w-5 h-5 text-black" />
													<span className="font-inter font-light text-[18px] text-black whitespace-nowrap">
														{formatChangeLogTimestamp(log.createdAt)}
													</span>
												</div>
											</div>
										) : null;
									})
									.filter(Boolean)
							)}
						</div>
					</div>
				)}

				{/* Change Log Details Modal */}
				{isChangeLogDetailsModalOpen && (
					<ChangeLogDetailsModal
						isOpen={isChangeLogDetailsModalOpen}
						onClose={() => setIsChangeLogDetailsModalOpen(false)}
						changeLog={selectedChangeLog}
					/>
				)}

				{/* Edit Family Tree Modal */}
				{isEditFamilyTreeModalOpen && familyTree && (
					<EditFamilyTreeModal
						isOpen={isEditFamilyTreeModalOpen}
						onClose={() => setIsEditFamilyTreeModalOpen(false)}
						familyTree={familyTree}
						onFamilyTreeUpdated={() => {
							// Refresh family tree data after update
							fetchFamilyTreeData();
						}}
					/>
				)}

				{/* All Change Logs Modal */}
				<AllChangeLogsModal
					isOpen={isAllChangeLogsModalOpen}
					onClose={() => setIsAllChangeLogsModalOpen(false)}
					familyTreeId={familyTreeId}
					onLogClick={(log) => {
						// Keep All Change Logs modal open and show details modal on top
						setSelectedChangeLog(log);
						setIsChangeLogDetailsModalOpen(true);
					}}
				/>
			</div>

			{/* Panel Renderer */}
			<PanelRenderer />
		</div>
	);
}
