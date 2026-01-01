'use client';

import classNames from 'classnames';
import {
	Users,
	Heart,
	TreePine,
	Calendar,
	ChevronRight,
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

import LoadingScreen from '@/components/LoadingScreen';
import ChangeLogDetailsModal from '@/components/modals/ChangeLogDetailsModal';
import EditFamilyTreeModal from '@/components/modals/EditFamilyTreeModal';
import AchievementPanel from '@/components/panels/AchievementPanel';
import AddMemberPanel from '@/components/panels/AddMemberPanel';
import PassingPanel from '@/components/panels/PassingPanel';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import { FamilyTreeService, FamilyMemberService, ChangeLogService } from '@/lib/services';
import { FamilyMember } from '@/types';

// Mock data types (representing API responses)
interface FamilyTree {
	id: number;
	familyName: string;
	origin: string | null;
	establishYear: number | null;
	createdAt: string;
	treeOwner: {
		fullName: string;
	};
}

interface FamilyStatistics {
	totalGenerations: number;
	totalMembers: number;
	livingMembers: number;
	memberGrowth: { count: number; percentage: number };
	deathTrend: { count: number; percentage: number };
	marriageTrend: { marriages: number; divorces: number };
	achievementGrowth: { count: number; percentage: number };
}

interface ChangeLog {
	id: number;
	entityType: string;
	entityId: number;
	action: string;
	userId: string | null;
	familyTreeId: number;
	oldValues: string | null;
	newValues: string | null;
	createdAt: string;
}

export default function FamilyTreeDashboard() {
	const router = useRouter();
	const params = useParams();
	const familyTreeId = params.id as string;
	const { isGuest } = useGuestSession();

	// State for API data
	const [familyTree, setFamilyTree] = useState<FamilyTree | null>(null);
	const [statistics, setStatistics] = useState<FamilyStatistics | null>(null);
	const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([]);
	const [selectedChangeLog, setSelectedChangeLog] = useState<ChangeLog | null>(null);
	const [isChangeLogDetailsModalOpen, setIsChangeLogDetailsModalOpen] = useState(false);
	const [isEditFamilyTreeModalOpen, setIsEditFamilyTreeModalOpen] = useState(false);

	// Panel state
	const [activePanelType, setActivePanelType] = useState<'addMember' | 'achievement' | 'passing' | null>(null);

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
				const divorcesCount = recentLogs.filter(
					(log) => log.entityType === 'SpouseRelationship' && log.action === 'DELETE'
				).length;
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
	}, [familyTreeId]);

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
			const divorcesCount = recentLogs.filter(
				(log) => log.entityType === 'SpouseRelationship' && log.action === 'DELETE'
			).length;
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
		try {
			const logs = await ChangeLogService.getByFamilyTreeId(familyTreeId);
			setChangeLogs(logs);
		} catch (error) {
			console.error('Error fetching change logs:', error);
			setChangeLogs([]);
		}
	};

	if (loading) {
		return <LoadingScreen message="Loading family tree data..." />;
	}

	if (!familyTree) {
		return (
			<div className="text-center py-12">
				<div className="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
					<h2 className="text-lg font-semibold text-red-800 mb-2">Family Tree Not Found</h2>
					<p className="text-red-600 mb-4">
						The family tree you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
					</p>
					<button
						onClick={() => router.push('/dashboard')}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Go to Dashboard
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
						message = 'Birth recorded';
					} else {
						message = 'New family member added';
					}
				} else if (action === 'update') {
					message = 'Family member information updated';
				} else if (action === 'delete') {
					message = 'Family member removed';
				}
				break;
			case 'PassingRecord':
				message = 'Passing record added';
				break;
			case 'Achievement':
				message = 'Achievement recorded';
				break;
			case 'SpouseRelationship':
				if (action === 'create') {
					message = 'Marriage recorded';
				} else if (action === 'delete') {
					message = 'Divorce recorded';
				}
				break;
			case 'FamilyTree':
				if (action === 'update') {
					message = 'Family tree information updated';
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

		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours} hours ago`;

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays < 7) return `${diffInDays} days ago`;

		return date.toLocaleDateString();
	};

	const handleChangeLogClick = (log: ChangeLog) => {
		setSelectedChangeLog(log);
		setIsChangeLogDetailsModalOpen(true);
	};

	return (
		<div className="flex h-full overflow-hidden">
			{/* Main Content */}
			<div className="flex-1 overflow-y-auto p-4 lg:p-8">
				<div className="space-y-8">
					{/* Overview Section */}
					<div className={classNames('flex gap-6', activePanelType !== null ? 'flex-col' : 'flex-col xl:flex-row')}>
						{/* Family Information Overview Box */}
						<div className="flex-1 bg-[#f4f4f5] rounded-[20px] p-6 relative min-h-[248px]">
							<div className="flex items-center gap-3 mb-6">
								<div className="bg-white p-2 rounded-[10px] shadow-sm">
									<Info className="w-5 h-5 text-black" />
								</div>
								<h2 className="font-inter font-bold text-[15px] text-black">Family Information Overview</h2>
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
									<span className="font-inter font-bold text-[15px] text-black">Family Name:</span>
									<span className="font-inter font-normal text-[#827f7f] text-[15px]">{familyTree.familyName}</span>
								</div>
								<div className="flex items-center gap-3">
									<MapPin className="w-4 h-4 text-black" />
									<span className="font-inter font-bold text-[15px] text-black">Origin:</span>
									<span className="font-inter font-normal text-[#827f7f] text-[15px]">
										{familyTree.origin || 'Not specified'}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<Calendar className="w-4 h-4 text-black" />
									<span className="font-inter font-bold text-[15px] text-black">Established:</span>
									<span className="font-inter font-normal text-[#827f7f] text-[15px]">
										{familyTree.establishYear}{' '}
										{calculateAge(familyTree.establishYear) && `(${calculateAge(familyTree.establishYear)} years)`}
									</span>
								</div>
							</div>

							{/* Stat Boxes */}
							<div className="grid grid-cols-3 gap-4">
								<div className="bg-white rounded-[15px] p-3 text-center shadow-sm border border-gray-100">
									<p className="font-inter font-medium text-[11.6px] text-black mb-1">Total generations</p>
									<p className="font-inter font-medium text-[17.5px] text-black">{statistics?.totalGenerations}</p>
								</div>
								<div className="bg-white rounded-[15px] p-3 text-center shadow-sm border border-gray-100">
									<p className="font-inter font-medium text-[11.6px] text-black mb-1">All Members</p>
									<p className="font-inter font-medium text-[17.5px] text-black">{statistics?.totalMembers}</p>
								</div>
								<div className="bg-white rounded-[15px] p-3 text-center shadow-sm border border-gray-100">
									<p className="font-inter font-medium text-[11.6px] text-black mb-1">Living Members</p>
									<p className="font-inter font-medium text-[17.5px] text-black">{statistics?.livingMembers}</p>
								</div>
							</div>
						</div>

						{/* Trends Grid */}
						<div
							className={classNames(
								'grid grid-cols-1 sm:grid-cols-2 gap-4 w-full',
								activePanelType === null ? 'xl:w-[468px]' : ''
							)}
						>
							{/* Member Growth */}
							<div className="bg-[#f4f4f5] rounded-[20px] p-4 flex flex-col justify-between">
								<div className="flex justify-between items-start">
									<p className="font-roboto font-normal text-[12px] text-black">Member growth</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Users className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.memberGrowth.count} Member
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
									<p className="font-roboto font-normal text-[12px] text-black">Death Trend</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Skull className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.deathTrend.count} Death
									</p>
								</div>
							</div>

							{/* Marriage Trend */}
							<div className="bg-[#f4f4f5] rounded-[20px] p-4 flex flex-col justify-between">
								<div className="flex justify-between items-start">
									<p className="font-roboto font-normal text-[14px] text-black">Marriage Trend</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Heart className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.marriageTrend.marriages} Married
									</p>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.marriageTrend.divorces} Divorced
									</p>
								</div>
							</div>

							{/* Achievement Growth */}
							<div className="bg-[#f4f4f5] rounded-[20px] p-4 flex flex-col justify-between">
								<div className="flex justify-between items-start">
									<p className="font-roboto font-normal text-[14px] text-black">Achievement Growth</p>
									<div className="bg-[#d4d4d8] p-2 rounded-[10px]">
										<Trophy className="w-5 h-5 text-black" />
									</div>
								</div>
								<div>
									<p className="font-roboto font-semibold text-[16px] text-black">
										+{statistics?.achievementGrowth.count} Achievements
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
						<h2 className="font-inter font-bold text-[18px] p-4 text-black">Quick Action</h2>
						<div
							className={classNames(
								'grid gap-6',
								activePanelType !== null ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
							)}
						>
							<button
								onClick={() => {
									setActivePanelType('addMember');
									fetchExistingMembers();
								}}
								className="h-[56px] bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<UserPlus className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">Add Member</span>
							</button>
							<button
								onClick={() => {
									setActivePanelType('achievement');
									fetchExistingMembers();
								}}
								className="h-[56px] bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<Trophy className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">Record Achievement</span>
							</button>
							<button
								onClick={() => {
									setActivePanelType('passing');
									fetchExistingMembers();
								}}
								className="h-[56px] bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<Skull className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">Record Passing</span>
							</button>
							<button
								onClick={() => router.push(`/family-trees/${familyTreeId}/tree`)}
								className="h-[56px] bg-[#f4f4f5] rounded-[10px] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors"
							>
								<TreePine className="w-5 h-5 text-black" />
								<span className="font-roboto font-semibold text-[16px] text-black">View Family Tree</span>
							</button>
						</div>
					</div>
				)}

				{/* Recent Changes Section */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="font-inter font-bold text-[18px] text-black">Recent Changes</h2>
						<div className="flex gap-2">
							<button className="w-[50px] h-[50px] bg-[#f4f4f5] rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
								<ChevronRight className="w-5 h-5 text-black rotate-180" />
							</button>
							<button className="w-[50px] h-[50px] bg-[#f4f4f5] rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
								<ChevronRight className="w-5 h-5 text-black" />
							</button>
						</div>
					</div>

					<div className="space-y-4">
						{changeLogs.length === 0 ? (
							<div className="text-center py-8 text-gray-500 bg-[#f4f4f5] rounded-[20px]">
								<p>No major changes recorded yet.</p>
							</div>
						) : (
							changeLogs
								.slice(0, 4)
								.map((log) => {
									const message = formatChangeLogMessage(log);
									return message ? (
										<div
											key={log.id}
											className="flex items-center justify-between p-6 bg-[#f4f4f5] rounded-[20px] cursor-pointer hover:bg-gray-200 transition-colors"
											onClick={() => handleChangeLogClick(log)}
										>
											<div className="flex items-center gap-4">
												<div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
													<Users className="w-6 h-6 text-gray-500" />
												</div>
												<div>
													<p className="font-inter font-medium text-[18px] text-black">System</p>
													<p className="font-inter font-light text-[18px] text-black">{message}</p>
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Clock className="w-5 h-5 text-black" />
												<span className="font-inter font-light text-[18px] text-black">
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
			</div>

			{/* Panel Sidebar */}
			<aside
				className={classNames(
					'transition-all duration-300 ease-in-out border-l border-gray-100 bg-white overflow-hidden shrink-0 h-full',
					activePanelType !== null ? 'w-[600px]' : 'w-0'
				)}
			>
				{activePanelType === 'addMember' && (
					<AddMemberPanel
						familyTreeId={familyTreeId}
						existingMembers={existingMembers}
						onClose={() => setActivePanelType(null)}
						onSuccess={() => {
							// Refresh data after adding member
							fetchFamilyTreeData();
							fetchStatistics();
							fetchActivities();
							fetchExistingMembers();
							setActivePanelType(null);
						}}
					/>
				)}

				{activePanelType === 'achievement' && (
					<AchievementPanel
						mode="add"
						familyTreeId={familyTreeId}
						familyMembers={existingMembers}
						onModeChange={() => {
							// Not needed for add mode
						}}
						onClose={() => setActivePanelType(null)}
						onSuccess={() => {
							// Refresh data after recording achievement
							fetchFamilyTreeData();
							fetchStatistics();
							fetchActivities();
							fetchExistingMembers();
							setActivePanelType(null);
						}}
					/>
				)}

				{activePanelType === 'passing' && (
					<PassingPanel
						mode="add"
						familyTreeId={familyTreeId}
						familyMembers={existingMembers}
						onModeChange={() => {
							// Not needed for add mode
						}}
						onClose={() => setActivePanelType(null)}
						onSuccess={() => {
							// Refresh data after recording passing
							fetchFamilyTreeData();
							fetchStatistics();
							fetchActivities();
							fetchExistingMembers();
							setActivePanelType(null);
						}}
					/>
				)}
			</aside>
		</div>
	);
}
