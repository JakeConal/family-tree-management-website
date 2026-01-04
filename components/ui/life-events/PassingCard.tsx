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
				'relative h-[152px] rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] bg-[#f5f5f5] transition-all',
				className,
				{
					'cursor-pointer hover:scale-[1.02] hover:shadow-lg': onClick,
				}
			)}
			onClick={() => onClick?.(id)}
		>
			{/* Flower icon in top right */}
			<div className="absolute right-[20px] top-[19px]">
				<Flower2 className="w-[26px] h-[26px] text-black" />
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

			{/* Person, Date, and Buried Place */}
			<div className="absolute left-[28px] top-[57px] flex items-center justify-start gap-4 sm:gap-8 md:gap-12 lg:gap-[126px]">
				<div className="flex items-center gap-[4px]">
					<PersonIcon className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)]" />
					<span
						className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)]"
						style={{ fontFamily: 'Roboto, sans-serif' }}
					>
						{person}
					</span>
				</div>
				<div className="flex items-center gap-[4px]">
					<CalendarIcon className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)]" />
					<span
						className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)]"
						style={{ fontFamily: 'Roboto, sans-serif' }}
					>
						{date}
					</span>
				</div>
				<div className="flex items-center gap-[4px]">
					<MapPin className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)] opacity-50" />
					<span
						className="text-[14px] leading-[15.445px] text-[rgba(47,47,47,0.5)] max-w-[200px] truncate"
						style={{ fontFamily: 'Roboto, sans-serif' }}
					>
						{buriedPlace}
					</span>
				</div>
			</div>

			{/* Description (Causes) */}
			<div className="absolute left-[27px] right-[139px] top-[85px] bottom-[25px]">
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
