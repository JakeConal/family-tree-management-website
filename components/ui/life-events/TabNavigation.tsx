'use client';

import classNames from 'classnames';

interface TabNavigationProps {
	activeTab: 'achievement' | 'passing' | 'life-event';
	onTabChange: (tab: 'achievement' | 'passing' | 'life-event') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
	return (
		<div className="flex w-full max-w-[1155px] mx-auto" data-name="Tab Navigation">
			{/* Achievement Tab */}
			<button
				onClick={() => onTabChange('achievement')}
				className={classNames(
					'flex-1 h-[48px] flex items-center justify-center transition-colors',
					'border-2 border-[rgba(0,0,0,0.25)] rounded-tl-[20px] rounded-bl-[20px]',
					'border-r-0',
					{
						'bg-[#e5e7eb]': activeTab === 'achievement',
						'bg-[#f8f8f8]': activeTab !== 'achievement',
					}
				)}
			>
				<span
					className="font-semibold text-[20px] leading-[28px] text-black text-center"
					style={{ fontFamily: 'Roboto, sans-serif' }}
				>
					Achievement
				</span>
			</button>

			{/* Passing Tab */}
			<button
				onClick={() => onTabChange('passing')}
				className={classNames(
					'flex-1 h-[48px] flex items-center justify-center transition-colors',
					'border-2 border-[rgba(0,0,0,0.25)]',
					{
						'bg-[#e5e7eb]': activeTab === 'passing',
						'bg-[#f8f8f8]': activeTab !== 'passing',
					}
				)}
			>
				<span
					className="font-semibold text-[20px] leading-[28px] text-black text-center"
					style={{ fontFamily: 'Roboto, sans-serif' }}
				>
					Passing
				</span>
			</button>

			{/* Life Event Tab */}
			<button
				onClick={() => onTabChange('life-event')}
				className={classNames(
					'flex-1 h-[48px] flex items-center justify-center transition-colors',
					'border-2 border-[rgba(0,0,0,0.25)] rounded-tr-[20px] rounded-br-[20px]',
					'border-l-0',
					{
						'bg-[#e5e7eb]': activeTab === 'life-event',
						'bg-[#f8f8f8]': activeTab !== 'life-event',
					}
				)}
			>
				<span
					className="font-semibold text-[20px] leading-[28px] text-black text-center"
					style={{ fontFamily: 'Roboto, sans-serif' }}
				>
					Life Event
				</span>
			</button>
		</div>
	);
}
