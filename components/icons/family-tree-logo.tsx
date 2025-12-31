import type { SVGProps } from 'react';

export function FamilyTreeLogo(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 42 42" fill="none" aria-hidden="true" role="img" {...props}>
			<circle cx="21" cy="21" r="19.75" stroke="#5B5B5B" strokeWidth="1.5" fill="none" />
			<path
				d="M15 6c4 5 8.75 6.5 12.25 10S31 24.25 27.5 28 19 32.5 15 37"
				stroke="#5B5B5B"
				strokeWidth="1.7"
				strokeLinecap="round"
			/>
			<path
				d="M27 6c-4 5-8.75 6.5-12.25 10S11 24.25 14.5 28 23 32.5 27 37"
				stroke="#5B5B5B"
				strokeWidth="1.7"
				strokeLinecap="round"
			/>
			<path d="M15.5 13.75h11M15.5 21h11M15.5 28.25h11" stroke="#5B5B5B" strokeWidth="1.3" strokeLinecap="round" />
		</svg>
	);
}
