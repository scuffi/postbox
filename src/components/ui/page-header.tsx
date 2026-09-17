import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Title block used at the top of admin and settings screens. */
export function PageHeader({
	title,
	description,
	eyebrow,
	actions,
	className,
}: {
	title: ReactNode;
	description?: ReactNode;
	eyebrow?: ReactNode;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<header className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
			<div className="min-w-0 animate-fade-up">
				{eyebrow && (
					<p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-primary">{eyebrow}</p>
				)}
				<h1 className="font-display text-[34px] leading-[1.05] text-foreground sm:text-[40px]">{title}</h1>
				{description && (
					<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
				)}
			</div>
			{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
		</header>
	);
}

/** Section heading inside a page, with optional trailing actions. */
export function SectionHeader({
	title,
	description,
	actions,
	className,
}: {
	title: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("mb-3 flex items-end justify-between gap-4", className)}>
			<div className="min-w-0">
				<h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
				{description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
			</div>
			{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
		</div>
	);
}
