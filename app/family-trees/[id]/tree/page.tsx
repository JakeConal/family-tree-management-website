'use client';

import { FamilyMember as PrismaFamilyMember } from '@prisma/client';
import classNames from 'classnames';
import { ChevronDown, Plus, Minus, Skull } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import relativesTree from 'relatives-tree';
import type { Node, ExtNode } from 'relatives-tree/lib/types';

import FamilyNode from '@/components/FamilyNode';
import LoadingScreen from '@/components/LoadingScreen';
import ChangeLogDetailsModal from '@/components/modals/ChangeLogDetailsModal';
import RecordAchievementModal from '@/components/modals/RecordAchievementModal';
import RecordPassingModal from '@/components/modals/RecordPassingModal';
import AddMemberPanel from '@/components/panels/AddMemberPanel';
import ViewEditMemberPanel from '@/components/ViewEditMemberPanel';
import FamilyMemberService from '@/lib/services/FamilyMemberService';

interface ExtendedFamilyMember extends PrismaFamilyMember {
	parent?: {
		id: number;
		fullName: string;
	} | null;
	children?: {
		id: number;
		fullName: string;
	}[];
	spouse1?: {
		divorceDate: Date | null;
		familyMember2: {
			id: number;
			fullName: string;
		};
	}[];
	spouse2?: {
		divorceDate: Date | null;
		familyMember1: {
			id: number;
			fullName: string;
		};
	}[];
	passingRecords?: {
		id: number;
		dateOfPassing: Date;
	}[];
	achievements?: {
		id: number;
		title: string;
		achieveDate: Date | null;
		achievementType: {
			typeName: string;
		};
	}[];
	occupations?: {
		id: number;
		jobTitle: string;
		startDate: Date | null;
		endDate: Date | null;
	}[];
	birthPlaces?: {
		placeOfOrigin: {
			location: string;
		};
	}[];
}

