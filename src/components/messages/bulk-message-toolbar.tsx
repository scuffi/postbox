"use client";

import { Archive, ChevronDown, FolderInput, Mail, MailOpen, ShieldAlert, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BulkMessageToolbarProps } from "./types";

const toolButton =
	"flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4";

export function BulkMessageToolbar({
	selectedCount,
	hasUnreadSelection,
	hideSelectedCount = false,
	onAction,
	onClearSelection,
	pending,
}: BulkMessageToolbarProps) {
	return (
		<div className="flex min-w-0 items-center gap-0.5">
			{!hideSelectedCount && (
				<span className="mr-1.5 flex h-8 items-center gap-2 rounded-lg bg-foreground px-2.5 text-[13px] font-medium text-background">
					<AnimatePresence mode="popLayout" initial={false}>
						<motion.span
							key={selectedCount}
							initial={{ y: 8, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -8, opacity: 0 }}
							className="tabular-nums"
						>
							{selectedCount}
						</motion.span>
					</AnimatePresence>
					selected
				</span>
			)}
			<Tooltip label="Archive">
				<button type="button" className={toolButton} onClick={() => onAction("archive")} disabled={pending} aria-label="Archive">
					<Archive />
					<span className="hidden sm:inline">Archive</span>
				</button>
			</Tooltip>
			<Tooltip label={hasUnreadSelection ? "Mark as read" : "Mark as unread"}>
				<button
					type="button"
					className={toolButton}
					onClick={() => onAction(hasUnreadSelection ? "read" : "unread")}
					disabled={pending}
					aria-label={hasUnreadSelection ? "Mark as read" : "Mark as unread"}
				>
					{hasUnreadSelection ? <MailOpen /> : <Mail />}
				</button>
			</Tooltip>
			<Tooltip label="Report spam">
				<button type="button" className={toolButton} onClick={() => onAction("spam")} disabled={pending} aria-label="Report spam">
					<ShieldAlert />
				</button>
			</Tooltip>
			<Tooltip label="Delete">
				<button
					type="button"
					className={cn(toolButton, "hover:bg-destructive/10 hover:text-destructive")}
					onClick={() => onAction("trash")}
					disabled={pending}
					aria-label="Delete"
				>
					<Trash2 />
				</button>
			</Tooltip>
			<span className="mx-1 h-5 w-px bg-border" />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button type="button" className={toolButton} disabled={pending} aria-label="Move selected messages">
						<FolderInput />
						Move
						<ChevronDown className="!size-3.5 opacity-60" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" side="top" className="min-w-[10rem]">
					<DropdownMenuItem onSelect={() => onAction("archive")}>
						<Archive />
						Archived
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={() => onAction("spam")}>
						<ShieldAlert />
						Spam
					</DropdownMenuItem>
					<DropdownMenuItem destructive onSelect={() => onAction("trash")}>
						<Trash2 />
						Trash
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<Tooltip label="Clear selection" shortcut="Esc">
				<button type="button" className={toolButton} onClick={onClearSelection} disabled={pending} aria-label="Clear selection">
					<X />
				</button>
			</Tooltip>
		</div>
	);
}
