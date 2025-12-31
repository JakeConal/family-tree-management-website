import type { SVGProps } from 'react';

export const PersonIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" {...props}>
		<path
			d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
		/>
		<path d="M5 20c0-2.76 3.13-5 7-5s7 2.24 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
	</svg>
);

export const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" {...props}>
		<rect x="3" y="5" width="18" height="16" rx="3" ry="3" stroke="currentColor" strokeWidth="1.5" />
		<path d="M8 3v4M16 3v4M3 11h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
	</svg>
);
