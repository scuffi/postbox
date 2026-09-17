"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BulkMessageSelectionPane } from "./bulk-message-selection-pane";
import { MessageFolderPage } from "./message-folder-page";
import type { MessageSplitLayoutProps, SelectedMessage } from "./types";

export function MessageSplitLayout({
	children,
	config,
}: MessageSplitLayoutProps) {
	const pathname = usePathname();
	const [selectedMessages, setSelectedMessages] = useState<SelectedMessage[]>([]);
	const detailPrefix = `${config.hrefPrefix}/`;
	const selectedMessageId = pathname.startsWith(detailPrefix)
		? pathname.slice(detailPrefix.length).split("/")[0]
		: undefined;

	if (!selectedMessageId) return children;

	return (
		<div className="h-full min-h-0 overflow-hidden lg:grid lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
			<aside className="hidden min-h-0 overflow-hidden border-r border-border bg-elevated/40 lg:block">
				<MessageFolderPage
					config={config}
					compact
					selectedMessageId={selectedMessageId}
					selection={{ selectedMessages, setSelectedMessages }}
				/>
			</aside>
			<section className="min-h-0 min-w-0 overflow-hidden bg-card">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={selectedMessages.length > 0 ? "bulk" : selectedMessageId}
						initial={{ opacity: 0, x: 12 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, transition: { duration: 0.08 } }}
						transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
						className="h-full"
					>
				{selectedMessages.length > 0 ? (
					<BulkMessageSelectionPane
						selectedMessages={selectedMessages}
						onClearSelection={() => setSelectedMessages([])}
					/>
				) : (
					children
				)}
					</motion.div>
				</AnimatePresence>
			</section>
		</div>
	);
}
