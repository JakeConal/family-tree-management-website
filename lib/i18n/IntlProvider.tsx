'use client';

import { ReactNode, useState, useEffect } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';

import { defaultLocale, Locale } from './config';
import { loadMessages } from './loadMessages';

interface IntlProviderProps {
	children: ReactNode;
	locale?: Locale;
}

export function IntlProvider({ children, locale = defaultLocale }: IntlProviderProps) {
	const [messages, setMessages] = useState<Record<string, string> | null>(null);

	// Initialize locale from localStorage or use default
	const getInitialLocale = (): Locale => {
		if (typeof window !== 'undefined') {
			const storedLocale = localStorage.getItem('locale') as Locale | null;
			if (storedLocale) {
				return storedLocale;
			}
		}
		return locale;
	};

	const [currentLocale, setCurrentLocale] = useState<Locale>(getInitialLocale);

	useEffect(() => {
		// Load messages for the current locale
		loadMessages(currentLocale).then(setMessages);
	}, [currentLocale]);

	useEffect(() => {
		// Listen for locale changes from localStorage
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'locale' && e.newValue) {
				setCurrentLocale(e.newValue as Locale);
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	if (!messages) {
		// Return a loading state while messages are being loaded
		return null;
	}

	return (
		<ReactIntlProvider messages={messages} locale={currentLocale} defaultLocale={defaultLocale}>
			{children}
		</ReactIntlProvider>
	);
}
