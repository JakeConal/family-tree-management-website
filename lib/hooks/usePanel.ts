import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openPanel, closePanel, updatePanelProps, PanelType, PanelProps } from '../store/panelSlice';

/**
 * Custom hook for managing panel state globally
 * Provides methods to open and close panels
 */
export function usePanel() {
	const dispatch = useAppDispatch();
	const { activePanel, panelProps } = useAppSelector((state) => state.panel);

	const open = useCallback(
		<T extends PanelType>(type: T, props: T extends keyof PanelProps ? PanelProps[T] : never) => {
			dispatch(openPanel({ type, props }));
		},
		[dispatch]
	);

	const close = useCallback(() => {
		dispatch(closePanel());
	}, [dispatch]);

	const update = useCallback(
		<T extends PanelType>(type: T, props: Partial<T extends keyof PanelProps ? PanelProps[T] : never>) => {
			dispatch(updatePanelProps({ type, props }));
		},
		[dispatch]
	);

	return {
		activePanel,
		panelProps,
		openPanel: open,
		closePanel: close,
		updatePanelProps: update,
		isOpen: activePanel !== null,
	};
}
