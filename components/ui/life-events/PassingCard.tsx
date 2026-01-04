'use client';

import classNames from 'classnames';
import { MapPin, Flower2 } from 'lucide-react';

import { CalendarIcon, PersonIcon } from '@/components/icons/achievement-metadata';

interface PassingCardProps {
	id: number;
	title: string;
	person: string;
	date: string;
	buriedPlace: string;
	description: string;
	className?: string;
	onClick?: (id: number) => void;
}

export function PassingCard({
	id,
	title,
	person,
	date,
	buriedPlace,
	description,
	className,
	onClick,
}: PassingCardProps) {
	return (
		<div
			className={classNames(
				'relative min-h-[152px] rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] bg-[#f5f5f5] transition-all p-[20px] pr-[60px]',
				className,
				{
					'cursor-pointer hover:scale-[1.02] hover:shadow-lg': onClick,
				}
			)}
			onClick={() => onClick?.(id)}
		>
			{/* Flower icon in top right */}
			<div className="absolute right-[20px] top-[20px]">
				<Flower2 className="w-[26px] h-[26px] text-black" />
			</div>

			{/* Content */}
			<div className="flex flex-col gap-[12px]">
				{/* Title */}
				<h3
					className="text-[20px] leading-[24px] text-black line-clamp-1 pr-[20px]"
					style={{ fontFamily: 'Crimson Text, serif' }}
				>
					{title}
				</h3>

				{/* Metadata Row */}
				<div className="flex flex-wrap items-center gap-x-[16px] gap-y-[8px]">
					<div className="flex items-center gap-[4px] flex-shrink-0">
						<PersonIcon className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)]" />
						<span
							className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)]"
							style={{ fontFamily: 'Roboto, sans-serif' }}
						>
							{person}
						</span>
					</div>
					<div className="flex items-center gap-[4px] flex-shrink-0">
						<CalendarIcon className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)]" />
						<span
							className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)]"
							style={{ fontFamily: 'Roboto, sans-serif' }}
						>
							{date}
						</span>
					</div>
					<div className="flex items-center gap-[4px] min-w-0">
						<MapPin className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)] opacity-50 flex-shrink-0" />
						<span
							className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)] truncate"
							style={{ fontFamily: 'Roboto, sans-serif' }}
						>
							{buriedPlace}
						</span>
					</div>
				</div>

				{/* Description (Causes) */}
				<p
					className="text-[15px] leading-[20px] text-[rgba(0,0,0,0.8)] line-clamp-2"
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
