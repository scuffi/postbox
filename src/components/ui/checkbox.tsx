import * as React from "react";
import { cn } from "@/lib/utils";
import type { CheckboxProps } from "./checkbox-types";

const checkIcon =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3.5 8.5l3 3 6-7'/%3E%3C/svg%3E\")";

/** Native checkbox (keeps `onChange(event.target.checked)`), drawn to match the design system. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, style, ...props }, ref) => (
		<input
			type="checkbox"
			className={cn(
				"peer size-4 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-card bg-center bg-no-repeat shadow-[0_1px_1px_rgb(0_0_0/0.04)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:border-muted-foreground/60 active:scale-90 checked:border-primary checked:bg-primary bg-[length:0px] checked:bg-[length:12px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-muted",
				className,
			)}
			style={{ backgroundImage: checkIcon, ...style }}
			ref={ref}
			{...props}
		/>
	),
);
Checkbox.displayName = "Checkbox";
