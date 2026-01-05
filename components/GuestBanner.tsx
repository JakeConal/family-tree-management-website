'use client';

import { Info } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { useGuestSession } from '@/lib/hooks/useGuestSession';

export default function GuestBanner() {
	const { isGuest, session } = useGuestSession();

	if (!isGuest) return null;

	return (
		<div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
			<div className="flex items-center gap-3">
				<div className="flex-shrink-0">
					<Info className="w-5 h-5 text-blue-600" />
				</div>
				<div className="flex-1">
					<p className="text-sm text-blue-800">
						<strong>
							<FormattedMessage id="guest.banner.title" defaultMessage="Guest Mode:" />
						</strong>
						&nbsp;
						<FormattedMessage
							id="guest.banner.description"
							defaultMessage="You are viewing as a guest. You can only edit your own profile ({name})."
							values={{ name: session?.user?.name }}
						/>
					</p>
				</div>
			</div>
		</div>
	);
}
