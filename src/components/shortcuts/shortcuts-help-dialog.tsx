"use client";

import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import type { ShortcutDefinition } from "./types";

interface ShortcutsHelpDialogProps {
	isOpen: boolean;
	onClose: () => void;
	shortcuts: ShortcutDefinition[];
}

function formatKeys(shortcut: ShortcutDefinition): string[] {
	const parts: string[] = [];
	for (const modifier of shortcut.modifiers ?? []) {
		if (modifier === "ctrl") parts.push("Ctrl");
		if (modifier === "meta") parts.push("⌘");
		if (modifier === "alt") parts.push("⌥");
		if (modifier === "shift") parts.push("⇧");
	}
	// A shortcut listing both ⌘ and Ctrl means "either", so show the platform-neutral pair once.
	const unique = parts.includes("⌘") && parts.includes("Ctrl") ? ["⌘"] : parts;
	return [...unique, ...shortcut.key.split(" ").map((key) => (key === "escape" ? "Esc" : key.toUpperCase()))];
}

export function ShortcutsHelpDialog({ isOpen, onClose, shortcuts }: ShortcutsHelpDialogProps) {
	const grouped = shortcuts.reduce(
		(acc, item) => {
			if (!acc[item.category]) acc[item.category] = [];
			if (!acc[item.category].some((existing) => existing.label === item.label)) acc[item.category].push(item);
			return acc;
		},
		{} as Record<string, ShortcutDefinition[]>,
	);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="w-[min(720px,calc(100vw-32px))] p-0">
				<DialogHeader className="mb-0 flex flex-row items-center gap-3 border-b border-border px-6 py-5">
					<span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
						<Keyboard className="size-[18px]" />
					</span>
					<div className="space-y-0.5">
						<DialogTitle>Keyboard shortcuts</DialogTitle>
						<DialogDescription>Move through mail without touching the mouse.</DialogDescription>
					</div>
				</DialogHeader>
				<div className="grid gap-x-10 gap-y-7 px-6 py-6 md:grid-cols-2">
					{Object.entries(grouped).map(([category, items]) => (
						<section key={category}>
							<h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">{category}</h3>
							<ul className="space-y-0.5">
								{items.map((item) => (
									<li key={`${item.key}-${item.label}`} className="-mx-2 flex h-8 items-center justify-between gap-4 rounded-lg px-2 text-[13px] hover:bg-accent/60">
										<span className="truncate text-foreground/85">{item.label}</span>
										<span className="flex shrink-0 items-center gap-1">
											{formatKeys(item).map((key, index) => (
												<Kbd key={`${key}-${index}`}>{key}</Kbd>
											))}
										</span>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
				<div className="flex items-center justify-between border-t border-border bg-elevated/60 px-6 py-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1.5">Press <Kbd>?</Kbd> to toggle</span>
					<span className="flex items-center gap-1.5">Press <Kbd>Esc</Kbd> to close</span>
				</div>
			</DialogContent>
		</Dialog>
	);
}
