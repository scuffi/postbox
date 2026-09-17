import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 tracking-[0.01em] whitespace-nowrap transition-colors [&_svg]:size-3",
	{
		variants: {
			variant: {
				default: "bg-primary-soft text-primary-soft-foreground",
				solid: "bg-primary text-primary-foreground",
				secondary: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
				outline: "text-foreground ring-1 ring-inset ring-border-strong",
				success: "bg-emerald-500/10 text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400",
				warning: "bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400",
				destructive: "bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-500/20 dark:text-red-400",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

export function Badge({
	className,
	variant,
	...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
	return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
