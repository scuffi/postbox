import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
	return (
		<kbd
			className={cn(
				"inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border-strong bg-card px-1 font-mono text-[10.5px] font-medium leading-none text-muted-foreground shadow-[0_1px_0_var(--border-strong)]",
				className,
			)}
			{...props}
		/>
	);
}
