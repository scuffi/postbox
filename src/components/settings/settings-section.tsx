import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Two-column settings block: explanation on the left, controls on the right. */
export function SettingsSection({
	title,
	description,
	children,
	className,
}: {
	title: ReactNode;
	description?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"grid animate-fade-up gap-4 border-t border-border py-8 first:border-t-0 first:pt-2 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-10",
				className,
			)}
		>
			<div className="xl:sticky xl:top-6 xl:self-start">
				<h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
				{description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
			</div>
			<div className="min-w-0 space-y-4">{children}</div>
		</section>
	);
}

/** A bordered card for one group of settings, with an optional heading. */
export function SettingsCard({
	title,
	description,
	children,
	className,
}: {
	title?: ReactNode;
	description?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] sm:p-6", className)}>
			{title && (
				<div className="mb-5">
					<h3 className="text-sm font-semibold text-foreground">{title}</h3>
					{description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
				</div>
			)}
			{children}
		</div>
	);
}
