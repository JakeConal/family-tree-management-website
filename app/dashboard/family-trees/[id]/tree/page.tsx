"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import relativesTree from "relatives-tree";
import type { Node, ExtNode } from "relatives-tree/lib/types";
import { FamilyMember } from "@prisma/client";
import FamilyNode from "@/components/FamilyNode";
import AddMemberModal from "@/components/modals/AddMemberModal";
import RecordAchievementModal from "@/components/modals/RecordAchievementModal";
import RecordPassingModal from "@/components/modals/RecordPassingModal";
import ChangeLogDetailsModal from "@/components/modals/ChangeLogDetailsModal";

interface ExtendedFamilyMember extends FamilyMember {
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
  const [rootId, setRootId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showPassingModal, setShowPassingModal] = useState(false);
  const [showChangeLogModal, setShowChangeLogModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [zoomPercentage, setZoomPercentage] = useState(80);
  const [zoomFunctions, setZoomFunctions] = useState<{
    zoomIn: () => void;
    zoomOut: () => void;
  } | null>(null);

  useEffect(() => {
    fetchFamilyMembers();
  }, [familyTreeId]);

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch(
        `/api/family-members?familyTreeId=${familyTreeId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch family members");
      }
      const data = await response.json();
      setMembers(data);
      transformDataToTreeNodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const transformDataToTreeNodes = (members: ExtendedFamilyMember[]) => {
    try {
      const nodes: Node[] = [];
      const memberMap = new Map<number, ExtendedFamilyMember>();

      // Create member map for easy lookup
      members.forEach((member) => {
        memberMap.set(member.id, member);
      });

      // Create a map of all parent-child relationships
      const parentChildMap = new Map<
        string,
        Array<{ id: string; type: "blood" | "adopted" }>
      >();

      // First pass: collect all children from API responses
      members.forEach((member) => {
        if (member.children && member.children.length > 0) {
          const children: Array<{ id: string; type: "blood" | "adopted" }> =
            member.children.map((child) => {
              const childMember = memberMap.get(child.id);
              return {
                id: child.id.toString(),
                type: (childMember?.isAdopted ? "adopted" : "blood") as
                  | "blood"
                  | "adopted",
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
            const allChildren = new Map<
              string,
              { id: string; type: "blood" | "adopted" }
            >();

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
            const allChildren = new Map<
              string,
              { id: string; type: "blood" | "adopted" }
            >();

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
        let gender: "male" | "female" = "male"; // default
        if (member.gender === "FEMALE") {
          gender = "female";
        } else if (member.gender === "MALE") {
          gender = "male";
        }

        // Add parents
        const parents = member.parentId
          ? [
              {
                id: member.parentId.toString(),
                type: member.isAdopted ? "adopted" : "blood",
              },
            ]
          : [];

        // Get children from the parent-child map
        const children = parentChildMap.get(member.id.toString()) || [];

        // Add spouses
        const spouses: { id: string; type: "married" | "divorced" }[] = [];
        if (member.spouse1) {
          member.spouse1.forEach((spouse) => {
            spouses.push({
              id: spouse.familyMember2.id.toString(),
              type: spouse.divorceDate ? "divorced" : "married",
            });
          });
        }
        if (member.spouse2) {
          member.spouse2.forEach((spouse) => {
            spouses.push({
              id: spouse.familyMember1.id.toString(),
              type: spouse.divorceDate ? "divorced" : "married",
            });
          });
        }

        const node: any = {
          id: member.id.toString(),
          gender: gender as any, // cast since Gender enum has same string values
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

      // Calculate positioned nodes
      const positionedNodes = relativesTree(nodes, {
        rootId: rootMember?.id.toString() || members[0]?.id.toString() || "",
      });
      // Update treeNodes with positioned nodes
      setTreeNodes([...positionedNodes.nodes]);
      setPositionedNodes([...positionedNodes.nodes]);
    } catch (err) {
      setError("Failed to process family tree data");
      setLoading(false);
    }
  };

  const getMemberById = (id: string): ExtendedFamilyMember | undefined => {
    return members.find((member) => member.id.toString() === id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading family tree...</div>
      </div>
    );
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Top Control Bar */}
        <div className="mb-4 flex items-center justify-between bg-white rounded-full border border-gray-200 shadow-sm px-6 py-3">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <select className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Generation</option>
            </select>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Add Member
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>

          {/* Right Side - Zoom Controls */}
          <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-3 py-1">
            <button
              onClick={() => zoomFunctions?.zoomOut()}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Zoom Out"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <span className="px-3 text-sm font-medium text-gray-700 min-w-[3rem] text-center">
              {zoomPercentage}%
            </span>
            <button
              onClick={() => zoomFunctions?.zoomIn()}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Zoom In"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tree Container */}
        <div
          className="bg-white rounded-lg shadow-sm p-4 relative overflow-hidden"
          style={{ height: "80vh", minHeight: "600px" }}
        >
          <TransformWrapper
            initialScale={0.8}
            minScale={0.1}
            maxScale={3}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
            pinch={{ step: 0.1 }}
            doubleClick={{ mode: "zoomIn" }}
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
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    position: "relative",
                  }}
                  contentStyle={{
                    width: "auto",
                    height: "auto",
                    minWidth: "100%",
                    minHeight: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <div className="relative w-auto h-auto">
                    {/* Manual node rendering */}
                    <div className="relative">
                      {positionedNodes.map((node) => {
                        const member = getMemberById(node.id);
                        if (!member) return null;

                        return (
                          <FamilyNode
                            key={node.id}
                            node={node as ExtNode}
                            member={member}
                            style={{
                              position: "absolute",
                              width: 180,
                              height: 200,
                              left: node.left * 120 - 90,
                              top: node.top * 150 - 100,
                            }}
                          />
                        );
                      })}
                    </div>
                    <svg
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                      style={{
                        zIndex: -1,
                        minWidth: "10000px",
                        minHeight: "10000px",
                      }}
                    >
                      {/* Spouse connections */}
                      {(() => {
                        const renderedPairs = new Set<string>();
                        return positionedNodes.map((node) => {
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

                          return spouseRelations.map(({ spouseId }) => {
                            const pairKey = [node.id, spouseId]
                              .sort()
                              .join("-");

                            if (renderedPairs.has(pairKey)) return null;
                            renderedPairs.add(pairKey);

                            const spouseNode = positionedNodes.find(
                              (n) => n.id === spouseId
                            );
                            if (!spouseNode) return null;

                            // Calculate midpoint between spouses
                            const nodeX = node.left * 120;
                            const nodeY = node.top * 150;
                            const spouseX = spouseNode.left * 120;
                            const spouseY = spouseNode.top * 150;

                            const midX = (nodeX + spouseX) / 2;
                            const midY = (nodeY + spouseY) / 2;

                            return (
                              <g key={`spouse-${pairKey}`}>
                                {/* Spouse connection line */}
                                <line
                                  x1={nodeX}
                                  y1={nodeY}
                                  x2={spouseX}
                                  y2={spouseY}
                                  stroke="black"
                                  strokeWidth="2"
                                />
                                {/* Add child circle */}
                                <circle
                                  cx={midX}
                                  cy={midY}
                                  r="15"
                                  fill="white"
                                  stroke="black"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:fill-blue-100"
                                  onClick={() => {
                                    setSelectedMemberId(
                                      `${node.id},${spouseId}`
                                    );
                                    setShowAddMemberModal(true);
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
                                  style={{ userSelect: "none" }}
                                >
                                  +
                                </text>
                              </g>
                            );
                          });
                        });
                      })()}

                      {/* Parent-child connections */}
                      {(() => {
                        const renderedConnections = new Set<string>();
                        const parentGroups = new Map<string, string[]>();

                        // Group children by their actual parent (from database)
                        members.forEach((m) => {
                          if (m.parentId) {
                            const parentId = m.parentId.toString();
                            if (!parentGroups.has(parentId))
                              parentGroups.set(parentId, []);
                            parentGroups.get(parentId)!.push(m.id.toString());
                          }
                        });

                        return Array.from(parentGroups.entries()).map(
                          ([parentId, childIds]) => {
                            const parentNode = positionedNodes.find(
                              (n) => n.id === parentId
                            );
                            const childNodes = childIds
                              .map((id) =>
                                positionedNodes.find((n) => n.id === id)
                              )
                              .filter(Boolean) as ExtNode[];

                            if (!parentNode || childNodes.length === 0)
                              return null;

                            // Check if this connection has already been rendered
                            const connectionKey = [
                              parentId,
                              ...childIds.sort(),
                            ].join("-");
                            if (renderedConnections.has(connectionKey))
                              return null;
                            renderedConnections.add(connectionKey);

                            const parentX = parentNode.left * 120;
                            const parentY = parentNode.top * 150 + 100;
                            const childY = childNodes[0].top * 150 - 100;
                            const childXs = childNodes
                              .map((n) => n.left * 120)
                              .sort((a, b) => a - b);
                            const minX = childXs[0];
                            const maxX = childXs[childXs.length - 1];
                            const midY = (parentY + childY) / 2;

                            return (
                              <g key={parentId}>
                                {/* White background paths to cover old connections */}
                                <path
                                  d={`M ${parentX} ${parentY} Q ${parentX} ${
                                    (parentY + midY) / 2
                                  } ${parentX} ${midY} Q ${
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
                                      d={`M ${childX} ${midY} Q ${childX} ${
                                        (midY + childY) / 2
                                      } ${childX} ${childY}`}
                                      stroke="white"
                                      strokeWidth="20"
                                      fill="none"
                                    />
                                  );
                                })}
                                {/* Black foreground paths */}
                                <path
                                  d={`M ${parentX} ${parentY} Q ${parentX} ${
                                    (parentY + midY) / 2
                                  } ${parentX} ${midY} Q ${
                                    (parentX + minX) / 2
                                  } ${midY} ${minX} ${midY} L ${maxX} ${midY}`}
                                  stroke="black"
                                  strokeWidth="2"
                                  fill="none"
                                />
                                {childNodes.map((childNode) => {
                                  const childX = childNode.left * 120;
                                  return (
                                    <path
                                      key={childNode.id}
                                      d={`M ${childX} ${midY} Q ${childX} ${
                                        (midY + childY) / 2
                                      } ${childX} ${childY}`}
                                      stroke="black"
                                      strokeWidth="2"
                                      fill="none"
                                    />
                                  );
                                })}
                              </g>
                            );
                          }
                        );
                      })()}
                    </svg>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>

        {/* Bottom Legend */}
        <div className="mt-4 flex items-center justify-center gap-8 bg-white rounded-lg border border-gray-200 shadow-sm py-3 px-6">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-4 h-0.5 bg-gray-400"></div>
            <span className="text-sm">Child - Parent</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-4 h-0.5 border-t-2 border-dotted border-gray-400"></div>
            <span className="text-sm">Former Spouse</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-sm">Current Spouse</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-sm">Passed away</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        familyTreeId={familyTreeId}
        existingMembers={members as any}
        onMemberAdded={fetchFamilyMembers}
        selectedMemberId={selectedMemberId}
      />

      <RecordAchievementModal
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        familyTreeId={familyTreeId}
        existingMembers={members as any}
        onAchievementRecorded={fetchFamilyMembers}
      />

      <RecordPassingModal
        isOpen={showPassingModal}
        onClose={() => setShowPassingModal(false)}
        familyTreeId={familyTreeId}
        existingMembers={members as any}
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
