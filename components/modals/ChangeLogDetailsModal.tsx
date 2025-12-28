"use client";

import { useState, useEffect } from "react";
import {
  X,
  Clock,
  User,
  FileText,
  Trophy,
  Briefcase,
  Heart,
  Skull,
} from "lucide-react";

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

interface ChangeLogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeLog: ChangeLog | null;
}

export default function ChangeLogDetailsModal({
  isOpen,
  onClose,
  changeLog,
}: ChangeLogDetailsModalProps) {
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
      if (log.entityType === "SpouseRelationship") {
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
      console.error("Error fetching related members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const formatJSON = (jsonString: string | null) => {
    if (!jsonString) return "No data";
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
  ) => {
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
      case "FamilyMember":
        return formatFamilyMemberChanges(action, oldData, newData);
      case "Achievement":
        return formatAchievementChanges(action, oldData, newData);
      case "SpouseRelationship":
        return formatSpouseRelationshipChanges(action, oldData, newData);
      case "Occupation":
        return formatOccupationChanges(action, oldData, newData);
      case "PassingRecord":
        return formatPassingRecordChanges(action, oldData, newData);
      default:
        return formatGenericChanges(action, oldData, newData);
    }
  };

  const formatFamilyMemberChanges = (
    action: string,
    oldData: any,
    newData: any
  ) => {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: string;
    }> = [];

    if (action === "CREATE" && newData) {
      changes.push({
        field: "Name",
        oldValue: null,
        newValue: newData.fullName,
        type: "text",
      });
      if (newData.birthday) {
        changes.push({
          field: "Birthday",
          oldValue: null,
          newValue: new Date(newData.birthday).toLocaleDateString(),
          type: "date",
        });
      }
      if (newData.gender) {
        changes.push({
          field: "Gender",
          oldValue: null,
          newValue: newData.gender,
          type: "text",
        });
      }
      if (newData.address) {
        changes.push({
          field: "Address",
          oldValue: null,
          newValue: newData.address,
          type: "text",
        });
      }
      if (newData.generation) {
        changes.push({
          field: "Generation",
          oldValue: null,
          newValue: newData.generation,
          type: "text",
        });
      }
      if (newData.isAdopted !== undefined) {
        changes.push({
          field: "Adopted",
          oldValue: null,
          newValue: newData.isAdopted ? "Yes" : "No",
          type: "boolean",
        });
      }
    } else if (action === "UPDATE") {
      const fields = [
        { key: "fullName", label: "Name", type: "text" },
        { key: "birthday", label: "Birthday", type: "date" },
        { key: "gender", label: "Gender", type: "text" },
        { key: "address", label: "Address", type: "text" },
        { key: "generation", label: "Generation", type: "text" },
        { key: "isAdopted", label: "Adopted", type: "boolean" },
        { key: "profilePicture", label: "Profile Picture", type: "text" },
      ];

      fields.forEach(({ key, label, type }) => {
        if (oldData?.[key] !== newData?.[key]) {
          let oldValue = oldData?.[key];
          let newValue = newData?.[key];

          if (type === "date" && oldValue)
            oldValue = new Date(oldValue).toLocaleDateString();
          if (type === "date" && newValue)
            newValue = new Date(newValue).toLocaleDateString();
          if (type === "boolean" && oldValue !== undefined)
            oldValue = oldValue ? "Yes" : "No";
          if (type === "boolean" && newValue !== undefined)
            newValue = newValue ? "Yes" : "No";

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
    oldData: any,
    newData: any
  ) => {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: string;
    }> = [];

    if (action === "CREATE" && newData) {
      // Add member information first - use the name stored directly in the change log
      const memberName = newData.familyMemberName || "Unknown Member";
      changes.push({
        field: "Family Member",
        oldValue: null,
        newValue: memberName,
        type: "text",
      });

      changes.push({
        field: "Title",
        oldValue: null,
        newValue: newData.title,
        type: "text",
      });
      if (newData.achieveDate) {
        changes.push({
          field: "Achievement Date",
          oldValue: null,
          newValue: new Date(newData.achieveDate).toLocaleDateString(),
          type: "date",
        });
      }
      if (newData.description) {
        changes.push({
          field: "Description",
          oldValue: null,
          newValue: newData.description,
          type: "text",
        });
      }
    } else if (action === "UPDATE") {
      const fields = [
        { key: "title", label: "Title", type: "text" },
        { key: "achieveDate", label: "Achievement Date", type: "date" },
        { key: "description", label: "Description", type: "text" },
      ];

      fields.forEach(({ key, label, type }) => {
        if (oldData?.[key] !== newData?.[key]) {
          let oldValue = oldData?.[key];
          let newValue = newData?.[key];

          if (type === "date" && oldValue)
            oldValue = new Date(oldValue).toLocaleDateString();
          if (type === "date" && newValue)
            newValue = new Date(newValue).toLocaleDateString();

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
    oldData: any,
    newData: any
  ) => {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: string;
    }> = [];

    if (action === "CREATE" && newData) {
      // Add member information first
      const member1Id = newData.familyMember1Id;
      const member2Id = newData.familyMember2Id;
      const member1Name =
        relatedMembers[member1Id]?.fullName || `Member #${member1Id}`;
      const member2Name =
        relatedMembers[member2Id]?.fullName || `Member #${member2Id}`;

      changes.push({
        field: "Partner 1",
        oldValue: null,
        newValue: member1Name,
        type: "text",
      });
      changes.push({
        field: "Partner 2",
        oldValue: null,
        newValue: member2Name,
        type: "text",
      });

      changes.push({
        field: "Marriage Date",
        oldValue: null,
        newValue: new Date(newData.marriageDate).toLocaleDateString(),
        type: "date",
      });
    }

    return changes;
  };

  const formatOccupationChanges = (
    action: string,
    oldData: any,
    newData: any
  ) => {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: string;
    }> = [];

    if (action === "CREATE" && newData) {
      changes.push({
        field: "Job Title",
        oldValue: null,
        newValue: newData.jobTitle,
        type: "text",
      });
      if (newData.startDate) {
        changes.push({
          field: "Start Date",
          oldValue: null,
          newValue: new Date(newData.startDate).toLocaleDateString(),
          type: "date",
        });
      }
      if (newData.endDate) {
        changes.push({
          field: "End Date",
          oldValue: null,
          newValue: new Date(newData.endDate).toLocaleDateString(),
          type: "date",
        });
      }
    } else if (action === "UPDATE") {
      const fields = [
        { key: "jobTitle", label: "Job Title", type: "text" },
        { key: "startDate", label: "Start Date", type: "date" },
        { key: "endDate", label: "End Date", type: "date" },
      ];

      fields.forEach(({ key, label, type }) => {
        if (oldData?.[key] !== newData?.[key]) {
          let oldValue = oldData?.[key];
          let newValue = newData?.[key];

          if (type === "date" && oldValue)
            oldValue = new Date(oldValue).toLocaleDateString();
          if (type === "date" && newValue)
            newValue = new Date(newValue).toLocaleDateString();

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
    oldData: any,
    newData: any
  ) => {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: string;
    }> = [];

    if (action === "CREATE" && newData) {
      // Add member information first - use the name stored directly in the change log
      const memberName = newData.familyMemberName || "Unknown Member";
      changes.push({
        field: "Family Member",
        oldValue: null,
        newValue: memberName,
        type: "text",
      });

      changes.push({
        field: "Date of Passing",
        oldValue: null,
        newValue: new Date(newData.dateOfPassing).toLocaleDateString(),
        type: "date",
      });

      if (newData.causesOfDeath && Array.isArray(newData.causesOfDeath)) {
        changes.push({
          field: "Causes of Death",
          oldValue: null,
          newValue: newData.causesOfDeath.join(", "),
          type: "text",
        });
      }

      if (newData.burialPlaces && Array.isArray(newData.burialPlaces)) {
        newData.burialPlaces.forEach((place: any, index: number) => {
          changes.push({
            field: `Burial Place ${index + 1} - Location`,
            oldValue: null,
            newValue: place.location,
            type: "text",
          });
          changes.push({
            field: `Burial Place ${index + 1} - Start Date`,
            oldValue: null,
            newValue: new Date(place.startDate).toLocaleDateString(),
            type: "date",
          });
        });
      }
    }

    return changes;
  };

  const formatGenericChanges = (action: string, oldData: any, newData: any) => {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      type: string;
    }> = [];

    if (action === "CREATE" && newData) {
      Object.keys(newData).forEach((key) => {
        changes.push({
          field:
            key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, " $1"),
          oldValue: null,
          newValue: newData[key],
          type: "text",
        });
      });
    } else if (action === "UPDATE") {
      const allKeys = new Set([
        ...Object.keys(oldData || {}),
        ...Object.keys(newData || {}),
      ]);

      allKeys.forEach((key) => {
        if (oldData?.[key] !== newData?.[key]) {
          changes.push({
            field:
              key.charAt(0).toUpperCase() +
              key.slice(1).replace(/([A-Z])/g, " $1"),
            oldValue: oldData?.[key],
            newValue: newData?.[key],
            type: "text",
          });
        }
      });
    }

    return changes;
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "text-green-600 bg-green-100";
      case "update":
        return "text-blue-600 bg-blue-100";
      case "delete":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "FamilyMember":
        return <User className="w-5 h-5" />;
      case "Achievement":
        return <Trophy className="w-5 h-5" />;
      case "Occupation":
        return <Briefcase className="w-5 h-5" />;
      case "SpouseRelationship":
        return <Heart className="w-5 h-5" />;
      case "PassingRecord":
        return <Skull className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-full ${getActionColor(
                changeLog?.action || ""
              )}`}
            >
              {getEntityIcon(changeLog?.entityType || "")}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Change Log Details
              </h2>
              <p className="text-sm text-gray-600">
                {changeLog?.entityType} {changeLog?.action.toLowerCase()}d
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Entity Type
              </label>
              <p className="text-sm font-medium text-gray-900">
                {changeLog?.entityType}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Entity ID
              </label>
              <p className="text-sm font-medium text-gray-900">
                {changeLog?.entityId}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Action
              </label>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(
                  changeLog?.action || ""
                )}`}
              >
                {changeLog?.action}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Timestamp
              </label>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-900">
                  {changeLog?.createdAt
                    ? new Date(changeLog.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Change Details */}
          {(() => {
            const changes = formatChangeDetails(
              changeLog?.entityType || "",
              changeLog?.action || "",
              changeLog?.oldValues || null,
              changeLog?.newValues || null
            );

            if (
              loadingMembers &&
              (changeLog?.entityType === "Achievement" ||
                changeLog?.entityType === "SpouseRelationship")
            ) {
              return (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading member information...</p>
                </div>
              );
            }

            if (changes.length === 0) {
              return (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No detailed change data available
                  </p>
                </div>
              );
            }

            return (
              <div>
                <label className="text-sm font-medium text-gray-500 mb-4 block">
                  {changeLog?.action === "CREATE"
                    ? "Added Information"
                    : changeLog?.action === "UPDATE"
                    ? "Changes Made"
                    : changeLog?.action === "DELETE"
                    ? "Removed Information"
                    : "Details"}
                </label>
                <div className="space-y-3">
                  {changes.map((change, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {change.field}
                        </span>
                        {change.oldValue !== null &&
                          change.newValue !== null && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              Updated
                            </span>
                          )}
                        {change.oldValue === null &&
                          change.newValue !== null && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Added
                            </span>
                          )}
                        {change.oldValue !== null &&
                          change.newValue === null && (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                              Removed
                            </span>
                          )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {change.oldValue !== null && (
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-xs text-red-600 font-medium mb-1">
                              Before
                            </p>
                            <p className="text-sm text-red-800">
                              {change.oldValue || (
                                <span className="italic text-gray-500">
                                  Empty
                                </span>
                              )}
                            </p>
                          </div>
                        )}

                        {change.newValue !== null && (
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-xs text-green-600 font-medium mb-1">
                              {change.oldValue !== null ? "After" : "Value"}
                            </p>
                            <p className="text-sm text-green-800">
                              {change.newValue || (
                                <span className="italic text-gray-500">
                                  Empty
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
              <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                Raw JSON Data (Technical Details)
              </summary>
              <div className="mt-3 space-y-3">
                {changeLog?.oldValues && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Previous Values (JSON)
                    </label>
                    <div className="bg-gray-100 border border-gray-300 rounded p-3">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                        {formatJSON(changeLog.oldValues)}
                      </pre>
                    </div>
                  </div>
                )}
                {changeLog?.newValues && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      New Values (JSON)
                    </label>
                    <div className="bg-gray-100 border border-gray-300 rounded p-3">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
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
        <div className="flex justify-end p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
