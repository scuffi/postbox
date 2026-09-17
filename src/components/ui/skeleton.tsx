import { cn } from "@/lib/utils";
import type { SkeletonProps, SkeletonRowsProps } from "./skeleton-types";

export function Skeleton({ className, ...props }: SkeletonProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(
				"animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--muted)_0%,color-mix(in_oklab,var(--muted)_40%,var(--card))_50%,var(--muted)_100%)] bg-[length:200%_100%]",
				className,
			)}
			{...props}
		/>
	);
}

export function SkeletonRows({ count = 5, compact = false }: SkeletonRowsProps) {
	return (
		<div className="space-y-px p-2">
			{Array.from({ length: count }, (_, index) => (
				<div
					key={index}
					className={cn("flex items-center gap-3 rounded-xl", compact ? "px-3 py-3" : "px-4 py-3.5")}
					style={{ opacity: 1 - index * (0.7 / count) }}
				>
					<Skeleton className="size-8 shrink-0 rounded-full" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-3 w-1/3" />
						<Skeleton className="h-3 w-3/4" />
					</div>
					<Skeleton className="h-2.5 w-10 shrink-0" />
				</div>
			))}
		</div>
	);
}
