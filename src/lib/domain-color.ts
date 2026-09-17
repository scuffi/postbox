export type DomainColor = {
	/** Solid dot / avatar class (e.g. `bg-emerald-500`). */
	dot: string;
	/** Text color for labels (e.g. `text-emerald-600 dark:text-emerald-400`). */
	text: string;
	/** Soft tinted surface (e.g. `bg-emerald-500/10`). */
	soft: string;
	/** Solid surface (e.g. `bg-emerald-500`). */
	solid: string;
};

/*
 * A curated, flat palette for colour-coordinating inboxes. Deliberately avoids
 * the app's postbox-red accent and gradients — one hue per domain, assigned
 * deterministically from the hostname so it stays stable across sessions.
 */
const PALETTE: DomainColor[] = [
	{ dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", soft: "bg-amber-500/10", solid: "bg-amber-500" },
	{ dot: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", soft: "bg-orange-500/10", solid: "bg-orange-500" },
	{ dot: "bg-lime-500", text: "text-lime-600 dark:text-lime-400", soft: "bg-lime-500/10", solid: "bg-lime-500" },
	{ dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", soft: "bg-emerald-500/10", solid: "bg-emerald-500" },
	{ dot: "bg-teal-500", text: "text-teal-600 dark:text-teal-400", soft: "bg-teal-500/10", solid: "bg-teal-500" },
	{ dot: "bg-cyan-500", text: "text-cyan-600 dark:text-cyan-400", soft: "bg-cyan-500/10", solid: "bg-cyan-500" },
	{ dot: "bg-sky-500", text: "text-sky-600 dark:text-sky-400", soft: "bg-sky-500/10", solid: "bg-sky-500" },
	{ dot: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", soft: "bg-indigo-500/10", solid: "bg-indigo-500" },
	{ dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", soft: "bg-violet-500/10", solid: "bg-violet-500" },
	{ dot: "bg-fuchsia-500", text: "text-fuchsia-600 dark:text-fuchsia-400", soft: "bg-fuchsia-500/10", solid: "bg-fuchsia-500" },
];

export function domainColor(key: string): DomainColor {
	let hash = 0;
	for (let index = 0; index < key.length; index += 1) {
		hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
	}
	return PALETTE[hash % PALETTE.length];
}