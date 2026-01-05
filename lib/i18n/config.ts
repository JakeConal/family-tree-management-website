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

/**
 * Find the different keys between two objects (used to find missing translations)
 * @param base The base object to compare against
 * @param compare The object to compare
 * @param prefix The prefix for nested keys (used internally)
 * @returns An array of missing keys
 */
export function findMissingKeys(base: Record<string, never>, compare: Record<string, never>, prefix = ''): string[] {
	let missingKeys: string[] = [];
	for (const key in base) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (!(key in compare)) {
			missingKeys.push(fullKey);
		} else if (typeof base[key] === 'object' && typeof compare[key] === 'object') {
			missingKeys = missingKeys.concat(findMissingKeys(base[key], compare[key], fullKey));
		}
	}
	return missingKeys;
}
