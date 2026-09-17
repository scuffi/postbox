"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { SidebarProviderProps, SidebarState } from "./sidebar-state-types";

const SidebarContext = createContext<SidebarState>({
	minimal: false,
	toggle: () => undefined,
	mobileOpen: false,
	setMobileOpen: () => undefined,
});

export const SIDEBAR_MINIMAL_WIDTH = 64;

export function SidebarProvider({ children, expandedWidth = 256 }: SidebarProviderProps) {
	const pathname = usePathname();
	const [minimal, setMinimal] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [storageKey, setStorageKey] = useState<string | null>(null);

	useEffect(() => {
		// The sidebar preference is cosmetic, so every failure here degrades to the default.
		// Guard the parse: an error response may carry an empty or non-JSON body, and an
		// unhandled rejection here surfaces as a confusing SyntaxError overlay in dev.
		void fetch("/api/auth/me", { cache: "no-store" })
			.then(async (response) => {
				if (!response.ok) return null;
				return (await response.json().catch(() => null)) as { user?: { id?: string } } | null;
			})
			.then((data) => {
				const userId = data?.user?.id;
				if (!userId) return;
				const key = `mailflare-sidebar-minimal:${userId}`;
				setStorageKey(key);
				try {
					setMinimal(localStorage.getItem(key) === "true");
				} catch {
					// Storage can be unavailable in private windows; keep the default.
				}
			})
			.catch(() => undefined);
	}, []);

	// Close the mobile drawer whenever navigation happens.
	const [drawerPathname, setDrawerPathname] = useState(pathname);
	if (drawerPathname !== pathname) {
		setDrawerPathname(pathname);
		setMobileOpen(false);
	}

	function toggle() {
		setMinimal((current) => {
			const next = !current;
			try {
				if (storageKey) localStorage.setItem(storageKey, String(next));
			} catch {
				// Cosmetic preference only.
			}
			return next;
		});
	}

	return (
		<SidebarContext.Provider value={{ minimal, toggle, mobileOpen, setMobileOpen }}>
			<div
				className="h-full"
				style={{ "--sidebar-width": `${minimal ? SIDEBAR_MINIMAL_WIDTH : expandedWidth}px` } as React.CSSProperties}
			>
				{children}
			</div>
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	return useContext(SidebarContext);
}

/** Inside the mobile drawer the sidebar always renders expanded. */
export function ExpandedSidebarScope({ children }: { children: React.ReactNode }) {
	const state = useSidebar();
	return <SidebarContext.Provider value={{ ...state, minimal: false }}>{children}</SidebarContext.Provider>;
}
