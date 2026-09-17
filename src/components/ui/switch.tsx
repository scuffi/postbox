"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { SwitchProps } from "./switch-types";

export function Switch({ checked, onCheckedChange, className, disabled, ...props }: SwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			disabled={disabled}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				"relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50",
				checked
					? "justify-end bg-primary shadow-[inset_0_1px_2px_rgb(0_0_0/0.15)]"
					: "justify-start bg-border-strong shadow-[inset_0_1px_2px_rgb(0_0_0/0.08)]",
				className,
			)}
			{...props}
		>
			<motion.span
				layout
				transition={{ type: "spring", stiffness: 700, damping: 38 }}
				className="pointer-events-none block size-4 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)]"
			/>
		</button>
	);
}
