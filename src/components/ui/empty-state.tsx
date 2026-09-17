import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: {
	icon?: LucideIcon;
	title: ReactNode;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex animate-fade-up flex-col items-center justify-center px-6 py-16 text-center", className)}>
			{Icon && (
				<div className="relative mb-5">
					<div className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/10 blur-2xl" />
					<div className="flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-panel">
						<Icon className="size-5" strokeWidth={1.75} />
					</div>
				</div>
			)}
			<h3 className="font-display text-2xl text-foreground">{title}</h3>
			{description && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
			{action && <div className="mt-5">{action}</div>}
		</div>
	);
}
