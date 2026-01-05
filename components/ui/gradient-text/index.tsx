'use client';

import { motion } from 'motion/react';
import * as React from 'react';

import { cn } from '@/lib/utils';

type GradientTextProps = React.ComponentProps<'span'> & {
	text: string;
	gradient?: string;
	neon?: boolean;
	transition?: Record<string, unknown>;
};

function GradientText({
	text,
	className,
	gradient = 'linear-gradient(90deg, #3b82f6 0%, #a855f7 20%, #ec4899 50%, #a855f7 80%, #3b82f6 100%)',
	neon = false,
	transition = { duration: 3, repeat: Infinity, ease: 'linear' },
	...props
}: GradientTextProps) {
	const animationStyle = {
		backgroundImage: gradient,
		backgroundPositionX: ['0%', '200%'],
	};

	return (
		<span data-slot="gradient-text" className={cn('relative inline-block', className)} {...props}>
			<motion.span
				className="m-0 text-transparent bg-clip-text bg-[length:200%_100%]"
				// @ts-expect-error - Framer Motion types are complex, but this works at runtime
				style={animationStyle}
				transition={transition}
			>
				{text}
			</motion.span>

			{neon && (
				<motion.span
					className="m-0 absolute top-0 left-0 text-transparent bg-clip-text blur-[8px] mix-blend-plus-lighter bg-[length:200%_100%]"
					// @ts-expect-error - Framer Motion types are complex, but this works at runtime
					style={animationStyle}
					transition={transition}
				>
					{text}
				</motion.span>
			)}
		</span>
	);
}

export { GradientText, type GradientTextProps };
