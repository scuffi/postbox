import type { LucideIcon } from "lucide-react";

export type SwipeAction = {
	label: string;
	icon: LucideIcon;
	/** Background revealed behind the row, e.g. `bg-primary`. */
	className: string;
	/** Slides the row out before running, for actions that remove it from the list. */
	dismiss?: boolean;
	onTrigger(): unknown;
};
