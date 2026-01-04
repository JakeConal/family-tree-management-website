'use client';

import classNames from 'classnames';
import dynamic from 'next/dynamic';

import { usePanel } from '@/lib/hooks/usePanel';

// Dynamically import panels to only load them when needed
const CreateFamilyTreePanel = dynamic(() => import('@/components/panels/CreateFamilyTreePanel'));
const MemberPanel = dynamic(() => import('@/components/panels/MemberPanel'));
const AchievementPanel = dynamic(() => import('@/components/panels/AchievementPanel'));
const PassingPanel = dynamic(() => import('@/components/panels/PassingPanel'));
const BirthPanel = dynamic(() => import('@/components/panels/BirthPanel'));
const MarriagePanel = dynamic(() => import('@/components/panels/MarriagePanel'));
const DivorcePanel = dynamic(() => import('@/components/panels/DivorcePanel'));

interface PanelRendererProps {
	className?: string;
	pushMode?: boolean; // If true, uses relative positioning; if false, uses fixed/overlay
}

/**
 * Component that conditionally renders panels based on global state
 * Only renders the active panel to improve performance
 */
export default function PanelRenderer({ className, pushMode = false }: PanelRendererProps) {
	const { activePanel, panelProps, closePanel } = usePanel();

	// Determine if panel should be visible
	const isVisible = activePanel !== null;

	// Base classes for the panel container
	const containerClasses = classNames(
		'transition-all duration-300 ease-in-out border-l border-gray-100 bg-white overflow-hidden shrink-0 h-full',
		{
			// Push mode (for desktop layouts)
			relative: pushMode && isVisible,
			'w-[600px]': pushMode && isVisible,
			'w-0': pushMode && !isVisible,

			// Overlay mode (for mobile or fixed positioning)
			'fixed inset-y-0 right-0 z-50 w-full md:w-[600px]': !pushMode && isVisible,
			'translate-x-full': !pushMode && !isVisible,
			'translate-x-0': !pushMode && isVisible,
		},
		className
	);

	return (
		<aside className={containerClasses}>
			{isVisible && (
				<div className="w-full h-full">
					{activePanel === 'createFamilyTree' && <CreateFamilyTreePanel onClose={closePanel} />}

					{activePanel === 'member' && panelProps.member && (
						<MemberPanel
							mode={panelProps.member.mode}
							memberId={panelProps.member.memberId}
							familyTreeId={panelProps.member.familyTreeId}
							existingMembers={panelProps.member.existingMembers}
							selectedMemberId={panelProps.member.selectedMemberId}
							onClose={closePanel}
						/>
					)}

					{activePanel === 'achievement' && panelProps.achievement && (
						<AchievementPanel
							mode={panelProps.achievement.mode}
							familyTreeId={panelProps.achievement.familyTreeId}
							familyMembers={panelProps.achievement.familyMembers}
							onModeChange={() => {}}
							onClose={closePanel}
							onSuccess={() => {
								closePanel();
							}}
						/>
					)}

					{activePanel === 'passing' && panelProps.passing && (
						<PassingPanel
							mode={panelProps.passing.mode}
							familyTreeId={panelProps.passing.familyTreeId}
							familyMembers={panelProps.passing.familyMembers}
							onModeChange={() => {}}
							onClose={closePanel}
							onSuccess={() => {
								closePanel();
							}}
						/>
					)}

					{activePanel === 'birth' && panelProps.birth && (
						<BirthPanel
							mode={panelProps.birth.mode}
							childMemberId={panelProps.birth.childMemberId}
							familyTreeId={panelProps.birth.familyTreeId}
							familyMembers={panelProps.birth.familyMembers}
							onModeChange={() => {}}
							onClose={closePanel}
							onSuccess={() => {
								closePanel();
							}}
						/>
					)}

					{activePanel === 'marriage' && panelProps.marriage && (
						<MarriagePanel
							mode={panelProps.marriage.mode}
							relationshipId={panelProps.marriage.relationshipId}
							familyTreeId={panelProps.marriage.familyTreeId}
							familyMembers={panelProps.marriage.familyMembers}
							onModeChange={() => {}}
							onClose={closePanel}
							onSuccess={() => {
								closePanel();
							}}
						/>
					)}

					{activePanel === 'divorce' && panelProps.divorce && (
						<DivorcePanel
							mode={panelProps.divorce.mode}
							divorceId={panelProps.divorce.divorceId}
							familyTreeId={panelProps.divorce.familyTreeId}
							familyMembers={panelProps.divorce.familyMembers}
							onModeChange={() => {}}
							onClose={closePanel}
							onSuccess={() => {
								closePanel();
							}}
						/>
					)}
				</div>
			)}
		</aside>
	);
}
