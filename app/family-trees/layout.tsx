'use client';

import { ReactNode } from 'react';

import GuestBanner from '@/components/GuestBanner';

export default function FamilyTreesLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
			<GuestBanner />
			{children}
		</div>
	);
}
