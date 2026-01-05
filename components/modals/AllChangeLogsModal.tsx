'use client';

import { X, Calendar, ChevronDown, User } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { ChangeLogService } from '@/lib/services';
import { ChangeLog } from '@/types/changelog';
import { AllChangeLogsModalProps } from '@/types/ui';

export default function AllChangeLogsModal({ isOpen, onClose, familyTreeId, onLogClick }: AllChangeLogsModalProps) {
	const intl = useIntl();
	const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<string>('');
	const [selectedYear, setSelectedYear] = useState<string>('');

	useEffect(() => {
		const fetchChangeLogs = async () => {
			setLoading(true);
			try {
				const logs = await ChangeLogService.getByFamilyTreeId(familyTreeId);
				console.log('Fetched change logs:', logs);
				console.log(
					'SpouseRelationship logs:',
					logs.filter((log: ChangeLog) => log.entityType === 'SpouseRelationship')
				);
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
						message = intl.formatMessage({ id: 'modal.allChangeLogs.birthRecorded' });
					} else {
						message = intl.formatMessage({ id: 'modal.allChangeLogs.addedNewMember' });
					}
				} else if (action === 'update') {
					message = intl.formatMessage({ id: 'modal.allChangeLogs.familyMemberUpdated' });
				} else if (action === 'delete') {
					message = intl.formatMessage({ id: 'modal.allChangeLogs.familyMemberRemoved' });
				}
				break;
			case 'PassingRecord':
				message = intl.formatMessage({ id: 'modal.allChangeLogs.passingRecordAdded' });
				break;
			case 'Achievement':
				message = intl.formatMessage({ id: 'modal.allChangeLogs.achievementRecorded' });
				break;
			case 'SpouseRelationship':
				if (action === 'create') {
					message = intl.formatMessage({ id: 'modal.allChangeLogs.marriageRecorded' });
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

					console.log(`SpouseRelationship UPDATE - oldValues:`, oldValues, 'newValues:', newValues);

					if (newValues && newValues.divorceDate && (!oldValues || !oldValues.divorceDate)) {
						message = intl.formatMessage({ id: 'modal.allChangeLogs.divorceRecorded' });
					} else {
						message = intl.formatMessage({ id: 'modal.allChangeLogs.marriageUpdated' });
					}
				} else if (action === 'delete') {
					message = intl.formatMessage({ id: 'modal.allChangeLogs.marriageDeleted' });
				}
				break;
			case 'FamilyTree':
				if (action === 'update') {
					message = intl.formatMessage({ id: 'modal.allChangeLogs.familyTreeUpdated' });
				}
				break;
			default:
				message = `${entityType} ${action}d`;
		}

		if (entityType === 'SpouseRelationship') {
			console.log(`SpouseRelationship ${action} message: "${message}"`);
		}

		return message;
	};

	const getUserName = (log: ChangeLog) => {
		// Return user name if available, otherwise fallback to email or 'Unknown User'
		if (log.user) {
			return log.user.name || log.user.email || 'Unknown User';
		}
		return log.userId ? 'Unknown User' : 'Unknown User';
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
	const months = useMemo(
		() => [
			{ value: '01', label: intl.formatMessage({ id: 'modal.allChangeLogs.january' }) },
			{ value: '02', label: intl.formatMessage({ id: 'modal.allChangeLogs.february' }) },
			{ value: '03', label: intl.formatMessage({ id: 'modal.allChangeLogs.march' }) },
			{ value: '04', label: intl.formatMessage({ id: 'modal.allChangeLogs.april' }) },
			{ value: '05', label: intl.formatMessage({ id: 'modal.allChangeLogs.may' }) },
			{ value: '06', label: intl.formatMessage({ id: 'modal.allChangeLogs.june' }) },
			{ value: '07', label: intl.formatMessage({ id: 'modal.allChangeLogs.july' }) },
			{ value: '08', label: intl.formatMessage({ id: 'modal.allChangeLogs.august' }) },
			{ value: '09', label: intl.formatMessage({ id: 'modal.allChangeLogs.september' }) },
			{ value: '10', label: intl.formatMessage({ id: 'modal.allChangeLogs.october' }) },
			{ value: '11', label: intl.formatMessage({ id: 'modal.allChangeLogs.november' }) },
			{ value: '12', label: intl.formatMessage({ id: 'modal.allChangeLogs.december' }) },
		],
		[intl]
	);

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
						<h2 className="text-[26px] font-normal text-black text-center flex-1">
							<FormattedMessage id="modal.allChangeLogs.title" />
						</h2>
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
								<option value="">
									<FormattedMessage id="modal.allChangeLogs.month" />
								</option>
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
								<option value="">
									<FormattedMessage id="modal.allChangeLogs.year" />
								</option>
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
							<p className="text-gray-500">
								<FormattedMessage id="modal.allChangeLogs.loading" />
							</p>
						</div>
					) : filteredLogs.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500">
								<FormattedMessage id="modal.allChangeLogs.noLogs" />
							</p>
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
												<div className="space-y-1">
													<p className="font-inter font-light text-[16px] text-black">{message}</p>
													{log.familyMemberName && (
														<p className="font-inter font-light text-[14px] text-gray-600">
															<FormattedMessage
																id="modal.allChangeLogs.affectedLabel"
																values={{
																	name: <span className="font-medium text-black">{log.familyMemberName}</span>,
																}}
															/>
														</p>
													)}
												</div>
											</div>
										</div>

										{/* Timestamp */}
										<div className="flex items-center gap-2 px-6">
											<Calendar className="w-5 h-5 text-black shrink-0" />
											<span className="font-inter font-light text-[18px] text-black whitespace-nowrap">
												<FormattedDate
													value={new Date(log.createdAt)}
													year="numeric"
													month="2-digit"
													day="2-digit"
													hour="2-digit"
													minute="2-digit"
													hour12
												/>
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
