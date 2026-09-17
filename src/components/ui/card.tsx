import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"rounded-2xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgb(0_0_0/0.03)]",
				className,
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("flex flex-col gap-1 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
	return <h3 className={cn("text-[15px] font-semibold leading-tight tracking-[-0.01em]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	return <p className={cn("text-[13px] leading-relaxed text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("flex items-center justify-end gap-2 rounded-b-2xl border-t border-border bg-elevated/60 px-5 py-3 sm:px-6", className)}
			{...props}
		/>
	);
}
