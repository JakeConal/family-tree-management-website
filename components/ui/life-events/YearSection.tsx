'use client';

import { Calendar } from 'lucide-react';

interface YearSectionProps {
	year: number;
}

export function YearSection({ year }: YearSectionProps) {
	return (
		<div className="relative flex items-center mb-[24px]">
			{/* Year badge with calendar icon */}
			<div className="flex items-center gap-[8px] bg-transparent border border-black rounded-[20px] px-[10px] h-[43px]">
				<Calendar className="w-[30px] h-[30px] text-black" />
				<span className="text-[16px] leading-[normal] text-black font-inter font-normal">{year}</span>
			</div>

			{/* Horizontal line */}
			<div className="flex-1 ml-[16px] h-[1px] bg-black" />
		</div>
	);
}

