import { ReactNode } from 'react';

/**
 * Common translation keys used throughout the application
 * Import these constants to avoid typos in translation IDs
 */

export const COMMON_KEYS = {
	LOADING: 'common.loading',
	SAVE: 'common.save',
	CANCEL: 'common.cancel',
	DELETE: 'common.delete',
	EDIT: 'common.edit',
	ADD: 'common.add',
	BACK: 'common.back',
	NEXT: 'common.next',
	PREVIOUS: 'common.previous',
	SUBMIT: 'common.submit',
	CLOSE: 'common.close',
	CONFIRM: 'common.confirm',
	SEARCH: 'common.search',
	FILTER: 'common.filter',
	EXPORT: 'common.export',
	IMPORT: 'common.import',
	SAVE_CHANGES: 'common.saveChanges',
	DELETE_ACCOUNT: 'common.deleteAccount',
	UPDATE_PASSWORD: 'common.updatePassword',
	SAVING: 'common.saving',
	DELETING: 'common.deleting',
	UPDATING: 'common.updating',
} as const;

export const NAV_KEYS = {
	FEATURES: 'nav.features',
	HOW_IT_WORKS: 'nav.howItWorks',
	SIGN_IN: 'nav.signIn',
	START_FOR_FREE: 'nav.startForFree',
	FAMILY_TREE: 'nav.familyTree',
	BACK_TO_HOME: 'nav.backToHome',
} as const;

export const ERROR_KEYS = {
	GENERIC: 'error.generic',
	NETWORK_ERROR: 'error.networkError',
	UNAUTHORIZED: 'error.unauthorized',
	NOT_FOUND: 'error.notFound',
	SERVER_ERROR: 'error.serverError',
} as const;

export const VALIDATION_KEYS = {
	REQUIRED: 'validation.required',
	INVALID_EMAIL: 'validation.invalidEmail',
	INVALID_DATE: 'validation.invalidDate',
	MIN_LENGTH: 'validation.minLength',
	MAX_LENGTH: 'validation.maxLength',
	MUST_BE_AFTER: 'validation.mustBeAfter',
	MUST_BE_BEFORE: 'validation.mustBeBefore',
} as const;

/**
 * Type for translation values
 */
export type TranslationValues = Record<string, ReactNode | string | number>;

/**
 * Helper function to get nested translation key
 */
export function getTranslationKey(prefix: string, ...keys: string[]): string {
	return [prefix, ...keys].join('.');
}

/**
 * Example usage:
 *
 * import { COMMON_KEYS } from '@/lib/i18n/keys';
 * import { FormattedMessage } from 'react-intl';
 *
 * <FormattedMessage id={COMMON_KEYS.LOADING} defaultMessage="Loading..." />
 */
