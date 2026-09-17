"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Segmented } from "@/components/ui/segmented";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

/** Compact icon toggle between light and dark, with the icon rotating through. */
export function ThemeToggle({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const isDark = resolvedTheme === "dark";

	return (
		<Tooltip label={isDark ? "Light mode" : "Dark mode"}>
			<button
				type="button"
				onClick={() => setTheme(isDark ? "light" : "dark")}
				className={cn(
					"relative flex size-8 items-center justify-center overflow-hidden rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
					className,
				)}
				aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.span
						key={isDark ? "sun" : "moon"}
						initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
						animate={{ rotate: 0, opacity: 1, scale: 1 }}
						exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
						className="flex"
					>
						{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
					</motion.span>
				</AnimatePresence>
			</button>
		</Tooltip>
	);
}

/** Three-way appearance picker for menus and settings. */
export function ThemeSegmented({ className }: { className?: string }) {
	const { theme, setTheme } = useTheme();
	return (
		<Segmented
			size="sm"
			className={className}
			value={theme}
			onChange={setTheme}
			options={[
				{ value: "light", label: <Sun />, title: "Light" },
				{ value: "dark", label: <Moon />, title: "Dark" },
				{ value: "system", label: <Monitor />, title: "System" },
			]}
		/>
	);
}
