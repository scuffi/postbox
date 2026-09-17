"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Kbd } from "@/components/ui/kbd";
import { useMailSearch } from "./mail-search-context";
import { useShortcuts } from "@/components/shortcuts";

export function MailSearchInput() {
	const { input: query, setQuery } = useMailSearch();
	const { openCommandPalette, shortcutsEnabled, shortcutsPreferenceLoading } = useShortcuts();
	const showShortcutHints = shortcutsEnabled && !shortcutsPreferenceLoading;

	return (
		<div className="group relative flex h-10 w-full max-w-xl items-center gap-2 rounded-full lg:h-9 lg:rounded-xl bg-foreground/[0.045] px-3 text-muted-foreground ring-1 ring-transparent transition-[background-color,box-shadow] duration-200 hover:bg-foreground/[0.065] focus-within:bg-card focus-within:shadow-panel focus-within:ring-ring/25 dark:focus-within:bg-elevated">
			<Search className="size-4 shrink-0 transition-colors group-focus-within:text-foreground" />
			<input
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder="Search mail"
				className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
			/>
			<AnimatePresence mode="popLayout" initial={false}>
				{query ? (
					<motion.button
						key="clear"
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						type="button"
						onClick={() => setQuery("")}
						className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
						aria-label="Clear search"
					>
						<X className="size-3.5" />
					</motion.button>
				) : showShortcutHints ? (
					<motion.span
						key="hints"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="hidden items-center gap-1 sm:flex"
					>
						<Kbd className="bg-transparent">/</Kbd>
					</motion.span>
				) : null}
			</AnimatePresence>
			{showShortcutHints && (
				<button
					type="button"
					onClick={openCommandPalette}
					className="hidden h-6 items-center gap-1 rounded-md border border-border-strong bg-card px-1.5 font-mono text-[10.5px] font-medium text-muted-foreground shadow-[0_1px_0_var(--border-strong)] transition-colors hover:text-foreground md:flex dark:bg-elevated"
					title="Open command palette"
				>
					⌘K
				</button>
			)}
		</div>
	);
}
