"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const menuSurface =
	"anim-pop z-50 min-w-[12rem] overflow-hidden rounded-xl bg-popover p-1 text-popover-foreground shadow-float outline-none";

export function DropdownMenuContent({
	className,
	sideOffset = 6,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				sideOffset={sideOffset}
				collisionPadding={8}
				className={cn(menuSurface, className)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

const itemClass =
	"relative flex h-8 cursor-default select-none items-center gap-2.5 rounded-lg px-2 text-[13px] text-foreground outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[disabled]:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

export function DropdownMenuItem({
	className,
	destructive,
	shortcut,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { destructive?: boolean; shortcut?: string }) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				itemClass,
				destructive && "text-destructive data-[highlighted]:bg-destructive/10 [&_svg]:text-destructive",
				className,
			)}
			{...props}
		>
			{/* With asChild, Radix's Slot needs exactly one child, so the shortcut hint is skipped. */}
			{props.asChild ? (
				children
			) : (
				<>
					{children}
					{shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
				</>
			)}
		</DropdownMenuPrimitive.Item>
	);
}

export function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>) {
	return (
		<DropdownMenuPrimitive.CheckboxItem className={cn(itemClass, "pr-8", className)} checked={checked} {...props}>
			{children}
			<DropdownMenuPrimitive.ItemIndicator className="absolute right-2 flex items-center">
				<Check className="!text-primary" />
			</DropdownMenuPrimitive.ItemIndicator>
		</DropdownMenuPrimitive.CheckboxItem>
	);
}

export function DropdownMenuRadioItem({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>) {
	return (
		<DropdownMenuPrimitive.RadioItem className={cn(itemClass, "pr-8", className)} {...props}>
			{children}
			<DropdownMenuPrimitive.ItemIndicator className="absolute right-2 flex items-center">
				<Check className="!text-primary" />
			</DropdownMenuPrimitive.ItemIndicator>
		</DropdownMenuPrimitive.RadioItem>
	);
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
	return (
		<DropdownMenuPrimitive.Label
			className={cn("px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground", className)}
			{...props}
		/>
	);
}

export function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
	return <DropdownMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
	return <span className={cn("ml-auto pl-4 font-mono text-[11px] text-subtle-foreground", className)} {...props} />;
}

export function DropdownMenuSubTrigger({
	className,
	children,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>) {
	return (
		<DropdownMenuPrimitive.SubTrigger className={cn(itemClass, "data-[state=open]:bg-accent", className)} {...props}>
			{children}
			<ChevronRight className="ml-auto" />
		</DropdownMenuPrimitive.SubTrigger>
	);
}

export function DropdownMenuSubContent({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.SubContent sideOffset={6} className={cn(menuSurface, className)} {...props} />
		</DropdownMenuPrimitive.Portal>
	);
}
