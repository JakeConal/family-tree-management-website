'use client';

import { FamilyMember as PrismaFamilyMember } from '@prisma/client';
import classNames from 'classnames';
import { ChevronDown, Plus, Minus, Skull } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import relativesTree from 'relatives-tree';
import type { Node, ExtNode } from 'relatives-tree/lib/types';

import FamilyNode from '@/components/FamilyNode';
import LoadingScreen from '@/components/LoadingScreen';
import ChangeLogDetailsModal from '@/components/modals/ChangeLogDetailsModal';
import DivorcedSpousesModal from '@/components/modals/DivorcedSpousesModal';
import RecordAchievementModal from '@/components/modals/RecordAchievementModal';
import RecordPassingModal from '@/components/modals/RecordPassingModal';
import AddMemberPanel from '@/components/panels/AddMemberPanel';
import ViewEditMemberPanel from '@/components/panels/ViewEditMemberPanel';
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
	divorceDate?: Date | null;
	hasProfilePicture?: boolean;
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
	const [showDivorcedSpousesModal, setShowDivorcedSpousesModal] = useState(false);
	const [selectedDivorcedSpouses, setSelectedDivorcedSpouses] = useState<ExtendedFamilyMember[]>([]);
	const [selectedDivorcedMemberName, setSelectedDivorcedMemberName] = useState<string>('');
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

	// Helper function to check if a member is a "spouse-type" node (should be shown as divorced spouse)
	const isSpouseTypeNode = (member: ExtendedFamilyMember): boolean => {
		return member.parentId === null && !member.isRootPerson;
	};

	// Helper function to check if a member has divorced spouses that will be displayed
	const hasDivorcedSpousesToDisplay = (memberId: string, memberMap: Map<number, ExtendedFamilyMember>): boolean => {
		const member = memberMap.get(parseInt(memberId));
		if (!member) return false;

		// Only parent-child nodes should display divorced spouses
		if (isSpouseTypeNode(member)) return false;

		// Check spouse1 relationships
		if (member.spouse1) {
			for (const spouseRelation of member.spouse1) {
				if (spouseRelation.divorceDate) {
					const spouse = memberMap.get(spouseRelation.familyMember2.id);
					if (spouse && isSpouseTypeNode(spouse)) {
						return true;
					}
				}
			}
		}

		// Check spouse2 relationships
		if (member.spouse2) {
			for (const spouseRelation of member.spouse2) {
				if (spouseRelation.divorceDate) {
					const spouse = memberMap.get(spouseRelation.familyMember1.id);
					if (spouse && isSpouseTypeNode(spouse)) {
						return true;
					}
				}
			}
		}

		return false;
	};

	// Ensure current spouses are always positioned to the right of parent-child nodes
	const ensureSpousesOnRight = (nodes: ExtNode[], memberMap: Map<number, ExtendedFamilyMember>): ExtNode[] => {
		const adjustedNodes = nodes.map((node) => ({ ...node }));
		const nodeMap = new Map(adjustedNodes.map((node) => [node.id, node]));

		// Process each node to check if it has a current (non-divorced) spouse
		adjustedNodes.forEach((node) => {
			const member = memberMap.get(parseInt(node.id));
			if (!member) return;

			// Only adjust parent-child nodes (not spouse-type nodes)
			if (isSpouseTypeNode(member)) return;

			// Find current spouse (not divorced)
			const spouseRelations = [
				...(member.spouse1 || []).map((s) => ({
					spouseId: s.familyMember2.id.toString(),
					divorceDate: s.divorceDate,
				})),
				...(member.spouse2 || []).map((s) => ({
					spouseId: s.familyMember1.id.toString(),
					divorceDate: s.divorceDate,
				})),
			];

			for (const relation of spouseRelations) {
				if (!relation.divorceDate) {
					// This is a current spouse
					const spouseNode = nodeMap.get(relation.spouseId);
					if (!spouseNode) continue;

					// Check if they are on the same row (they should be)
					if (Math.abs(node.top - spouseNode.top) < 0.1) {
						// Ensure spouse is on the right
						if (spouseNode.left < node.left) {
							// Spouse is on the left - swap positions
							const tempLeft = node.left;
							Object.assign(node, { left: spouseNode.left });
							Object.assign(spouseNode, { left: tempLeft });
						}
					}
				}
			}
		});

		return adjustedNodes;
	};

	// Adjust node positions to make room for divorced spouse nodes on the left
	const adjustNodesForDivorcedSpouses = (
		nodes: ExtNode[],
		treeNodes: Node[],
		memberMap: Map<number, ExtendedFamilyMember>
	): ExtNode[] => {
		// Create a map of node positions by row (top value)
		const rowMap = new Map<number, ExtNode[]>();
		nodes.forEach((node) => {
			const row = node.top;
			if (!rowMap.has(row)) rowMap.set(row, []);
			rowMap.get(row)!.push(node);
		});

		// For each row, check if any node has divorced spouses and adjust positions
		const adjustedNodes = nodes.map((node) => ({ ...node }));

		// Find nodes that have divorced spouses to display
		const nodesWithDivorcedSpouses = new Set<string>();
		adjustedNodes.forEach((node) => {
			if (hasDivorcedSpousesToDisplay(node.id, memberMap)) {
				nodesWithDivorcedSpouses.add(node.id);
			}
		});

		if (nodesWithDivorcedSpouses.size === 0) return adjustedNodes;

		// For each row, sort by left position and add offset where needed
		rowMap.forEach((rowNodes, row) => {
			// Sort nodes in this row by left position
			const sortedRowNodes = rowNodes.sort((a, b) => a.left - b.left);

			// Check each node - if a node has divorced spouses, ensure space to its left
			for (let i = 0; i < sortedRowNodes.length; i++) {
				const currentNode = sortedRowNodes[i];
				if (!nodesWithDivorcedSpouses.has(currentNode.id)) continue;

				// This node has divorced spouses - check if there's a node to its left that's too close
				// Divorced spouse is positioned 2 units to the left
				const divorcedSpouseLeft = currentNode.left - 2;

				// Find if any node would overlap with the divorced spouse position
				for (let j = 0; j < i; j++) {
					const leftNode = sortedRowNodes[j];
					// If the left node is at or past the divorced spouse position, we need to shift
					if (leftNode.left >= divorcedSpouseLeft - 0.5) {
						// Need to shift the current node (and nodes to its right) to the right
						const shiftAmount = 2; // Shift by 2 units to make room

						// Find the adjusted node and all nodes to its right in this row
						for (let k = i; k < sortedRowNodes.length; k++) {
							const nodeToShift = adjustedNodes.find((n) => n.id === sortedRowNodes[k].id);
							if (nodeToShift) {
								nodeToShift.left += shiftAmount;
							}
						}
						break;
					}
				}

				// Also check if there's no space on the left edge (node is too close to left boundary)
				if (divorcedSpouseLeft < 0) {
					// Shift all nodes right to make room at the left edge
					const shiftAmount = Math.abs(divorcedSpouseLeft) + 0.5;
					adjustedNodes.forEach((n) => {
						if (n.top === row || n.top > row) {
							// Shift this row and below (to maintain parent-child alignment)
							// Actually, just shift all nodes to be safe
						}
					});
				}
			}
		});

		// Second pass: ensure divorced spouse positions don't overlap with any other nodes
		// by adding a global offset if needed
		let globalLeftOffset = 0;
		adjustedNodes.forEach((node) => {
			if (nodesWithDivorcedSpouses.has(node.id)) {
				const divorcedSpouseLeft = node.left - 2;
				// Check if any node is at this position
				const overlappingNode = adjustedNodes.find(
					(n) => n.id !== node.id && Math.abs(n.left - divorcedSpouseLeft) < 1 && n.top === node.top
				);
				if (overlappingNode) {
					// Need more offset
					globalLeftOffset = Math.max(globalLeftOffset, 2);
				}
				// Also check if divorced spouse would be at negative position
				if (divorcedSpouseLeft < 0) {
					globalLeftOffset = Math.max(globalLeftOffset, Math.abs(divorcedSpouseLeft) + 0.5);
				}
			}
		});

		// Apply global offset if needed
		if (globalLeftOffset > 0) {
			adjustedNodes.forEach((node) => {
				node.left += globalLeftOffset;
			});
		}

		return adjustedNodes;
	};

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

			// Ensure current spouses are always on the right of parent-child nodes
			const nodesWithSpousesAdjusted = ensureSpousesOnRight(uniqueNodes, memberMap);

			// Adjust node positions to account for divorced spouse nodes
			// Divorced spouses are positioned 2 units (200px) to the left of their ex-partner
			// We need to ensure no other nodes occupy that space
			const adjustedNodes = adjustNodesForDivorcedSpouses(nodesWithSpousesAdjusted, nodes, memberMap);

			// Update treeNodes with positioned nodes
			setTreeNodes([...adjustedNodes]);
			setPositionedNodes([...adjustedNodes]);
		} catch (err) {
			console.error('Error processing family tree data:', err);
			setError('Failed to process family tree data');
			setLoading(false);
		}
	};

	const getMemberById = (id: string): ExtendedFamilyMember | undefined => {
		return members.find((member) => member.id.toString() === id);
	};

	// Get divorced spouses for a member
	// A divorced spouse is one that:
	// 1. Has a divorce record with the current member
	// 2. Is a "spouse" type node (parentId is null) and is not the root person
	// The parent-child node remains in place, only the spouse moves to the left
	const getDivorcedSpouses = (memberId: string): ExtendedFamilyMember[] => {
		const member = getMemberById(memberId);
		if (!member) return [];

		// Only parent-child nodes (those with a parentId OR root person) should have divorced spouses displayed
		// If the current member is a pure spouse (parentId is null and not root), they shouldn't show divorced spouses
		// as they will be shown as the divorced spouse of their partner
		if (member.parentId === null && !member.isRootPerson) {
			return [];
		}

		const divorcedSpouses: ExtendedFamilyMember[] = [];

		// Check spouse1 relationships
		if (member.spouse1) {
			member.spouse1.forEach((spouseRelation) => {
				if (spouseRelation.divorceDate) {
					const spouse = getMemberById(spouseRelation.familyMember2.id.toString());
					// Only add as divorced spouse if they are a "spouse" type node (parentId is null and not root)
					if (spouse && spouse.parentId === null && !spouse.isRootPerson) {
						divorcedSpouses.push({
							...spouse,
							divorceDate: spouseRelation.divorceDate,
						});
					}
				}
			});
		}

		// Check spouse2 relationships
		if (member.spouse2) {
			member.spouse2.forEach((spouseRelation) => {
				if (spouseRelation.divorceDate) {
					const spouse = getMemberById(spouseRelation.familyMember1.id.toString());
					// Only add as divorced spouse if they are a "spouse" type node (parentId is null and not root)
					if (spouse && spouse.parentId === null && !spouse.isRootPerson) {
						divorcedSpouses.push({
							...spouse,
							divorceDate: spouseRelation.divorceDate,
						});
					}
				}
			});
		}

		return divorcedSpouses;
	};

	// Get all divorced spouse IDs that should be hidden from main tree
	const getAllDivorcedSpouseIds = (): Set<string> => {
		const divorcedSpouseIds = new Set<string>();

		members.forEach((member) => {
			const divorcedSpouses = getDivorcedSpouses(member.id.toString());
			divorcedSpouses.forEach((spouse) => {
				divorcedSpouseIds.add(spouse.id.toString());
			});
		});

		return divorcedSpouseIds;
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
			const left = node.left * 100 - 80;
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
			<div className="flex-1 flex flex-col overflow-y-auto p-3 sm:p-4">
				<div className="w-full">
					{/* Top Control Bar */}
					<div className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 bg-white rounded-[20px] px-3 sm:px-4 py-3 shadow-sm border border-gray-100">
						{/* Left Side */}
						<div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-none">
							<div className="relative flex-1 sm:flex-none">
								<select
									value={selectedGeneration}
									onChange={(e) => setSelectedGeneration(e.target.value)}
									className="appearance-none bg-white border border-gray-200 rounded-full px-4 sm:px-6 py-2 pr-8 sm:pr-10 text-xs sm:text-sm font-inter font-medium text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer w-full sm:w-auto"
								>
									<option value="all">All Generation</option>
									{availableGenerations.map((gen) => (
										<option key={gen} value={gen.toString()}>
											Generation {gen}
										</option>
									))}
								</select>
								<ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-500 pointer-events-none" />
							</div>
							<button
								onClick={() => setShowAddPanel(true)}
								className="bg-white hover:bg-gray-50 border border-gray-200 text-black rounded-full px-4 sm:px-6 py-2 text-xs sm:text-sm font-inter font-medium flex items-center gap-2 transition-all shadow-sm whitespace-nowrap"
							>
								<Plus className="w-3 h-3 sm:w-4 sm:h-4" />
								<span className="hidden sm:inline">Add Member</span>
								<span className="sm:hidden">Add</span>
							</button>
						</div>

						{/* Right Side - Zoom Controls */}
						<div className="flex items-center bg-white rounded-full border border-gray-200 px-2 py-1 shadow-sm self-center sm:self-auto">
							<button
								onClick={() => zoomFunctions?.zoomOut()}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors"
								title="Zoom Out"
							>
								<Minus className="w-4 h-4 text-black" />
							</button>
							<span className="px-3 sm:px-4 text-xs sm:text-sm font-inter font-bold text-black min-w-[3.5rem] sm:min-w-[4rem] text-center border-x border-gray-100">
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
						className="bg-[#f4f4f5] rounded-[20px] p-2 sm:p-4 relative overflow-hidden shadow-inner"
						style={{ height: 'calc(100vh - 280px)', minHeight: '300px' }}
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
											{(() => {
												const divorcedSpouseIds = getAllDivorcedSpouseIds();
												return getFilteredPositionedNodes().map((node) => {
													const member = getMemberById(node.id);
													if (!member) return null;

													// Hide nodes that are divorced spouses (shown separately)
													if (divorcedSpouseIds.has(node.id)) return null;

													return (
														<FamilyNode
															key={node.id}
															node={node as ExtNode}
															member={member}
															style={{
																position: 'absolute',
																width: 160,
																height: 256,
																left: node.left * 100 - 80,
																top: node.top * 180 - 128,
															}}
															onClick={() => {
																setSelectedMemberIdForPanel(member.id);
																setPanelMode('view');
															}}
														/>
													);
												});
											})()}

											{/* Divorced spouse nodes - positioned to the left */}
											{getFilteredPositionedNodes().map((node) => {
												const member = getMemberById(node.id);
												if (!member) return null;

												const divorcedSpouses = getDivorcedSpouses(node.id);
												if (divorcedSpouses.length === 0) return null;

												// Position divorced spouses to the left of the member
												const baseX = node.left * 100 - 80 - 200; // 200px to the left
												const baseY = node.top * 180 - 128;

												if (divorcedSpouses.length === 1) {
													// Single divorced spouse - render as regular node with orange background
													const spouse = divorcedSpouses[0];
													return (
														<div
															key={`ex-spouse-${node.id}-${spouse.id}`}
															className="absolute flex flex-col items-center justify-start gap-3 rounded-[32px] border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
															style={{
																position: 'absolute',
																width: '160px',
																height: '240px',
																left: baseX,
																top: baseY,
																backgroundColor: '#fbcbb0', // Orange color for divorced spouses
																borderColor: 'rgba(0,0,0,0.04)',
															}}
															onClick={() => {
																setSelectedMemberIdForPanel(spouse.id);
																setPanelMode('view');
															}}
														>
															{/* Profile Image Container */}
															<div className="relative">
																<div className="w-24 h-24 rounded-[20px] bg-white shadow-md overflow-hidden flex items-center justify-center border-2 border-gray-100">
																	{spouse.hasProfilePicture ? (
																		<Image
																			src={`/api/family-members/${spouse.id}/profile-picture`}
																			alt={spouse.fullName}
																			width={96}
																			height={96}
																			className="w-full h-full object-cover"
																			unoptimized
																		/>
																	) : (
																		<span className="text-gray-600 text-2xl font-bold">
																			{spouse.fullName.split(' ').pop()?.charAt(0).toUpperCase()}
																		</span>
																	)}
																</div>
															</div>

															{/* First Name */}
															<div className="text-center w-full px-1">
																<h3 className="font-nunito font-black text-2xl text-gray-900 leading-tight truncate">
																	{spouse.fullName.split(' ').pop()}
																</h3>
															</div>

															{/* Ex-Spouse Badge */}
															<div className="bg-gray-900 text-white px-2 py-1 rounded-full text-center">
																<span className="font-nunito font-semibold text-xs">
																	{spouse.gender === 'MALE' ? 'Ex-Husband' : 'Ex-Wife'}
																</span>
															</div>
														</div>
													);
												} else {
													// Multiple divorced spouses - render as stacked cards
													return (
														<div
															key={`ex-spouse-stack-${node.id}`}
															className="absolute cursor-pointer"
															style={{
																position: 'absolute',
																left: baseX,
																top: baseY,
															}}
															onClick={() => {
																setSelectedDivorcedSpouses(divorcedSpouses);
																setSelectedDivorcedMemberName(member.fullName);
																setShowDivorcedSpousesModal(true);
															}}
														>
															{/* Stack effect - background cards */}
															<div
																className="absolute rounded-[32px] border-2"
																style={{
																	width: '160px',
																	height: '240px',
																	backgroundColor: '#fbcbb0',
																	borderColor: 'rgba(0,0,0,0.04)',
																	left: '8px',
																	top: '8px',
																	opacity: 0.6,
																}}
															/>
															<div
																className="absolute rounded-[32px] border-2"
																style={{
																	width: '160px',
																	height: '240px',
																	backgroundColor: '#fbcbb0',
																	borderColor: 'rgba(0,0,0,0.04)',
																	left: '4px',
																	top: '4px',
																	opacity: 0.8,
																}}
															/>

															{/* Top card with count */}
															<div
																className="relative flex flex-col items-center justify-center gap-3 rounded-[32px] border-2 p-4 transition-all duration-200 hover:shadow-lg hover:scale-105"
																style={{
																	width: '160px',
																	height: '240px',
																	backgroundColor: '#fbcbb0',
																	borderColor: 'rgba(0,0,0,0.04)',
																}}
															>
																{/* Multiple profile pictures stacked or count indicator */}
																<div className="relative w-24 h-24">
																	{divorcedSpouses.slice(0, 3).map((spouse, index) => (
																		<div
																			key={spouse.id}
																			className="absolute w-16 h-16 rounded-[16px] bg-white shadow-md overflow-hidden flex items-center justify-center border-2 border-gray-100"
																			style={{
																				left: `${index * 12}px`,
																				top: `${index * 12}px`,
																				zIndex: 3 - index,
																			}}
																		>
																			{spouse.profilePicture ? (
																				<Image
																					src={`/api/family-members/${spouse.id}/profile-picture`}
																					alt={spouse.fullName}
																					width={64}
																					height={64}
																					className="w-full h-full object-cover"
																					unoptimized
																				/>
																			) : (
																				<span className="text-gray-600 text-lg font-bold">
																					{spouse.fullName.split(' ').pop()?.charAt(0).toUpperCase()}
																				</span>
																			)}
																		</div>
																	))}
																</div>

																{/* Count badge */}
																<div className="text-center">
																	<div className="bg-gray-900 text-white px-3 py-2 rounded-full">
																		<span className="font-nunito font-bold text-lg">
																			{divorcedSpouses.length} Ex-Spouses
																		</span>
																	</div>
																</div>

																{/* Click to view text */}
																<div className="text-center text-xs text-gray-700">
																	<span className="font-nunito font-semibold">Click to view</span>
																</div>
															</div>
														</div>
													);
												}
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
														const nodeX = node.left * 100;
														const nodeY = node.top * 180;
														const spouseX = spouseNode.left * 100;
														const spouseY = spouseNode.top * 180;

														const midX = (nodeX + spouseX) / 2;
														const midY = (nodeY + spouseY) / 2;

														// Check if this is a divorced relationship
														const isDivorced = relation.divorceDate !== null;

														return (
															<g key={`spouse-${pairKey}`}>
																{/* Add child circle - only for current spouses */}
																{!isDivorced && (
																	<>
																		<circle
																			cx={midX}
																			cy={midY}
																			r="20"
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

													const parentX = parentNode.left * 100;
													const parentY = parentNode.top * 180 + 115;
													const childY = childNodes[0].top * 180 - 128;
													const childXs = childNodes.map((n) => n.left * 100).sort((a, b) => a - b);
													const minX = childXs[0];
													const maxX = childXs[childXs.length - 1];
													const midY = (parentY + childY) / 2;

													return (
														<g key={parentId}>
															{/* Connection from parent middle-bottom to horizontal line */}
															<path
																d={`M ${parentX} ${parentY} Q ${parentX} ${(parentY + midY) / 2} ${parentX} ${midY} Q ${
																	(parentX + minX) / 2
																} ${midY} ${minX} ${midY} L ${maxX} ${midY}`}
																stroke="gray"
																strokeWidth="2"
																fill="none"
															/>
															{childNodes.map((childNode) => {
																const childX = childNode.left * 100;
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

											{/* Divorced spouse connections - dashed lines */}
											{(() => {
												const filteredNodes = getFilteredPositionedNodes();
												return filteredNodes.map((node) => {
													const member = getMemberById(node.id);
													if (!member) return null;

													const divorcedSpouses = getDivorcedSpouses(node.id);
													if (divorcedSpouses.length === 0) return null;

													// Calculate positions
													const memberX = node.left * 100; // Center of member node
													const memberY = node.top * 180; // Center of member node
													const exSpouseX = memberX - 200 + 80; // Center of divorced spouse node (200px left + 80px offset)
													const exSpouseY = memberY; // Same Y position

													return (
														<g key={`divorced-line-${node.id}`}>
															{/* Dashed line from divorced spouse to member */}
															<path
																d={`M ${exSpouseX} ${exSpouseY} L ${memberX - 80} ${memberY}`}
																stroke="#fb923c"
																strokeWidth="2"
																strokeDasharray="8,4"
																fill="none"
															/>
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
					<div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 bg-white rounded-[20px] py-2 px-3 sm:px-4 shadow-sm border border-gray-100 text-xs">
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

			{/* Backdrop for mobile */}
			{(selectedMemberIdForPanel !== null || showAddPanel) && (
				<div
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
					onClick={() => {
						setSelectedMemberIdForPanel(null);
						setShowAddPanel(false);
					}}
				/>
			)}

			{/* Member Panel Sidebar - Push Style */}
			<aside
				className={classNames(
					'transition-all duration-300 ease-in-out border-l border-gray-100 bg-white overflow-hidden shrink-0 h-full',
					{
						'fixed md:relative inset-y-0 right-0 md:right-auto z-50 w-full md:w-[600px]':
							selectedMemberIdForPanel !== null || showAddPanel,
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

			<DivorcedSpousesModal
				isOpen={showDivorcedSpousesModal}
				onClose={() => {
					setShowDivorcedSpousesModal(false);
					setSelectedDivorcedSpouses([]);
					setSelectedDivorcedMemberName('');
				}}
				spouses={selectedDivorcedSpouses}
				memberName={selectedDivorcedMemberName}
				onSpouseClick={(spouseId) => {
					setSelectedMemberIdForPanel(spouseId);
					setPanelMode('view');
				}}
			/>
		</div>
	);
}
