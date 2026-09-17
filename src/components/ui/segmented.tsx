"use client";

import { motion } from "motion/react";
import { useId } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Pill segmented control with a sliding thumb. */
export function Segmented<T extends string>({
	value,
	onChange,
	options,
	className,
	size = "default",
}: {
	value: T;
	onChange: (value: T) => void;
	options: Array<{ value: T; label: ReactNode; title?: string }>;
	className?: string;
	size?: "default" | "sm";
}) {
	const id = useId();
	return (
		<div
			role="radiogroup"
			className={cn("inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5 ring-1 ring-inset ring-border", className)}
		>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={active}
						title={option.title}
						onClick={() => onChange(option.value)}
						className={cn(
							"relative flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors [&_svg]:size-3.5",
							size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-[13px]",
							active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
						)}
					>
						{active && (
							<motion.span
								layoutId={`segmented-${id}`}
								transition={{ type: "spring", stiffness: 500, damping: 38 }}
								className="absolute inset-0 rounded-md bg-card shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--border)] dark:bg-accent"
							/>
						)}
						<span className="relative flex items-center gap-1.5">{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
