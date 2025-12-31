import { createSlice } from '@reduxjs/toolkit';

interface CreatePanelState {
	isOpen: boolean;
}

const initialState: CreatePanelState = {
	isOpen: false,
};

const createPanelSlice = createSlice({
	name: 'createPanel',
	initialState,
	reducers: {
		openCreatePanel: (state) => {
			state.isOpen = true;
		},
		closeCreatePanel: (state) => {
			state.isOpen = false;
		},
		toggleCreatePanel: (state) => {
			state.isOpen = !state.isOpen;
		},
	},
});

export const { openCreatePanel, closeCreatePanel, toggleCreatePanel } = createPanelSlice.actions;
export default createPanelSlice.reducer;
