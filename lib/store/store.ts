import { configureStore } from '@reduxjs/toolkit';

import createPanelReducer from './createPanelSlice';

export const store = configureStore({
	reducer: {
		createPanel: createPanelReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
