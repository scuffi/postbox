import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A single bordered surface holding divided rows: the default for admin collections. */
export function ListCard({ className, children }: { className?: string; children: ReactNode }) {
	return (
		<div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}>
			<div className="divide-y divide-border">{children}</div>
		</div>
	);
}

export const listRowClassName =
	"group flex items-center gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-foreground/[0.025] sm:px-5";
