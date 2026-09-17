import type { LucideIcon } from "lucide-react";

export type MobileTab = {
	href: string;
	label: string;
	icon: LucideIcon;
	/** Only the exact path counts as active, e.g. `/admin` shouldn't claim `/admin/...`. */
	exact?: boolean;
	count?: number;
};
