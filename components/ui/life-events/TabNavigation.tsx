'use client';

import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

interface TabNavigationProps {
	tabs: string[];
	activeTab: string;
	onTabChange: (tab: string) => void;
}

export function TabNavigation({ tabs = [], activeTab, onTabChange }: TabNavigationProps) {
	return (
		<div className="flex w-full max-w-[1155px] mx-auto" data-name="Tab Navigation">
			{/* Achievement Tab */}
			{tabs.map((tab, index) => (
				<button
					key={tab}
					onClick={() => onTabChange(tab)}
					className={classNames(
						'flex-1 h-[48px] flex items-center justify-center transition-colors cursor-pointer',
						'border-2 border-[rgba(0,0,0,0.25)]',
						{
							'rounded-tl-[20px] rounded-bl-[20px] border-r-0': index === 0,
							'rounded-tr-[20px] rounded-br-[20px] border-l-0': index === tabs.length - 1,
							'bg-[#e5e7eb]': activeTab === tab,
							'bg-[#f8f8f8]': activeTab !== tab,
						}
					)}
				>
					<span
						className="font-semibold text-[20px] leading-[28px] text-black text-center"
						style={{ fontFamily: 'Roboto, sans-serif' }}
					>
						<FormattedMessage id={`lifeEvents.tabs.${tab}`} />
					</span>
				</button>
			))}
		</div>
	);
}
