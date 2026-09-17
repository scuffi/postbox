"use client";

import { useSyncExternalStore } from "react";

/** Subscribes to a CSS media query. Server renders and the first client render report `fallback`. */
export function useMediaQuery(query: string, fallback = false) {
	return useSyncExternalStore(
		(onChange) => {
			const list = window.matchMedia(query);
			list.addEventListener("change", onChange);
			return () => list.removeEventListener("change", onChange);
		},
		() => window.matchMedia(query).matches,
		() => fallback,
	);
}

/** Matches Tailwind's `lg` breakpoint, where the desktop sidebar takes over from the tab bar. */
export const DESKTOP_QUERY = "(min-width: 1024px)";
