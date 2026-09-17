import type { ReactNode } from "react";

export type TooltipProps = {
	label: ReactNode;
	children: ReactNode;
	className?: string;
	/** Optional keyboard shortcut rendered as a key hint. */
	shortcut?: string;
	side?: "top" | "right" | "bottom" | "left";
	align?: "start" | "center" | "end";
	disabled?: boolean;
};
