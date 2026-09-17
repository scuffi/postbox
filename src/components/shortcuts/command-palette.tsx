"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import { useMemo } from "react";
import { Kbd } from "@/components/ui/kbd";
import type { CommandItem } from "./types";
import { groupCommandsByCategory } from "./command-palette-utils";

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
	commands: CommandItem[];
}

function ShortcutKeys({ shortcut }: { shortcut: string }) {
	return (
		<span className="ml-auto flex shrink-0 items-center gap-1">
			{shortcut.split(" ").map((key, index) => (
				<Kbd key={`${key}-${index}`}>{key.toUpperCase()}</Kbd>
			))}
		</span>
	);
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
	const grouped = useMemo(() => groupCommandsByCategory(commands), [commands]);

	return (
		<DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-stone-950/25 backdrop-blur-[2px] dark:bg-black/55" />
				{/* Centred by the wrapper: a translate utility here would stack with the open animation's transform. */}
				<div className="pointer-events-none fixed inset-x-0 top-[14vh] z-50 flex justify-center px-3">
				<DialogPrimitive.Content
					aria-describedby={undefined}
					className="anim-pop pointer-events-auto w-[min(640px,calc(100vw-24px))] overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-float outline-none"
				>
					<DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
					<Command
						loop
						className="flex flex-col"
						filter={(value, search, keywords) => {
							const haystack = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase();
							return search
								.toLowerCase()
								.split(/\s+/)
								.filter(Boolean)
								.every((term) => haystack.includes(term))
								? 1
								: 0;
						}}
					>
						<div className="flex items-center gap-3 border-b border-border px-4">
							<Search className="size-[18px] shrink-0 text-muted-foreground" />
							<Command.Input
								autoFocus
								placeholder="Type a command or search…"
								className="h-14 w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-subtle-foreground"
							/>
							<Kbd>ESC</Kbd>
						</div>

						<Command.List className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain p-2 transition-[height] duration-150 [&_[cmdk-list-sizer]]:space-y-1">
							<Command.Empty className="flex flex-col items-center gap-1 px-6 py-12 text-center">
								<span className="font-display text-xl text-foreground">Nothing found</span>
								<span className="text-[13px] text-muted-foreground">Try a different word, like “inbox” or “settings”.</span>
							</Command.Empty>
							{Object.entries(grouped).map(([category, items]) => (
								<Command.Group
									key={category}
									heading={category}
									className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-subtle-foreground"
								>
									{items.map((item) => {
										const Icon = item.icon;
										return (
											<Command.Item
												key={item.id}
												value={`${item.title} ${item.id}`}
												keywords={[item.category, item.subtitle ?? "", ...(item.keywords ?? [])]}
												onSelect={() => {
													item.perform();
													onClose();
												}}
												className="group flex h-10 cursor-default select-none items-center gap-3 rounded-lg px-2.5 text-[13.5px] text-foreground outline-none transition-colors data-[selected=true]:bg-accent"
											>
												{Icon && (
													<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-inset ring-border transition-colors group-data-[selected=true]:bg-primary group-data-[selected=true]:text-primary-foreground group-data-[selected=true]:ring-primary">
														<Icon className="size-3.5" />
													</span>
												)}
												<span className="min-w-0 truncate font-medium">{item.title}</span>
												{item.subtitle && (
													<span className="hidden min-w-0 truncate text-muted-foreground sm:inline">{item.subtitle}</span>
												)}
												{item.shortcut && <ShortcutKeys shortcut={item.shortcut} />}
											</Command.Item>
										);
									})}
								</Command.Group>
							))}
						</Command.List>

						<div className="flex items-center justify-between border-t border-border bg-elevated/70 px-4 py-2.5 text-xs text-muted-foreground">
							<div className="flex items-center gap-4">
								<span className="flex items-center gap-1.5">
									<Kbd>↑</Kbd>
									<Kbd>↓</Kbd>
									navigate
								</span>
								<span className="flex items-center gap-1.5">
									<Kbd>
										<CornerDownLeft className="size-3" />
									</Kbd>
									select
								</span>
							</div>
							<span className="font-display text-[13px] italic text-subtle-foreground">postbox</span>
						</div>
					</Command>
				</DialogPrimitive.Content>
				</div>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
