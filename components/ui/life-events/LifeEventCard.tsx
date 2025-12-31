'use client';

import { Heart, HeartCrack, Baby } from 'lucide-react';
import classNames from 'classnames';

export type LifeEventType = 'Married' | 'Divorce' | 'Birth Event';

interface LifeEventCardProps {
	id: number;
	title: string;
	date: string;
	description: string;
	type: LifeEventType;
	className?: string;
	onClick?: (id: number) => void;
}

const typeConfig: Record<
	LifeEventType,
	{
		bgColor: string;
		icon: React.ComponentType<{ className?: string }>;
	}
> = {
	Married: {
		bgColor: 'bg-[#FFC8C8]',
		icon: Heart,
	},
	'Birth Event': {
		bgColor: 'bg-[#D9FFE4]',
		icon: Baby,
	},
	Divorce: {
		bgColor: 'bg-[#FFE8A3]',
		icon: HeartCrack,
	},
};

export function LifeEventCard({ id, title, date, description, type, className, onClick }: LifeEventCardProps) {
	const config = typeConfig[type];
	const Icon = config.icon;

	return (
		<div
			className={classNames(
				'relative h-[152px] rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-all',
				config.bgColor,
				className,
				{
					'cursor-pointer hover:scale-[1.02] hover:shadow-lg': onClick,
				}
			)}
			onClick={() => onClick?.(id)}
		>
			{/* Icon in top right */}
			<div className="absolute right-[20px] top-[19px]">
				<Icon className="w-[26px] h-[26px] text-black" />
			</div>

			{/* Title */}
			<div className="absolute left-[28px] top-[29px] right-[100px]">
				<h3
					className="text-[20px] leading-[15.445px] text-black whitespace-nowrap overflow-hidden text-ellipsis"
					style={{ fontFamily: 'Crimson Text, serif' }}
				>
					{title}
				</h3>
			</div>

		{/* Date */}
		{type === 'Married' && (
			<div className="absolute left-[28px] top-[61px]">
				<span
					className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)]"
					style={{ fontFamily: 'Roboto, sans-serif' }}
				>
					{date}
				</span>
			</div>
		)}

		{(type === 'Divorce' || type === 'Birth Event') && (
			<div className="absolute left-[28px] top-[57px]">
				<span
					className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)]"
					style={{ fontFamily: 'Roboto, sans-serif' }}
				>
					{date}
				</span>
			</div>
		)}

			{/* Description */}
			<div className={classNames(
				'absolute left-[28px] right-[28px]',
				type === 'Married' ? 'top-[109px] bottom-[25px]' : 'top-[85px] bottom-[25px]'
			)}>
				<p
					className="text-[15px] leading-[20px] text-[rgba(0,0,0,0.8)] overflow-hidden"
					style={{
						fontFamily: 'Inter, sans-serif',
						fontWeight: 300,
					}}
				>
					{description}
				</p>
			</div>
		</div>
	);
}

