import type { Locale } from '@/lib/i18n/config';
import { messages } from '@/lib/i18n/config';

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
	locale = locale in messages ? locale : 'en';
	return flattenMessages(messages[locale]);
}
