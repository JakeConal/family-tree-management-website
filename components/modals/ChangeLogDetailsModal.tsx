'use client';

import classNames from 'classnames';
import { X, Clock, User, FileText, Trophy, Briefcase, Heart, Skull } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import LoadingScreen from '@/components/LoadingScreen';
import {
	ChangeLog,
	ChangeDetail,
	FamilyMemberData,
	AchievementData,
	SpouseRelationshipData,
	OccupationData,
	BurialPlace,
	PassingRecordData,
	ChangeLogData,
} from '@/types/changelog';
import { ChangeLogDetailsModalProps } from '@/types/ui';

export default function ChangeLogDetailsModal({ isOpen, onClose, changeLog }: ChangeLogDetailsModalProps) {
	const intl = useIntl();
	const [relatedMembers, setRelatedMembers] = useState<{
		[key: number]: { fullName: string };
	}>({});
	const [loadingMembers, setLoadingMembers] = useState(false);

	useEffect(() => {
		if (isOpen && changeLog) {
			fetchRelatedMembers(changeLog);
		}
	}, [isOpen, changeLog]);

	const fetchRelatedMembers = async (log: ChangeLog) => {
		setLoadingMembers(true);
		const memberIds: number[] = [];

		try {
			// Note: Achievement and PassingRecord already store familyMemberName directly in the change log data
			// So we don't need to fetch member information for these entity types
			if (log.entityType === 'SpouseRelationship') {
				// For spouse relationships, we need both members
				const newData = log.newValues ? JSON.parse(log.newValues) : null;
				const oldData = log.oldValues ? JSON.parse(log.oldValues) : null;
				const data = newData || oldData;
				if (data?.familyMember1Id) memberIds.push(data.familyMember1Id);
				if (data?.familyMember2Id) memberIds.push(data.familyMember2Id);
			}

			if (memberIds.length > 0) {
				const memberPromises = memberIds.map(async (memberId) => {
					try {
						const response = await fetch(`/api/family-members/${memberId}`);
						if (response.ok) {
							const member = await response.json();
							return { id: memberId, fullName: member.fullName };
						}
					} catch (error) {
						console.error(`Failed to fetch member ${memberId}:`, error);
					}
					return null;
				});

				const members = await Promise.all(memberPromises);
				const memberMap: { [key: number]: { fullName: string } } = {};
				members.forEach((member) => {
					if (member) {
						memberMap[member.id] = { fullName: member.fullName };
					}
				});
				setRelatedMembers(memberMap);
			}
		} catch (error) {
			console.error('Error fetching related members:', error);
		} finally {
			setLoadingMembers(false);
		}
	};

	const formatJSON = (jsonString: string | null) => {
		if (!jsonString) return 'No data';
		try {
			const parsed = JSON.parse(jsonString);
			return JSON.stringify(parsed, null, 2);
		} catch {
			return jsonString;
		}
	};

	const formatChangeDetails = (
		entityType: string,
		action: string,
		oldValues: string | null,
		newValues: string | null
	): ChangeDetail[] => {
		const parseValues = (values: string | null) => {
			if (!values) return null;
			try {
				return JSON.parse(values);
			} catch {
				return null;
			}
		};

		const oldData = parseValues(oldValues);
		const newData = parseValues(newValues);

		switch (entityType) {
			case 'FamilyMember':
				return formatFamilyMemberChanges(action, oldData, newData);
			case 'Achievement':
				return formatAchievementChanges(action, oldData, newData);
			case 'SpouseRelationship':
				return formatSpouseRelationshipChanges(action, oldData, newData);
			case 'Occupation':
				return formatOccupationChanges(action, oldData, newData);
			case 'PassingRecord':
				return formatPassingRecordChanges(action, oldData, newData);
			default:
				return formatGenericChanges(action, oldData, newData);
		}
	};

	const formatFamilyMemberChanges = (
		action: string,
		oldData: FamilyMemberData | null,
		newData: FamilyMemberData | null
	) => {
		const changes: ChangeDetail[] = [];

		if (action === 'CREATE' && newData) {
			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.name' }),
				oldValue: null,
				newValue: newData.fullName,
				type: 'text',
			});
			if (newData.birthday) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.birthday' }),
					oldValue: null,
					newValue: new Date(newData.birthday).toLocaleDateString(),
					type: 'date',
				});
			}
			if (newData.gender) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.gender' }),
					oldValue: null,
					newValue: newData.gender,
					type: 'text',
				});
			}
			if (newData.address) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.address' }),
					oldValue: null,
					newValue: newData.address,
					type: 'text',
				});
			}
			if (newData.generation) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.generation' }),
					oldValue: null,
					newValue: String(newData.generation),
					type: 'text',
				});
			}
			if (newData.isAdopted !== undefined) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.adopted' }),
					oldValue: null,
					newValue: newData.isAdopted
						? intl.formatMessage({ id: 'modal.changeLogDetails.values.yes' })
						: intl.formatMessage({ id: 'modal.changeLogDetails.values.no' }),
					type: 'boolean',
				});
			}
		} else if (action === 'UPDATE') {
			const fields = [
				{ key: 'fullName', label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.name' }), type: 'text' },
				{
					key: 'birthday',
					label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.birthday' }),
					type: 'date',
				},
				{ key: 'gender', label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.gender' }), type: 'text' },
				{ key: 'address', label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.address' }), type: 'text' },
				{
					key: 'generation',
					label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.generation' }),
					type: 'text',
				},
				{
					key: 'isAdopted',
					label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.adopted' }),
					type: 'boolean',
				},
				{
					key: 'profilePicture',
					label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.profilePicture' }),
					type: 'text',
				},
			];

			fields.forEach(({ key, label, type }) => {
				if (oldData?.[key] !== newData?.[key]) {
					let oldValue: string | null | undefined = oldData?.[key] as string | null | undefined;
					let newValue: string | null | undefined = newData?.[key] as string | null | undefined;

					if (type === 'date' && oldValue) oldValue = new Date(oldValue as string).toLocaleDateString();
					if (type === 'date' && newValue) newValue = new Date(newValue as string).toLocaleDateString();
					if (type === 'boolean' && oldValue !== undefined)
						oldValue = oldValue
							? intl.formatMessage({ id: 'modal.changeLogDetails.values.yes' })
							: intl.formatMessage({ id: 'modal.changeLogDetails.values.no' });
					if (type === 'boolean' && newValue !== undefined)
						newValue = newValue
							? intl.formatMessage({ id: 'modal.changeLogDetails.values.yes' })
							: intl.formatMessage({ id: 'modal.changeLogDetails.values.no' });

					changes.push({
						field: label,
						oldValue,
						newValue,
						type,
					});
				}
			});
		}

		return changes;
	};

	const formatAchievementChanges = (
		action: string,
		oldData: AchievementData | null,
		newData: AchievementData | null
	) => {
		const changes: ChangeDetail[] = [];

		if (action === 'CREATE' && newData) {
			// Add member information first - use the name stored directly in the change log
			const memberName =
				newData.familyMemberName || intl.formatMessage({ id: 'modal.changeLogDetails.values.unknownMember' });
			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.familyMember' }),
				oldValue: null,
				newValue: memberName,
				type: 'text',
			});

			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.title' }),
				oldValue: null,
				newValue: newData.title,
				type: 'text',
			});
			if (newData.achieveDate) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.achievementDate' }),
					oldValue: null,
					newValue: new Date(newData.achieveDate).toLocaleDateString(),
					type: 'date',
				});
			}
			if (newData.description) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.description' }),
					oldValue: null,
					newValue: newData.description,
					type: 'text',
				});
			}
		} else if (action === 'UPDATE') {
			const fields = [
				{ key: 'title', label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.title' }), type: 'text' },
				{
					key: 'achieveDate',
					label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.achievementDate' }),
					type: 'date',
				},
				{
					key: 'description',
					label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.description' }),
					type: 'text',
				},
			];

			fields.forEach(({ key, label, type }) => {
				if (oldData?.[key] !== newData?.[key]) {
					let oldValue: string | null | undefined = oldData?.[key] as string | null | undefined;
					let newValue: string | null | undefined = newData?.[key] as string | null | undefined;

					if (type === 'date' && oldValue) oldValue = new Date(oldValue as string).toLocaleDateString();
					if (type === 'date' && newValue) newValue = new Date(newValue as string).toLocaleDateString();

					changes.push({
						field: label,
						oldValue,
						newValue,
						type,
					});
				}
			});
		}

		return changes;
	};

	const formatSpouseRelationshipChanges = (
		action: string,
		oldData: SpouseRelationshipData | null,
		newData: SpouseRelationshipData | null
	) => {
		const changes: ChangeDetail[] = [];

		if (action === 'CREATE' && newData) {
			// Add member information first
			const member1Id = newData.familyMember1Id;
			const member2Id = newData.familyMember2Id;
			const unknownText = intl.formatMessage({ id: 'modal.changeLogDetails.values.unknown' });
			const member1Name = member1Id ? relatedMembers[member1Id]?.fullName || `Member #${member1Id}` : unknownText;
			const member2Name = member2Id ? relatedMembers[member2Id]?.fullName || `Member #${member2Id}` : unknownText;
			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.partner1' }),
				oldValue: null,
				newValue: member1Name,
				type: 'text',
			});
			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.partner2' }),
				oldValue: null,
				newValue: member2Name,
				type: 'text',
			});

			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.marriageDate' }),
				oldValue: null,
				newValue: newData.marriageDate ? new Date(newData.marriageDate).toLocaleDateString() : unknownText,
				type: 'date',
			});
		}

		return changes;
	};

	const formatOccupationChanges = (
		action: string,
		oldData: OccupationData | null,
		newData: OccupationData | null
	): ChangeDetail[] => {
		const changes: ChangeDetail[] = [];

		if (action === 'CREATE' && newData) {
			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.jobTitle' }),
				oldValue: null,
				newValue: newData.jobTitle,
				type: 'text',
			});
			if (newData.startDate) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.startDate' }),
					oldValue: null,
					newValue: new Date(newData.startDate).toLocaleDateString(),
					type: 'date',
				});
			}
			if (newData.endDate) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.endDate' }),
					oldValue: null,
					newValue: new Date(newData.endDate).toLocaleDateString(),
					type: 'date',
				});
			}
		} else if (action === 'UPDATE') {
			const fields = [
				{ key: 'jobTitle', label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.jobTitle' }), type: 'text' },
				{
					key: 'startDate',
					label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.startDate' }),
					type: 'date',
				},
				{ key: 'endDate', label: intl.formatMessage({ id: 'modal.changeLogDetails.fields.endDate' }), type: 'date' },
			];

			fields.forEach(({ key, label, type }) => {
				if (oldData?.[key] !== newData?.[key]) {
					let oldValue: string | null | undefined = oldData?.[key] as string | null | undefined;
					let newValue: string | null | undefined = newData?.[key] as string | null | undefined;

					if (type === 'date' && oldValue) oldValue = new Date(oldValue as string).toLocaleDateString();
					if (type === 'date' && newValue) newValue = new Date(newValue as string).toLocaleDateString();

					changes.push({
						field: label,
						oldValue,
						newValue,
						type,
					});
				}
			});
		}

		return changes;
	};

	const formatPassingRecordChanges = (
		action: string,
		oldData: PassingRecordData | null,
		newData: PassingRecordData | null
	) => {
		const changes: ChangeDetail[] = [];

		if (action === 'CREATE' && newData) {
			// Add member information first - use the name stored directly in the change log
			const memberName =
				newData.familyMemberName || intl.formatMessage({ id: 'modal.changeLogDetails.values.unknownMember' });
			changes.push({
				field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.familyMember' }),
				oldValue: null,
				newValue: memberName,
				type: 'text',
			});

			if (newData.dateOfPassing || newData.passingDate) {
				const passingDate = newData.dateOfPassing || newData.passingDate;
				const unknownText = intl.formatMessage({ id: 'modal.changeLogDetails.values.unknown' });
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.dateOfPassing' }),
					oldValue: null,
					newValue: passingDate ? new Date(passingDate).toLocaleDateString() : unknownText,
					type: 'date',
				});
			}

			if (newData.causeOfDeath && Array.isArray(newData.causeOfDeath)) {
				changes.push({
					field: intl.formatMessage({ id: 'modal.changeLogDetails.fields.causeOfDeath' }),
					oldValue: null,
					newValue: Array.isArray(newData.causeOfDeath) ? newData.causeOfDeath.join(', ') : newData.causeOfDeath,
					type: 'text',
				});
			}

			if (newData.burialPlaces && Array.isArray(newData.burialPlaces)) {
				newData.burialPlaces.forEach((place: BurialPlace, index: number) => {
					changes.push({
						field: `${intl.formatMessage({ id: 'modal.changeLogDetails.fields.burialPlace' })} ${index + 1} - ${intl.formatMessage({ id: 'modal.changeLogDetails.fields.location' })}`,
						oldValue: null,
						newValue: place.location,
						type: 'text',
					});
					changes.push({
						field: `${intl.formatMessage({ id: 'modal.changeLogDetails.fields.burialPlace' })} ${index + 1} - ${intl.formatMessage({ id: 'modal.changeLogDetails.fields.startDate' })}`,
						oldValue: null,
						newValue: new Date(place.startDate!).toLocaleDateString(),
						type: 'date',
					});
				});
			}
		}

		return changes;
	};

	const formatGenericChanges = (action: string, oldData: ChangeLogData | null, newData: ChangeLogData | null) => {
		const changes: ChangeDetail[] = [];

		if (action === 'CREATE' && newData) {
			Object.keys(newData).forEach((key) => {
				changes.push({
					field: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
					oldValue: null,
					newValue: String(newData[key] ?? ''),
					type: 'text',
				});
			});
		} else if (action === 'UPDATE') {
			const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

			allKeys.forEach((key) => {
				if (oldData?.[key] !== newData?.[key]) {
					changes.push({
						field: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
						oldValue: String(oldData?.[key] ?? ''),
						newValue: String(newData?.[key] ?? ''),
						type: 'text',
					});
				}
			});
		}

		return changes;
	};

	const getActionColor = (action: string) => {
		switch (action.toLowerCase()) {
			case 'create':
				return 'text-green-600 bg-green-100';
			case 'update':
				return 'text-blue-600 bg-blue-100';
			case 'delete':
				return 'text-red-600 bg-red-100';
			default:
				return 'text-gray-600 bg-gray-100';
		}
	};

	const getEntityIcon = (entityType: string) => {
		switch (entityType) {
			case 'FamilyMember':
				return <User className="w-5 h-5" />;
			case 'Achievement':
				return <Trophy className="w-5 h-5" />;
			case 'Occupation':
				return <Briefcase className="w-5 h-5" />;
			case 'SpouseRelationship':
				return <Heart className="w-5 h-5" />;
			case 'PassingRecord':
				return <Skull className="w-5 h-5" />;
			default:
				return <FileText className="w-5 h-5" />;
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>

			{/* Modal Content */}
			<div
				className="bg-white rounded-[30px] border-[3px] border-black/20 shadow-2xl w-full max-w-[800px] max-h-[90vh] relative z-10 flex flex-col overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="px-8 pt-6 pb-4 shrink-0 border-b border-gray-200">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div className={classNames('p-2 rounded-full', getActionColor(changeLog?.action || ''))}>
								{getEntityIcon(changeLog?.entityType || '')}
							</div>
							<div>
								<h2 className="text-[26px] font-normal text-black">
									<FormattedMessage id="modal.changeLogDetails.title" />
								</h2>
								<p className="text-[16px] font-light text-black/70 mt-1">
									<FormattedMessage
										id="modal.changeLogDetails.subtitle"
										values={{
											entityType: changeLog?.entityType,
											action: changeLog?.action
												? intl.formatMessage({ id: `modal.changeLogDetails.actions.${changeLog.action.toLowerCase()}` })
												: '',
										}}
									/>
								</p>
							</div>
						</div>
						<button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
							<X className="w-6 h-6 text-black" />
						</button>
					</div>
				</div>

				{/* Content - Scrollable */}
				<div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0">
					{/* Basic Information */}
					<div className="grid grid-cols-2 gap-6">
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">
								<FormattedMessage id="modal.changeLogDetails.entityType" />
							</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[20px] px-4 py-2 text-[14px] text-black">
								{changeLog?.entityType}
							</div>
						</div>
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">
								<FormattedMessage id="modal.changeLogDetails.entityId" />
							</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[20px] px-4 py-2 text-[14px] text-black">
								{changeLog?.entityId}
							</div>
						</div>
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">
								<FormattedMessage id="modal.changeLogDetails.action" />
							</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[20px] px-4 py-2">
								<span
									className={`inline-flex px-3 py-1 text-[12px] font-medium rounded-full ${getActionColor(
										changeLog?.action || ''
									)}`}
								>
									{changeLog?.action}
								</span>
							</div>
						</div>
						<div>
							<label className="block text-[16px] font-normal text-black mb-2">
								<FormattedMessage id="modal.changeLogDetails.timestamp" />
							</label>
							<div className="bg-[#f3f2f2] border border-black/50 rounded-[20px] px-4 py-2 flex items-center gap-2">
								<Clock className="w-4 h-4 text-black/50" />
								<p className="text-[14px] text-black">
									{changeLog?.createdAt ? new Date(changeLog.createdAt).toLocaleString() : ''}
								</p>
							</div>
						</div>
					</div>

					{/* Change Details */}
					{(() => {
						const changes = formatChangeDetails(
							changeLog?.entityType || '',
							changeLog?.action || '',
							changeLog?.oldValues || null,
							changeLog?.newValues || null
						);

						if (
							loadingMembers &&
							(changeLog?.entityType === 'Achievement' || changeLog?.entityType === 'SpouseRelationship')
						) {
							return (
								<div className="py-8 relative">
									<LoadingScreen message={intl.formatMessage({ id: 'modal.changeLogDetails.loadingMembers' })} />
								</div>
							);
						}

						if (changes.length === 0) {
							return (
								<div className="text-center py-8">
									<FileText className="w-12 h-12 text-black/30 mx-auto mb-4" />
									<p className="text-[16px] font-normal text-black/70">
										<FormattedMessage id="modal.changeLogDetails.noData" />
									</p>
								</div>
							);
						}

						const getSectionTitleKey = (action: string) => {
							switch (action) {
								case 'CREATE':
									return 'modal.changeLogDetails.sectionTitles.addedInformation';
								case 'UPDATE':
									return 'modal.changeLogDetails.sectionTitles.changesMade';
								case 'DELETE':
									return 'modal.changeLogDetails.sectionTitles.removedInformation';
								default:
									return 'modal.changeLogDetails.sectionTitles.details';
							}
						};

						return (
							<div>
								<label className="block text-[18px] font-normal text-black mb-4">
									<FormattedMessage id={getSectionTitleKey(changeLog?.action || '')} />
								</label>
								<div className="space-y-4">
									{changes.map((change, index) => (
										<div key={index} className="bg-[#f4f4f5] rounded-[20px] p-4 border border-black/20">
											<div className="flex items-center justify-between mb-3">
												<span className="text-[16px] font-medium text-black">{change.field}</span>
												{change.oldValue !== null && change.newValue !== null && (
													<span className="text-[12px] text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
														<FormattedMessage id="modal.changeLogDetails.badges.updated" />
													</span>
												)}
												{change.oldValue === null && change.newValue !== null && (
													<span className="text-[12px] text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
														<FormattedMessage id="modal.changeLogDetails.badges.added" />
													</span>
												)}
												{change.oldValue !== null && change.newValue === null && (
													<span className="text-[12px] text-red-600 bg-red-100 px-3 py-1 rounded-full font-medium">
														<FormattedMessage id="modal.changeLogDetails.badges.removed" />
													</span>
												)}
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
												{change.oldValue !== null && (
													<div className="bg-red-50 border border-red-200 rounded-[15px] p-3">
														<p className="text-[12px] text-red-600 font-medium mb-1">
															<FormattedMessage id="modal.changeLogDetails.comparison.before" />
														</p>
														<p className="text-[14px] text-red-800">
															{change.oldValue || (
																<span className="italic text-gray-500">
																	<FormattedMessage id="modal.changeLogDetails.values.empty" />
																</span>
															)}
														</p>
													</div>
												)}

												{change.newValue !== null && (
													<div className="bg-green-50 border border-green-200 rounded-[15px] p-3">
														<p className="text-[12px] text-green-600 font-medium mb-1">
															<FormattedMessage
																id={
																	change.oldValue !== null
																		? 'modal.changeLogDetails.comparison.after'
																		: 'modal.changeLogDetails.comparison.value'
																}
															/>
														</p>
														<p className="text-[14px] text-green-800">
															{change.newValue || (
																<span className="italic text-gray-500">
																	<FormattedMessage id="modal.changeLogDetails.values.empty" />
																</span>
															)}
														</p>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})()}

					{/* Raw JSON (for debugging - can be removed later) */}
					{(changeLog?.oldValues || changeLog?.newValues) && (
						<details className="mt-6">
							<summary className="text-[14px] font-normal text-black/70 cursor-pointer hover:text-black">
								<FormattedMessage id="modal.changeLogDetails.rawJson.summary" />
							</summary>
							<div className="mt-3 space-y-3">
								{changeLog?.oldValues && (
									<div>
										<label className="text-[12px] font-medium text-black/50 mb-1 block">
											<FormattedMessage id="modal.changeLogDetails.rawJson.previousValues" />
										</label>
										<div className="bg-[#f3f2f2] border border-black/30 rounded-[15px] p-3">
											<pre className="text-[12px] text-black whitespace-pre-wrap font-mono overflow-x-auto">
												{formatJSON(changeLog.oldValues)}
											</pre>
										</div>
									</div>
								)}
								{changeLog?.newValues && (
									<div>
										<label className="text-[12px] font-medium text-black/50 mb-1 block">
											<FormattedMessage id="modal.changeLogDetails.rawJson.newValues" />
										</label>
										<div className="bg-[#f3f2f2] border border-black/30 rounded-[15px] p-3">
											<pre className="text-[12px] text-black whitespace-pre-wrap font-mono overflow-x-auto">
												{formatJSON(changeLog.newValues)}
											</pre>
										</div>
									</div>
								)}
							</div>
						</details>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end px-8 py-6 border-t border-gray-200 shrink-0">
					<button
						onClick={onClose}
						className="w-23.75 h-10 border border-black rounded-[10px] text-black font-normal text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
					>
						<FormattedMessage id="modal.changeLogDetails.close" />
					</button>
				</div>
			</div>
		</div>
	);
}
