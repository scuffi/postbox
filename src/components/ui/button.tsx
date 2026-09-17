import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
	"relative inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13px] font-medium tracking-[-0.005em] transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-']):not([class*='h-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"bg-gradient-to-b from-[color-mix(in_oklab,var(--primary)_92%,white)] to-primary text-primary-foreground shadow-button hover:brightness-[1.06]",
				secondary:
					"bg-card text-foreground shadow-[0_0_0_1px_var(--border-strong),0_1px_2px_rgb(0_0_0/0.05)] hover:bg-elevated dark:bg-elevated dark:hover:bg-accent",
				outline: "border border-border-strong bg-transparent text-foreground hover:bg-accent",
				ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
				soft: "bg-primary-soft text-primary-soft-foreground hover:bg-[color-mix(in_oklab,var(--primary)_18%,transparent)]",
				destructive:
					"bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_1px_2px_rgb(0_0_0/0.15)] hover:brightness-110",
				link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
			},
			size: {
				default: "h-9 px-3.5",
				xs: "h-7 gap-1 rounded-md px-2 text-xs",
				sm: "h-8 px-2.5",
				lg: "h-10 rounded-xl px-5 text-sm",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-xs": "size-7 rounded-md",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
	},
);
Button.displayName = "Button";