export default function FamilyTreePage() {
	const params = useParams();
	const familyTreeId = params.id as string;

	const [members, setMembers] = useState<ExtendedFamilyMember[]>([]);
	const [treeNodes, setTreeNodes] = useState<Node[]>([]);
	const [positionedNodes, setPositionedNodes] = useState<ExtNode[]>([]);
	const [rootId, setRootId] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	// Panel and modal states
	const [showAddPanel, setShowAddPanel] = useState(false);
	const [selectedMemberIdForPanel, setSelectedMemberIdForPanel] = useState<number | null>(null);
	const [panelMode, setPanelMode] = useState<'view' | 'edit'>('view');
	const [showAchievementModal, setShowAchievementModal] = useState(false);
	const [showPassingModal, setShowPassingModal] = useState(false);
	const [showChangeLogModal, setShowChangeLogModal] = useState(false);
	const [selectedMemberId, setSelectedMemberId] = useState<string>('');
	const [zoomPercentage, setZoomPercentage] = useState(80);
	const [zoomFunctions, setZoomFunctions] = useState<{
		zoomIn: () => void;
		zoomOut: () => void;
	} | null>(null);
	const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
	const [availableGenerations, setAvailableGenerations] = useState<number[]>([]);
	const transformRef = useRef<ReactZoomPanPinchRef>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [hasInitialized, setHasInitialized] = useState(false);

	const fetchFamilyMembers = useCallback(async () => {
		try {
			const data = await FamilyMemberService.getAll({ familyTreeId });
			setMembers(data);
			transformDataToTreeNodes(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		} finally {
			setLoading(false);
		}
	}, [familyTreeId]);

	useEffect(() => {
		fetchFamilyMembers();
	}, [familyTreeId, fetchFamilyMembers]);

	const transformDataToTreeNodes = (members: ExtendedFamilyMember[]) => {
		try {
			const nodes: Node[] = [];
			const memberMap = new Map<number, ExtendedFamilyMember>();

			// Create member map for easy lookup
			members.forEach((member) => {
				memberMap.set(member.id, member);
			});

			// Create a map of all parent-child relationships
			const parentChildMap = new Map<string, Array<{ id: string; type: 'blood' | 'adopted' }>>();

			// First pass: collect all children from API responses
			members.forEach((member) => {
				if (member.children && member.children.length > 0) {
					const children: Array<{ id: string; type: 'blood' | 'adopted' }> = member.children.map((child) => {
						const childMember = memberMap.get(child.id);
						return {
							id: child.id.toString(),
							type: (childMember?.isAdopted ? 'adopted' : 'blood') as 'blood' | 'adopted',
						};
					});
					parentChildMap.set(member.id.toString(), children);
				}
			});

			// Second pass: ensure spouses also have the children
			members.forEach((member) => {
				const memberId = member.id.toString();
				const memberChildren = parentChildMap.get(memberId) || [];

				// Check spouse1 relationships
				if (member.spouse1) {
					member.spouse1.forEach((spouseRelation) => {
						const spouseId = spouseRelation.familyMember2.id.toString();
						const spouseChildren = parentChildMap.get(spouseId) || [];

						// Merge children between member and spouse
						const allChildren = new Map<string, { id: string; type: 'blood' | 'adopted' }>();

						// Add member's children
						memberChildren.forEach((child) => allChildren.set(child.id, child));
						// Add spouse's children
						spouseChildren.forEach((child) => allChildren.set(child.id, child));

						const mergedChildren = Array.from(allChildren.values());

						// Set merged children for both member and spouse
						parentChildMap.set(memberId, mergedChildren);
						parentChildMap.set(spouseId, mergedChildren);
					});
				}

				// Check spouse2 relationships
				if (member.spouse2) {
					member.spouse2.forEach((spouseRelation) => {
						const spouseId = spouseRelation.familyMember1.id.toString();
						const spouseChildren = parentChildMap.get(spouseId) || [];

						// Merge children between member and spouse
						const allChildren = new Map<string, { id: string; type: 'blood' | 'adopted' }>();

						// Add member's children
						memberChildren.forEach((child) => allChildren.set(child.id, child));
						// Add spouse's children
						spouseChildren.forEach((child) => allChildren.set(child.id, child));

						const mergedChildren = Array.from(allChildren.values());

						// Set merged children for both member and spouse
						parentChildMap.set(memberId, mergedChildren);
						parentChildMap.set(spouseId, mergedChildren);
					});
				}
			});

			members.forEach((member) => {
				// Map gender to relatives-tree format
				let gender: 'male' | 'female' = 'male'; // default
				if (member.gender === 'FEMALE') {
					gender = 'female';
				} else if (member.gender === 'MALE') {
					gender = 'male';
				}

				// Add parents
				const parents = member.parentId
					? [
							{
								id: member.parentId.toString(),
								type: member.isAdopted ? 'adopted' : 'blood',
							},
						]
					: [];

				// Get children from the parent-child map
				const children = parentChildMap.get(member.id.toString()) || [];

				// Add spouses
				const spouses: { id: string; type: 'married' | 'divorced' }[] = [];
				if (member.spouse1) {
					member.spouse1.forEach((spouse) => {
						spouses.push({
							id: spouse.familyMember2.id.toString(),
							type: spouse.divorceDate ? 'divorced' : 'married',
						});
					});
				}
				if (member.spouse2) {
					member.spouse2.forEach((spouse) => {
						spouses.push({
							id: spouse.familyMember1.id.toString(),
							type: spouse.divorceDate ? 'divorced' : 'married',
						});
					});
				}

				const node = {
					id: member.id.toString(),
					gender,
					spouses,
					siblings: [],
					parents,
					children,
				};

				nodes.push(node as Node);
			});

			setTreeNodes(nodes);

			// Find root (member with no parents)
			const rootMember = members.find((member) => !member.parentId);
			if (rootMember) {
				setRootId(rootMember.id.toString());
			} else if (members.length > 0) {
				// Fallback to first member
				setRootId(members[0].id.toString());
			}

			// Calculate available generations
			const generationSet = new Set<number>();
			members.forEach((member) => {
				if (member.generation) {
					generationSet.add(parseInt(member.generation.toString()));
				}
			});
			const generations = Array.from(generationSet).sort((a, b) => a - b);
			setAvailableGenerations(generations);

			// Calculate positioned nodes
			const positionedNodes = relativesTree(nodes, {
				rootId: rootMember?.id.toString() || members[0]?.id.toString() || '',
			});
			// Deduplicate nodes by ID to avoid React key warnings
			const uniqueNodes = Array.from(new Map(positionedNodes.nodes.map((node) => [node.id, node])).values());
			// Update treeNodes with positioned nodes
			setTreeNodes([...uniqueNodes]);
			setPositionedNodes([...uniqueNodes]);
		} catch (err) {
			console.error('Error processing family tree data:', err);
			setError('Failed to process family tree data');
			setLoading(false);
		}
	};

	const getMemberById = (id: string): ExtendedFamilyMember | undefined => {
		return members.find((member) => member.id.toString() === id);
	};

	const getFilteredPositionedNodes = () => {
		if (selectedGeneration === 'all') {
			return positionedNodes;
		}
		const selectedGen = parseInt(selectedGeneration);
		return positionedNodes.filter((node) => {
			const member = getMemberById(node.id);
			return member && member.generation && parseInt(member.generation.toString()) === selectedGen;
		});
	};

	// Calculate bounding box of all nodes for centering
	const treeBounds = useMemo(() => {
		if (positionedNodes.length === 0) return null;

		const NODE_WIDTH = 160;
		const NODE_HEIGHT = 256;

		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		positionedNodes.forEach((node) => {
			const left = node.left * 120 - 80;
			const top = node.top * 180 - 128;
			const right = left + NODE_WIDTH;
			const bottom = top + NODE_HEIGHT;

			minX = Math.min(minX, left);
			maxX = Math.max(maxX, right);
			minY = Math.min(minY, top);
			maxY = Math.max(maxY, bottom);
		});

		const width = maxX - minX;
		const height = maxY - minY;
		const centerX = minX + width / 2;
		const centerY = minY + height / 2;

		return { minX, maxX, minY, maxY, width, height, centerX, centerY };
	}, [positionedNodes]);

	// Center the tree after it's loaded
	useEffect(() => {
		if (!hasInitialized && treeBounds && containerRef.current && transformRef.current) {
			const containerWidth = containerRef.current.clientWidth;
			const containerHeight = containerRef.current.clientHeight;
			const scale = 0.8; // initial scale

			// Calculate the position to center the tree
			const initialX = containerWidth / 2 - treeBounds.centerX * scale;
			const initialY = containerHeight / 2 - treeBounds.centerY * scale;

			// Use setTimeout to ensure the transform is applied after render
			setTimeout(() => {
				transformRef.current?.setTransform(initialX, initialY, scale);
				setHasInitialized(true);
			}, 100);
		}
	}, [treeBounds, hasInitialized]);

	if (loading) {
		return <LoadingScreen message="Loading family tree..." />;
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-red-500 text-lg">Error: {error}</div>
			</div>
		);
	}

	if (!rootId || treeNodes.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-lg">No family members found</div>
			</div>
		);
	}

	return (
		<div className="flex h-full overflow-hidden bg-white">
			<div className="flex-1 flex flex-col overflow-y-auto p-4">
				<div className="w-full">
					{/* Top Control Bar */}
					<div className="mb-3 flex items-center justify-between bg-white rounded-[20px] px-4 py-3 shadow-sm border border-gray-100">
						{/* Left Side */}
						<div className="flex items-center gap-4">
							<div className="relative">
								<select
									value={selectedGeneration}
									onChange={(e) => setSelectedGeneration(e.target.value)}
									className="appearance-none bg-white border border-gray-200 rounded-full px-6 py-2 pr-10 text-sm font-inter font-medium text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
								>
									<option value="all">All Generation</option>
									{availableGenerations.map((gen) => (
										<option key={gen} value={gen.toString()}>
											Generation {gen}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
							</div>
							<button
								onClick={() => setShowAddPanel(true)}
								className="bg-white hover:bg-gray-50 border border-gray-200 text-black rounded-full px-6 py-2 text-sm font-inter font-medium flex items-center gap-2 transition-all shadow-sm"
							>
								<Plus className="w-4 h-4" />
								Add Member
							</button>
						</div>

						{/* Right Side - Zoom Controls */}
						<div className="flex items-center bg-white rounded-full border border-gray-200 px-2 py-1 shadow-sm">
							<button
								onClick={() => zoomFunctions?.zoomOut()}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors"
								title="Zoom Out"
							>
								<Minus className="w-4 h-4 text-black" />
							</button>
							<span className="px-4 text-sm font-inter font-bold text-black min-w-[4rem] text-center border-x border-gray-100">
								{zoomPercentage}%
							</span>
							<button
								onClick={() => zoomFunctions?.zoomIn()}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors"
								title="Zoom In"
							>
								<Plus className="w-4 h-4 text-black" />
							</button>
						</div>
					</div>

					{/* Tree Container */}
					<div
						ref={containerRef}
						className="bg-[#f4f4f5] rounded-[20px] p-4 relative overflow-hidden shadow-inner"
						style={{ height: '73vh', minHeight: '400px' }}
					>
						<TransformWrapper
							ref={transformRef}
							initialScale={0.8}
							minScale={0.1}
							maxScale={3}
							centerOnInit={false}
							wheel={{ step: 0.1 }}
							pinch={{ step: 0.1 }}
							doubleClick={{ mode: 'zoomIn' }}
							panning={{ velocityDisabled: false, disabled: false }}
							limitToBounds={false}
							onInit={(ref) => {
								setZoomFunctions({
									zoomIn: () => ref.zoomIn(),
									zoomOut: () => ref.zoomOut(),
								});
							}}
							onTransformed={(ref, state) => {
								setZoomPercentage(Math.round(state.scale * 100));
							}}
						>
							{() => (
								<TransformComponent
									wrapperStyle={{
										width: '100%',
										height: '100%',
										overflow: 'visible',
										position: 'relative',
									}}
									contentStyle={{
										width: 'auto',
										height: 'auto',
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
									}}
								>
									<div className="relative w-auto h-auto">
										{/* Manual node rendering */}
										<div className="relative">
											{getFilteredPositionedNodes().map((node) => {
												const member = getMemberById(node.id);
												if (!member) return null;

												return (
													<FamilyNode
														key={node.id}
														node={node as ExtNode}
														member={member}
														style={{
															position: 'absolute',
															width: 160,
															height: 256,
															left: node.left * 120 - 80,
															top: node.top * 180 - 128,
														}}
														onClick={() => {
															setSelectedMemberIdForPanel(member.id);
															setPanelMode('view');
														}}
													/>
												);
											})}
										</div>
										<svg
											className="absolute top-0 left-0 w-full h-full pointer-events-none"
											style={{
												zIndex: -1,
												minWidth: '10000px',
												minHeight: '10000px',
												overflow: 'visible',
											}}
										>
											{/* Spouse connections */}
											{(() => {
												const renderedPairs = new Set<string>();
												const filteredNodes = getFilteredPositionedNodes();
												return filteredNodes.map((node) => {
													const member = getMemberById(node.id);
													if (!member) return null;

													const spouseRelations = [
														...(member.spouse1 || []).map((spouse) => ({
															spouseId: spouse.familyMember2.id.toString(),
															relation: spouse,
														})),
														...(member.spouse2 || []).map((spouse) => ({
															spouseId: spouse.familyMember1.id.toString(),
															relation: spouse,
														})),
													];

													return spouseRelations.map(({ spouseId, relation }) => {
														const pairKey = [node.id, spouseId].sort().join('-');

														if (renderedPairs.has(pairKey)) return null;
														renderedPairs.add(pairKey);

														const spouseNode = positionedNodes.find((n) => n.id === spouseId);
														if (!spouseNode) return null;

														// Calculate midpoint between spouses
														const nodeX = node.left * 120;
														const nodeY = node.top * 180;
														const spouseX = spouseNode.left * 120;
														const spouseY = spouseNode.top * 180;

														const midX = (nodeX + spouseX) / 2;
														const midY = (nodeY + spouseY) / 2;

														// Check if this is a divorced relationship
														const isDivorced = relation.divorceDate !== null;
														const strokeDasharray = isDivorced ? '4,4' : undefined;

														return (
															<g key={`spouse-${pairKey}`}>
																{/* Spouse connection line */}
																<line
																	x1={nodeX}
																	y1={nodeY}
																	x2={spouseX}
																	y2={spouseY}
																	stroke="gray"
																	strokeWidth="2"
																	strokeDasharray={strokeDasharray}
																/>
																{/* Add child circle - only for current spouses */}
																{!isDivorced && (
																	<>
																		<circle
																			cx={midX}
																			cy={midY}
																			r="15"
																			fill="white"
																			stroke="gray"
																			strokeWidth="2"
																			className="cursor-pointer hover:fill-yellow-200"
																			onClick={() => {
																				setSelectedMemberId(`${node.id},${spouseId}`);
																				setShowAddPanel(true);
																			}}
																		/>
																		{/* Add icon */}
																		<text
																			x={midX}
																			y={midY + 5}
																			textAnchor="middle"
																			fontSize="20"
																			fill="black"
																			className="cursor-pointer pointer-events-none"
																			style={{ userSelect: 'none' }}
																		>
																			+
																		</text>
																	</>
																)}
															</g>
														);
													});
												});
											})()}

											{/* Parent-child connections */}
											{(() => {
												const renderedConnections = new Set<string>();
												const parentGroups = new Map<string, string[]>();
												const filteredNodes = getFilteredPositionedNodes();
												const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

												// Group children by their actual parent (from database)
												members.forEach((m) => {
													if (m.parentId) {
														const parentId = m.parentId.toString();
														if (!parentGroups.has(parentId)) parentGroups.set(parentId, []);
														parentGroups.get(parentId)!.push(m.id.toString());
													}
												});

												return Array.from(parentGroups.entries()).map(([parentId, childIds]) => {
													// Only show connections if parent is in filtered nodes
													if (!filteredNodeIds.has(parentId)) return null;

													const parentNode = filteredNodes.find((n) => n.id === parentId);
													const childNodes = childIds
														.map((id) => filteredNodes.find((n) => n.id === id))
														.filter(Boolean) as ExtNode[];

													if (!parentNode || childNodes.length === 0) return null;

													// Check if this connection has already been rendered
													const connectionKey = [parentId, ...childIds.sort()].join('-');
													if (renderedConnections.has(connectionKey)) return null;
													renderedConnections.add(connectionKey);

													const parentX = parentNode.left * 120;
													const parentY = parentNode.top * 180 + 128;
													const childY = childNodes[0].top * 180 - 128;
													const childXs = childNodes.map((n) => n.left * 120).sort((a, b) => a - b);
													const minX = childXs[0];
													const maxX = childXs[childXs.length - 1];
													const midY = (parentY + childY) / 2;

													return (
														<g key={parentId}>
															{/* White background paths to cover old connections */}
															<path
																d={`M ${parentX} ${parentY} Q ${parentX} ${(parentY + midY) / 2} ${parentX} ${midY} Q ${
																	(parentX + minX) / 2
																} ${midY} ${minX} ${midY} L ${maxX} ${midY}`}
																stroke="white"
																strokeWidth="20"
																fill="none"
															/>
															{childNodes.map((childNode) => {
																const childX = childNode.left * 120;
																return (
																	<path
																		key={`bg-${childNode.id}`}
																		d={`M ${childX} ${midY} Q ${childX} ${(midY + childY) / 2} ${childX} ${childY}`}
																		stroke="white"
																		strokeWidth="20"
																		fill="none"
																	/>
																);
															})}
															{/* Black foreground paths */}
															<path
																d={`M ${parentX} ${parentY} Q ${parentX} ${(parentY + midY) / 2} ${parentX} ${midY} Q ${
																	(parentX + minX) / 2
																} ${midY} ${minX} ${midY} L ${maxX} ${midY}`}
																stroke="gray"
																strokeWidth="2"
																fill="none"
															/>
															{childNodes.map((childNode) => {
																const childX = childNode.left * 120;
																return (
																	<path
																		key={childNode.id}
																		d={`M ${childX} ${midY} Q ${childX} ${(midY + childY) / 2} ${childX} ${childY}`}
																		stroke="gray"
																		strokeWidth="2"
																		fill="none"
																	/>
																);
															})}
														</g>
													);
												});
											})()}
										</svg>
									</div>
								</TransformComponent>
							)}
						</TransformWrapper>
					</div>

					{/* Bottom Legend */}
					<div className="mt-3 flex flex-wrap items-center justify-center gap-4 bg-white rounded-[20px] py-2 px-4 shadow-sm border border-gray-100 text-xs">
						<div className="flex items-center gap-2">
							<div className="w-6 h-0.5 bg-gray-600 rounded-full"></div>
							<span className="text-xs font-inter font-medium text-black">Child - Parent</span>
						</div>
						<div className="flex items-center gap-2">
							<svg className="w-6 h-0.5" viewBox="0 0 32 2" fill="none">
								<line x1="0" y1="1" x2="32" y2="1" stroke="gray" strokeWidth="2" strokeDasharray="4,4" />
							</svg>
							<span className="text-xs font-inter font-medium text-black">Former Spouse</span>
						</div>
						<div className="flex items-center gap-2">
							<Plus className="w-3 h-3 text-black" />
							<span className="text-xs font-inter font-medium text-black">Current Spouse</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="bg-white p-1 rounded-full shadow-sm border border-gray-200">
								<Skull className="w-3 h-3 text-black" />
							</div>
							<span className="text-xs font-inter font-medium text-black">Passed away</span>
						</div>
					</div>
				</div>
			</div>

			{/* Member Panel Sidebar - Push Style */}
			<aside
				className={classNames(
					'transition-all duration-300 ease-in-out border-l border-gray-100 bg-white overflow-hidden shrink-0 h-full',
					{
						'w-[600px]': selectedMemberIdForPanel !== null || showAddPanel,
						'w-0': selectedMemberIdForPanel === null && !showAddPanel,
					}
				)}
			>
				{selectedMemberIdForPanel !== null && (
					<ViewEditMemberPanel
						memberId={selectedMemberIdForPanel}
						familyTreeId={familyTreeId}
						existingMembers={members}
						mode={panelMode}
						onModeChange={setPanelMode}
						onClose={() => setSelectedMemberIdForPanel(null)}
						onSuccess={fetchFamilyMembers}
					/>
				)}
				{showAddPanel && (
					<AddMemberPanel
						familyTreeId={familyTreeId}
						existingMembers={members}
						selectedMemberId={selectedMemberId}
						onClose={() => {
							setShowAddPanel(false);
							setSelectedMemberId('');
						}}
						onSuccess={() => {
							fetchFamilyMembers();
							setShowAddPanel(false);
							setSelectedMemberId('');
						}}
					/>
				)}
			</aside>

			{/* Modals */}

			<RecordAchievementModal
				isOpen={showAchievementModal}
				onClose={() => setShowAchievementModal(false)}
				familyTreeId={familyTreeId}
				existingMembers={members}
				onAchievementRecorded={fetchFamilyMembers}
			/>

			<RecordPassingModal
				isOpen={showPassingModal}
				onClose={() => setShowPassingModal(false)}
				familyTreeId={familyTreeId}
				existingMembers={members}
				onPassingRecorded={fetchFamilyMembers}
			/>

			<ChangeLogDetailsModal
				isOpen={showChangeLogModal}
				onClose={() => setShowChangeLogModal(false)}
				changeLog={null}
			/>
		</div>
	);
}
