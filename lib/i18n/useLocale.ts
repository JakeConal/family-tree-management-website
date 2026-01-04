'use client';

import { useCallback, useState } from 'react';

import { defaultLocale, Locale, locales } from './config';

export function useLocale() {
	const [locale, setLocaleState] = useState<Locale>(() => {
		// Load locale from localStorage on mount
		const storedLocale = localStorage.getItem('locale') as Locale | null;
		if (storedLocale && locales.includes(storedLocale)) {
			return storedLocale;
		}
		return defaultLocale;
	});

	const setLocale = useCallback((newLocale: Locale) => {
		if (!locales.includes(newLocale)) {
			console.error(`Invalid locale: ${newLocale}`);
			return;
		}

		setLocaleState(newLocale);
		localStorage.setItem('locale', newLocale);

		// Trigger a storage event to notify other components
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: 'locale',
				newValue: newLocale,
			})
		);
	}, []);

	return { locale, setLocale };
}
