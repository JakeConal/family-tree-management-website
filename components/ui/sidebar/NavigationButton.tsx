"use client";

import classNames from "classnames";
import { useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

interface NavigationButtonProps {
	name: string;
	href: string;
	icon: LucideIcon;
	isActive: boolean;
	disabled?: boolean;
}

export function NavigationButton({
	name,
	href,
	icon: Icon,
	isActive,
	disabled = false,
}: NavigationButtonProps) {
	const router = useRouter();

	const handleClick = () => {
		if (!disabled) {
			router.push(href);
		}
	};

	return (
		<button
			onClick={handleClick}
			disabled={disabled}
			className={classNames(
				"w-full flex items-center h-9 px-3.5 text-[16px] font-inter font-normal rounded-[30px] transition-colors cursor-pointer",
				{
					"bg-[#d4d4d8] text-black": isActive,
					"text-gray-400 cursor-not-allowed": disabled && !isActive,
					"text-black hover:bg-gray-200": !disabled && !isActive,
				}
			)}
			title={disabled ? "Coming soon" : undefined}
		>
			<Icon
				className={classNames("w-5 h-5 mr-2.5", {
					"text-black": isActive,
					"text-gray-400": disabled && !isActive,
					"text-gray-500": !disabled && !isActive,
				})}
			/>
			{name}
		</button>
	);
}
