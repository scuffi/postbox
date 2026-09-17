"use client";

import { Layers } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import { BulkMessageToolbar } from "./bulk-message-toolbar";
import type { BulkMessageSelectionPaneProps } from "./types";
import { runBulkMessageAction } from "./utils";

export function BulkMessageSelectionPane({ selectedMessages, onClearSelection }: BulkMessageSelectionPaneProps) {
	const [pending, setPending] = useState(false);
	const hasUnreadSelection = selectedMessages.some((message) => !message.read);

	async function runAction(action: BulkMessageAction) {
		if (selectedMessages.length === 0) return;

		setPending(true);
		try {
			await runBulkMessageAction(
				selectedMessages.map((message) => message.id),
				action,
			);
			onClearSelection();
		} finally {
			setPending(false);
		}
	}

	const stack = Math.min(selectedMessages.length, 3);

	return (
		<div className="flex h-full items-center justify-center p-8">
			<div className="flex w-full max-w-xl flex-col items-center text-center">
				<div className="relative mb-8 h-20 w-32">
					{Array.from({ length: stack }, (_, index) => (
						<motion.div
							key={index}
							initial={{ opacity: 0, y: 12, rotate: 0 }}
							animate={{ opacity: 1, y: -index * 6, rotate: (index - (stack - 1) / 2) * 6 }}
							transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.05 }}
							className="absolute inset-0 rounded-xl bg-card shadow-panel"
							style={{ zIndex: stack - index }}
						>
							{index === 0 && (
								<div className="flex h-full flex-col justify-center gap-2 px-4">
									<div className="h-2 w-2/3 rounded-full bg-muted" />
									<div className="h-2 w-full rounded-full bg-muted" />
									<div className="h-2 w-1/2 rounded-full bg-primary/30" />
								</div>
							)}
						</motion.div>
					))}
					<span className="absolute -right-3 -top-4 z-10 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-button">
						{selectedMessages.length}
					</span>
				</div>
				<h2 className="font-display text-3xl text-foreground">{selectedMessages.length} selected</h2>
				<p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
					<Layers className="size-3.5" />
					Choose what to do with these conversations.
				</p>
				<div className="mt-6 rounded-2xl bg-popover p-1.5 shadow-float">
					<BulkMessageToolbar
						selectedCount={selectedMessages.length}
						hasUnreadSelection={hasUnreadSelection}
						onAction={runAction}
						onClearSelection={onClearSelection}
						pending={pending}
						hideSelectedCount
					/>
				</div>
			</div>
		</div>
	);
}
