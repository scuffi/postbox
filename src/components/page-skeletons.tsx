import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";
import { LoadingTransition } from "@/components/loading-transition";

export function PageSkeleton() {
	return <LoadingTransition ready />;
}

export function ListPageSkeleton() {
	return (
		<div className="h-full min-h-0">
			<div className="flex h-16 items-center gap-3 border-b border-border px-6">
				<Skeleton className="size-4 rounded-[5px]" />
				<Skeleton className="h-6 w-28" />
				<span className="flex-1" />
				<Skeleton className="h-6 w-28 rounded-lg" />
			</div>
			<SkeletonRows count={9} />
		</div>
	);
}

export function MessageDetailSkeleton() {
	return (
		<div className="h-full">
			<div className="flex h-14 items-center justify-end gap-2 border-b border-border px-4">
				<Skeleton className="h-8 w-48 rounded-xl" />
				<Skeleton className="size-8 rounded-lg" />
				<Skeleton className="size-8 rounded-lg" />
			</div>
			<div className="mx-auto max-w-[860px] space-y-6 px-8 pt-8">
				<div className="space-y-3">
					<Skeleton className="h-5 w-40 rounded-md" />
					<Skeleton className="h-7 w-3/5" />
				</div>
				<div className="space-y-5 rounded-2xl border border-border p-6">
					<div className="flex items-start gap-3">
						<Skeleton className="size-10 rounded-full" />
						<div className="flex-1 space-y-2 pt-1">
							<Skeleton className="h-3.5 w-48" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-3 w-20" />
					</div>
					<div className="space-y-3">
						<Skeleton className="h-3.5 w-full" />
						<Skeleton className="h-3.5 w-11/12" />
						<Skeleton className="h-3.5 w-4/5" />
						<Skeleton className="h-3.5 w-3/5" />
					</div>
				</div>
			</div>
		</div>
	);
}

export function TableSkeleton() {
	return (
		<div className="overflow-hidden rounded-2xl border border-border bg-card">
			<div className="flex h-11 items-center gap-4 border-b border-border px-4">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-3 w-16" />
			</div>
			<SkeletonRows count={6} />
		</div>
	);
}

export function CardGridSkeleton() {
	return (
		<div className="grid gap-3 md:grid-cols-2">
			{Array.from({ length: 4 }, (_, index) => (
				<div key={index} className="flex min-h-24 items-start gap-3 rounded-2xl border border-border bg-card p-4">
					<Skeleton className="size-10 shrink-0 rounded-xl" />
					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-4 w-2/5" />
						<Skeleton className="h-3.5 w-4/5" />
						<Skeleton className="h-3 w-1/3" />
					</div>
				</div>
			))}
		</div>
	);
}
