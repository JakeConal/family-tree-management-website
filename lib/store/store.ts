import { configureStore } from '@reduxjs/toolkit';

import panelReducer from './panelSlice';

export const store = configureStore({
	reducer: {
		panel: panelReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
