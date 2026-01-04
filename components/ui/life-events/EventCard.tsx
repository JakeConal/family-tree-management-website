'use client';

import classNames from 'classnames';
import {
	Briefcase,
	Trophy,
	Heart,
	Palette,
	Leaf,
	GraduationCap,
	Users,
	DollarSign,
	Lightbulb,
	Plane,
} from 'lucide-react';

import { CalendarIcon, PersonIcon } from '@/components/icons/achievement-metadata';

export type AchievementType =
	| 'Graduation'
	| 'Career'
	| 'Sport'
	| 'Health'
	| 'Artistic'
	| 'Environment'
	| 'Community'
	| 'Financial'
	| 'Skill Development'
	| 'Travel'
	| 'Academic';

interface EventCardProps {
	id: number;
	title: string;
	person: string;
	date: string;
	description: string;
	type: string;
	className?: string;
	onClick?: (id: number) => void;
}

const typeConfig: Record<
	string,
	{
		bgColor: string;
		icon: React.ComponentType<{ className?: string }>;
	}
> = {
	Graduation: {
		bgColor: 'bg-[#DBEAFE]',
		icon: GraduationCap,
	},
	Academic: {
		bgColor: 'bg-[#DBEAFE]',
		icon: GraduationCap,
	},
	Career: {
		bgColor: 'bg-[#EDE7FF]',
		icon: Briefcase,
	},
	Sport: {
		bgColor: 'bg-[#FEF08A]',
		icon: Trophy,
	},
	Health: {
		bgColor: 'bg-[#FFE4E4]',
		icon: Heart,
	},
	Artistic: {
		bgColor: 'bg-[#D9F9FF]',
		icon: Palette,
	},
	Environment: {
		bgColor: 'bg-[#DCFCE7]',
		icon: Leaf,
	},
	Community: {
		bgColor: 'bg-[#E4E4FF]',
		icon: Users,
	},
	Financial: {
		bgColor: 'bg-[#FFF8D9]',
		icon: DollarSign,
	},
	'Skill Development': {
		bgColor: 'bg-[#FFE8CC]',
		icon: Lightbulb,
	},
	Travel: {
		bgColor: 'bg-[#FFE4F3]',
		icon: Plane,
	},
};

export function EventCard({ id, title, person, date, description, type, className, onClick }: EventCardProps) {
	const config = typeConfig[type] || typeConfig['Career'];
	const Icon = config.icon;

	return (
		<div
			className={classNames(
				'relative min-h-[152px] rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-all p-[20px] pr-[60px] flex flex-col gap-[12px]',
				config.bgColor,
				className,
				{
					'cursor-pointer hover:scale-[1.02] hover:shadow-lg': onClick,
				}
			)}
			onClick={() => onClick?.(id)}
		>
			{/* Icon in top right */}
			<div className="absolute right-[20px] top-[20px]">
				<Icon className="w-[26px] h-[26px] text-black" />
			</div>

			{/* Title */}
			<h3
				className="text-[20px] leading-[24px] text-black line-clamp-1 pr-[20px]"
				style={{ fontFamily: 'Crimson Text, serif' }}
			>
				{title}
			</h3>

			{/* Person and Date */}
			<div className="flex items-center gap-x-[16px] gap-y-[8px] flex-wrap">
				<div className="flex items-center gap-[4px]">
					<PersonIcon className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)]" />
					<span
						className="text-[14px] leading-[18px] text-[rgba(47,47,47,0.5)] truncate"
						style={{ fontFamily: 'Roboto, sans-serif' }}
					>
						{person}
					</span>
				</div>
				<div className="flex items-center gap-[4px]">
					<CalendarIcon className="w-[11px] h-[11px] text-[rgba(47,47,47,0.5)]" />
					<span
						className="text-[14px] leading-[18px] text-[rgba(47,47,47,0.5)] truncate"
						style={{ fontFamily: 'Roboto, sans-serif' }}
					>
						{date}
					</span>
				</div>
			</div>

			{/* Description */}
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
	);
}
