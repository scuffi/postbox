"use client";

import { useEffect, useState } from "react";

export type VisualViewportBox = {
	height: number;
	offsetTop: number;
	/** The on-screen keyboard (or another inset) is covering part of the layout viewport. */
	keyboardOpen: boolean;
};

/**
 * Tracks the part of the page actually visible on a phone, which shrinks when the
 * on-screen keyboard opens even though `100dvh` does not. Returns null until measured,
 * or when the browser has no `visualViewport`.
 */
export function useVisualViewport(enabled = true): VisualViewportBox | null {
	const [box, setBox] = useState<VisualViewportBox | null>(null);

	useEffect(() => {
		const viewport = window.visualViewport;
		if (!enabled || !viewport) return;
		function update() {
			setBox({
				height: viewport!.height,
				offsetTop: viewport!.offsetTop,
				keyboardOpen: window.innerHeight - viewport!.height > 120,
			});
		}
		update();
		viewport.addEventListener("resize", update);
		viewport.addEventListener("scroll", update);
		return () => {
			viewport.removeEventListener("resize", update);
			viewport.removeEventListener("scroll", update);
		};
	}, [enabled]);

	return enabled ? box : null;
}
