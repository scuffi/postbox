import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { SelectProps } from "@/components/ui/select-types";
import { cn } from "@/lib/utils";

export const RoutingRuleSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className, ...props }, ref) => (
		<span className="relative block min-w-0">
			<select
				ref={ref}
				className={cn(
					"flex h-9 w-full appearance-none truncate rounded-lg border border-input bg-card py-1.5 pl-3 pr-9 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] hover:border-border-strong focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-muted/40",
					className,
				)}
				{...props}
			/>
			<ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		</span>
	),
);
RoutingRuleSelect.displayName = "RoutingRuleSelect";
