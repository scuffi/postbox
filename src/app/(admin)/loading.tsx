import { TableSkeleton } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
	return (
		<div className="w-full space-y-8">
			<div className="space-y-3">
				<Skeleton className="h-9 w-56" />
				<Skeleton className="h-4 w-80" />
			</div>
			<TableSkeleton />
		</div>
	);
}
