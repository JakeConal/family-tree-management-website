import en from '@/locales/en/index';
import vi from '@/locales/vi/index';

export const locales = ['en', 'vi'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
	en: 'English',
	vi: 'Tiếng Việt',
};

export const messages = { en, vi };
