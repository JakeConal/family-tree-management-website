'use client';

import { CalendarIcon, PersonIcon } from '@/components/icons/achievement-metadata';
import classNames from 'classnames';
import { Briefcase, Trophy, Heart, Palette, Leaf, GraduationCap } from 'lucide-react';

export type AchievementType = 'Graduation' | 'Career' | 'Sport' | 'Health' | 'Artistic' | 'Environment';

interface EventCardProps {
	title: string;
	person: string;
	date: string;
	description: string;
	type: string;
	className?: string;
}

const typeConfig: Record<
	string,
	{
		bgColor: string;
		icon: React.ComponentType<{ className?: string }>;
	}
> = {
	Graduation: {
		bgColor: 'bg-[#FEF3C7]',
		icon: GraduationCap,
	},
	Academic: {
		bgColor: 'bg-[#FEF3C7]',
		icon: GraduationCap,
	},
	Career: {
		bgColor: 'bg-[#FEE2E2]',
		icon: Briefcase,
	},
	Sport: {
		bgColor: 'bg-[#FEF08A]',
		icon: Trophy,
	},
	Health: {
		bgColor: 'bg-[#DBEAFE]',
		icon: Heart,
	},
	Artistic: {
		bgColor: 'bg-[#FCE7F3]',
		icon: Palette,
	},
	Environment: {
		bgColor: 'bg-[#DCFCE7]',
		icon: Leaf,
	},
	Community: {
		bgColor: 'bg-[#E0E7FF]',
		icon: Heart,
	},
	Financial: {
		bgColor: 'bg-[#FEF3C7]',
		icon: Briefcase,
	},
	'Skill Development': {
		bgColor: 'bg-[#FED7AA]',
		icon: Trophy,
	},
	Travel: {
		bgColor: 'bg-[#FBCFE8]',
		icon: Palette,
	},
};

export function EventCard({ title, person, date, description, type, className }: EventCardProps) {
	const config = typeConfig[type] || typeConfig['Career'];
	const Icon = config.icon;

	return (
		<div
			className={classNames(
				'relative h-[152px] rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]',
				config.bgColor,
				className
			)}
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

			{/* Person and Date */}
			<div className="absolute left-[28px] top-[57px] flex items-center gap-[126px]">
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
			</div>

			{/* Description */}
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
