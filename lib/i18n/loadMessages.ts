import type { Locale } from './config';

type NestedMessages = {
	[key: string]: string | NestedMessages;
};

/**
 * Flatten nested message object to dot notation
 * { common: { loading: "Loading..." } } => { "common.loading": "Loading..." }
 */
function flattenMessages(nestedMessages: NestedMessages, prefix = ''): Record<string, string> {
	return Object.keys(nestedMessages).reduce(
		(messages, key) => {
			const value = nestedMessages[key];
			const prefixedKey = prefix ? `${prefix}.${key}` : key;

			if (typeof value === 'string') {
				messages[prefixedKey] = value;
			} else if (typeof value === 'object' && value !== null) {
				Object.assign(messages, flattenMessages(value, prefixedKey));
			}

			return messages;
		},
		{} as Record<string, string>
	);
}

export async function loadMessages(locale: Locale) {
	try {
		const messages = await import(`@/locales/${locale}.json`);
		return flattenMessages(messages.default);
	} catch (error) {
		console.error(`Failed to load messages for locale: ${locale}`, error);
		// Fallback to English if the requested locale fails to load
		const fallback = await import('@/locales/en.json');
		return flattenMessages(fallback.default);
	}
}
