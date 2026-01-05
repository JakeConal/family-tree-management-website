'use client';

import classNames from 'classnames';
import { Globe } from 'lucide-react';
import { useState } from 'react';

import { Locale, localeNames } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/useLocale';

export function LanguageSwitcher({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
	const { locale, setLocale } = useLocale();
	const [isOpen, setIsOpen] = useState(false);

	const handleLocaleChange = (newLocale: Locale) => {
		setLocale(newLocale);
		setIsOpen(false);
	};

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
				aria-label="Change language"
			>
				<Globe className="w-4 h-4" />
				{!compact && <span className="hidden sm:inline">{localeNames[locale]}</span>}
			</button>

			{isOpen && (
				<>
					{/* Backdrop */}
					<div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

					{/* Dropdown */}
					<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
						{Object.entries(localeNames).map(([key, name]) => (
							<button
								key={key}
								onClick={() => handleLocaleChange(key as Locale)}
								className={classNames(
									'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors',
									{
										'bg-gray-50 text-gray-900 font-medium': locale === key,
										'text-gray-700': locale !== key,
									},
									className
								)}
							>
								{name}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
