"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import type { TooltipProps } from "./tooltip-types";

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ label, children, className, shortcut, side = "bottom", align = "center", disabled }: TooltipProps) {
	if (disabled) return <span className={cn("inline-flex", className)}>{children}</span>;

	return (
		<TooltipPrimitive.Root>
			<TooltipPrimitive.Trigger asChild>
				<span className={cn("inline-flex", className)}>{children}</span>
			</TooltipPrimitive.Trigger>
			<TooltipPrimitive.Portal>
				<TooltipPrimitive.Content
					side={side}
					align={align}
					sideOffset={6}
					collisionPadding={8}
					className="anim-pop z-[100] flex max-w-[min(20rem,calc(100vw-1rem))] select-none items-center gap-2 rounded-lg bg-stone-900 px-2 py-1 text-xs font-medium text-stone-50 shadow-[0_4px_12px_rgb(0_0_0/0.2)] dark:bg-stone-100 dark:text-stone-900"
				>
					{label}
					{shortcut && (
						<kbd className="rounded bg-white/15 px-1 font-mono text-[10px] leading-4 text-white/80 dark:bg-black/10 dark:text-black/60">
							{shortcut}
						</kbd>
					)}
				</TooltipPrimitive.Content>
			</TooltipPrimitive.Portal>
		</TooltipPrimitive.Root>
	);
}
