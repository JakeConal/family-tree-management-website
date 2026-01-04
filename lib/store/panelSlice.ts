import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { FamilyMember } from '@/types';

// Define all possible panel types
export type PanelType =
	| 'createFamilyTree'
	| 'member'
	| 'achievement'
	| 'passing'
	| 'birth'
	| 'marriage'
	| 'divorce'
	| null;

// Define props for each panel type
export interface PanelProps {
	createFamilyTree?: Record<string, never>;
	member?: {
		mode: 'add' | 'view' | 'edit';
		memberId?: number;
		familyTreeId: string;
		existingMembers: FamilyMember[];
		selectedMemberId?: string;
	};
	achievement?: {
		mode: 'add' | 'view';
		familyTreeId: string;
		familyMembers: FamilyMember[];
		onSuccess?: () => void | Promise<void>;
	};
	passing?: {
		mode: 'add' | 'view';
		familyTreeId: string;
		familyMembers: FamilyMember[];
		onSuccess?: () => void | Promise<void>;
	};
	birth?: {
		mode: 'view' | 'edit';
		childMemberId?: number;
		familyTreeId: string;
		familyMembers: FamilyMember[];
	};
	marriage?: {
		mode: 'view' | 'edit';
		relationshipId?: number;
		familyTreeId: string;
		familyMembers: FamilyMember[];
	};
	divorce?: {
		mode: 'add' | 'view' | 'edit';
		divorceId?: number;
		familyTreeId: string;
		familyMembers: FamilyMember[];
	};
}

interface PanelState {
	activePanel: PanelType;
	panelProps: PanelProps;
}

const initialState: PanelState = {
	activePanel: null,
	panelProps: {},
};

const panelSlice = createSlice({
	name: 'panel',
	initialState,
	reducers: {
		openPanel: <T extends PanelType>(
			state: PanelState,
			action: PayloadAction<{ type: T; props: T extends keyof PanelProps ? PanelProps[T] : never }>
		) => {
			if (state.activePanel) {
				state.activePanel = null;
				state.panelProps = {};
			}

			state.activePanel = action.payload.type;
			// Type-safe assignment of props
			if (action.payload.type) {
				state.panelProps[action.payload.type] = action.payload.props;
			}
		},
		closePanel: (state) => {
			state.activePanel = null;
			state.panelProps = {};
		},
		updatePanelProps: <T extends PanelType>(
			state: PanelState,
			action: PayloadAction<{ type: T; props: Partial<T extends keyof PanelProps ? PanelProps[T] : never> }>
		) => {
			if (action.payload.type && state.activePanel === action.payload.type) {
				state.panelProps[action.payload.type] = {
					...state.panelProps[action.payload.type],
					...action.payload.props,
				};
			}
		},
	},
});

export const { openPanel, closePanel, updatePanelProps } = panelSlice.actions;
export default panelSlice.reducer;
