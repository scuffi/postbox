import * as React from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
	"flex h-9 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-1 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-subtle-foreground hover:border-border-strong focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground dark:bg-muted/40";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => (
		<input type={type} className={cn(inputClassName, className)} ref={ref} {...props} />
	),
);
Input.displayName = "Input";
