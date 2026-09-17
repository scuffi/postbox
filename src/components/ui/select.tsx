"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectProps } from "./select-types";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
	({ className, containerClassName, children, ...props }, ref) => (
		<span className={cn("relative inline-flex min-w-0", containerClassName)}>
			<select
				ref={ref}
				className={cn(
					"h-9 w-full cursor-pointer appearance-none rounded-lg border border-input bg-card pl-3 pr-8 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] duration-150 hover:border-border-strong focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-muted/40",
					className,
				)}
				{...props}
			>
				{children}
			</select>
			<ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
		</span>
	),
);
Select.displayName = "Select";
