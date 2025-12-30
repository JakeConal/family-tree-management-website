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
import {
  ChevronDown,
  Plus,
  Minus,
  Skull,
  Calendar,
  Users,
  Crown,
} from "lucide-react";
import FamilyNode from "@/components/FamilyNode";
import AddMemberModal from "@/components/modals/AddMemberModal";
import ViewEditMemberModal from "@/components/modals/ViewEditMemberModal";
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
  const [showViewEditMemberModal, setShowViewEditMemberModal] = useState(false);
  const [viewEditMemberMode, setViewEditMemberMode] = useState<"view" | "edit">(
    "view"
  );
  const [selectedMemberForViewEdit, setSelectedMemberForViewEdit] =
    useState<ExtendedFamilyMember | null>(null);
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
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-full mx-auto">
        {/* Top Control Bar */}
        <div className="mb-6 flex items-center justify-between bg-[#f4f4f5] rounded-[20px] px-6 py-4 shadow-sm">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-200 rounded-full px-6 py-2 pr-10 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer">
                <option>All Generation</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-2 text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
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
            <span className="px-4 text-sm font-bold text-black min-w-[4rem] text-center border-x border-gray-100">
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
          className="bg-[#f4f4f5] rounded-[30px] p-8 relative overflow-hidden shadow-inner"
          style={{ height: "75vh", minHeight: "600px" }}
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
                              width: 150,
                              height: 200,
                              left: node.left * 120 - 75,
                              top: node.top * 150 - 100,
                            }}
                            onClick={() => {
                              setSelectedMemberForViewEdit(member);
                              setViewEditMemberMode("view");
                              setShowViewEditMemberModal(true);
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
                        overflow: "visible",
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
                                  stroke="gray"
                                  strokeWidth="2"
                                  className="cursor-pointer hover:fill-yellow-200"
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
                                  stroke="gray"
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
                                      stroke="gray"
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 bg-[#f4f4f5] rounded-[20px] py-4 px-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium text-black">Child - Parent</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-0.5 border-t-2 border-dotted border-gray-400"></div>
            <span className="text-sm font-medium text-black">Former Spouse</span>
          </div>
          <div className="flex items-center gap-3">
            <Plus className="w-4 h-4 text-black" />
            <span className="text-sm font-medium text-black">Current Spouse</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-full shadow-sm">
              <Skull className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-medium text-black">Passed away</span>
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

      <ViewEditMemberModal
        isOpen={showViewEditMemberModal}
        onClose={() => setShowViewEditMemberModal(false)}
        familyTreeId={familyTreeId}
        existingMembers={members as any}
        member={
          selectedMemberForViewEdit
            ? {
                ...selectedMemberForViewEdit,
                birthday: selectedMemberForViewEdit.birthday
                  ? typeof selectedMemberForViewEdit.birthday === "string"
                    ? selectedMemberForViewEdit.birthday
                    : selectedMemberForViewEdit.birthday.toISOString()
                  : null,
                hasProfilePicture:
                  (selectedMemberForViewEdit as any).hasProfilePicture || false,
                birthPlaces:
                  (selectedMemberForViewEdit as any).birthPlaces || [],
                occupations:
                  selectedMemberForViewEdit.occupations?.map((occ) => ({
                    ...occ,
                    startDate: occ.startDate
                      ? typeof occ.startDate === "string"
                        ? occ.startDate
                        : occ.startDate.toISOString()
                      : null,
                    endDate: occ.endDate
                      ? typeof occ.endDate === "string"
                        ? occ.endDate
                        : occ.endDate.toISOString()
                      : null,
                  })) || [],
              }
            : null
        }
        onMemberUpdated={fetchFamilyMembers}
        mode={viewEditMemberMode}
        onModeChange={setViewEditMemberMode}
      />
    </div>
  );
}
