'use client';

import { X, Calendar, ChevronDown, User } from 'lucide-react';
import { useState, useEffect } from 'react';

import { ChangeLogService } from '@/lib/services';

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

interface AllChangeLogsModalProps {
	isOpen: boolean;
	onClose: () => void;
	familyTreeId: string;
	onLogClick?: (log: ChangeLog) => void;
}

export default function AllChangeLogsModal({ isOpen, onClose, familyTreeId, onLogClick }: AllChangeLogsModalProps) {
	const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<string>('');
	const [selectedYear, setSelectedYear] = useState<string>('');

	useEffect(() => {
		const fetchChangeLogs = async () => {
			setLoading(true);
			try {
				const logs = await ChangeLogService.getByFamilyTreeId(familyTreeId);
				setChangeLogs(logs);
			} catch (error) {
				console.error('Error fetching change logs:', error);
				setChangeLogs([]);
			} finally {
				setLoading(false);
			}
		};

		if (isOpen) {
			fetchChangeLogs();
		}
	}, [isOpen, familyTreeId]);

	const formatChangeLogMessage = (log: ChangeLog) => {
		const entityType = log.entityType;
		const action = log.action.toLowerCase();

		let message = '';

		switch (entityType) {
			case 'FamilyMember':
				if (action === 'create') {
					let newValues = null;
					try {
						newValues = log.newValues ? JSON.parse(log.newValues) : null;
					} catch {
						// Ignore parsing errors
					}
					if (newValues && newValues.parentId) {
						message = 'Birth recorded';
					} else {
						message = 'Added new member';
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
				} else if (action === 'update') {
					message = 'Marriage information updated';
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
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		// const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
		const displayHours = date.getHours() % 12 || 12;

		return `${year}-${month}-${day} ${displayHours}:${minutes} ${ampm}`;
	};

	const getUserName = (log: ChangeLog) => {
		// For now, return "System" if userId is null
		// In the future, you can fetch user details from userId
		return log.userId ? 'User' : 'System';
	};

	// const getUserAvatar = (log: ChangeLog) => {
	// 	// Return default avatar path or user avatar if available
	// 	// For now, return null to use icon fallback
	// 	return null;
	// };

	const filteredLogs = changeLogs.filter((log) => {
		if (!selectedMonth && !selectedYear) return true;

		const logDate = new Date(log.createdAt);
		const logMonth = String(logDate.getMonth() + 1).padStart(2, '0');
		const logYear = String(logDate.getFullYear());

		if (selectedMonth && logMonth !== selectedMonth) return false;
		if (selectedYear && logYear !== selectedYear) return false;

		return true;
	});

	// Generate month and year options
	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
	const months = [
		{ value: '01', label: 'January' },
		{ value: '02', label: 'February' },
		{ value: '03', label: 'March' },
		{ value: '04', label: 'April' },
		{ value: '05', label: 'May' },
		{ value: '06', label: 'June' },
		{ value: '07', label: 'July' },
		{ value: '08', label: 'August' },
		{ value: '09', label: 'September' },
		{ value: '10', label: 'October' },
		{ value: '11', label: 'November' },
		{ value: '12', label: 'December' },
	];

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>

			{/* Modal Content */}
			<div
				className="bg-white rounded-[30px] border-[3px] border-black/20 shadow-2xl w-full max-w-[1208px] h-[856px] pt-6 px-6 pb-6 relative z-10 flex flex-col overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="px-8 pt-6 pb-4 flex-shrink-0 border-b border-gray-200">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-[26px] font-normal text-black text-center flex-1">All Changes</h2>
						<button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
							<X className="w-6 h-6 text-black" />
						</button>
					</div>

					{/* Filters */}
					<div className="flex gap-4">
						<div className="relative">
							<select
								value={selectedMonth}
								onChange={(e) => setSelectedMonth(e.target.value)}
								className="w-[138px] h-[40px] px-4 pr-10 bg-white border border-black rounded-[20px] text-[18px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
							>
								<option value="">Month</option>
								{months.map((month) => (
									<option key={month.value} value={month.value}>
										{month.label}
									</option>
								))}
							</select>
							<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
						</div>

						<div className="relative">
							<select
								value={selectedYear}
								onChange={(e) => setSelectedYear(e.target.value)}
								className="w-[134px] h-[40px] px-4 pr-10 bg-white border border-black rounded-[20px] text-[18px] text-black appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
							>
								<option value="">Year</option>
								{years.map((year) => (
									<option key={year} value={String(year)}>
										{year}
									</option>
								))}
							</select>
							<ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
						</div>
					</div>
				</div>

				{/* Content - Scrollable */}
				<div className="flex-1 overflow-y-auto px-[28px] py-6">
					{loading ? (
						<div className="text-center py-12">
							<p className="text-gray-500">Loading change logs...</p>
						</div>
					) : filteredLogs.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500">No change logs found.</p>
						</div>
					) : (
						<div className="space-y-0">
							{filteredLogs.map((log) => {
								const message = formatChangeLogMessage(log);
								if (!message) return null;

								return (
									<div
										key={log.id}
										className="h-[100px] flex items-center justify-between px-0 py-0 bg-[#f4f4f5] rounded-[20px] mb-4 cursor-pointer hover:bg-gray-200 transition-colors last:mb-0"
										onClick={() => {
											if (onLogClick) {
												onLogClick(log);
											}
										}}
									>
										<div className="flex items-center gap-4 flex-1 px-6">
											{/* Avatar */}
											<div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-gray-300 flex items-center justify-center flex-shrink-0">
												<User className="w-6 h-6 text-gray-500" />
											</div>

											{/* User Info */}
											<div className="flex-1">
												<p className="font-inter font-medium text-[18px] text-black mb-1">{getUserName(log)}</p>
												<p className="font-inter font-light text-[18px] text-black">{message}</p>
											</div>
										</div>

										{/* Timestamp */}
										<div className="flex items-center gap-2 px-6">
											<Calendar className="w-5 h-5 text-black flex-shrink-0" />
											<span className="font-inter font-light text-[18px] text-black whitespace-nowrap">
												{formatChangeLogTimestamp(log.createdAt)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
