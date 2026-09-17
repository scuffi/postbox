"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
	className,
	children,
	hideClose = false,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-stone-950/30 backdrop-blur-[3px] dark:bg-black/60" />
			{/*
				Centring happens here, not on the panel. Tailwind's -translate-x-1/2 sets the CSS
				`translate` property, which stacks with the `transform` the open animation runs, so
				a dialog centred that way flies in from off-screen and snaps into place at the end.
				The wrapper passes clicks through to the overlay, which closes on outside clicks.
			*/}
			<div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
			<DialogPrimitive.Content
				className={cn(
					"anim-dialog pointer-events-auto relative max-h-[calc(100dvh-4rem)] w-[min(520px,calc(100vw-32px))] overflow-y-auto overscroll-contain rounded-2xl bg-popover p-6 text-popover-foreground shadow-float outline-none",
					className,
				)}
				{...props}
			>
				{children}
				{!hideClose && (
					<DialogPrimitive.Close className="absolute right-3.5 top-3.5 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
						<X className="size-4" />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
			</div>
		</DialogPrimitive.Portal>
	);
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("mb-5 space-y-1 pr-8", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("-mx-6 -mb-6 mt-6 flex items-center justify-end gap-2 border-t border-border bg-elevated/60 px-6 py-3.5", className)}
			{...props}
		/>
	);
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn("text-[17px] font-semibold tracking-[-0.015em] text-foreground", className)}
			{...props}
		/>
	);
}

export function DialogDescription({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={cn("text-[13px] leading-relaxed text-muted-foreground", className)}
			{...props}
		/>
	);
}
