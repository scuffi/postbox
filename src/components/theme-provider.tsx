"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "postbox-theme";

type ThemeContextValue = {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(theme: Theme): ResolvedTheme {
	return theme === "system" ? getSystemTheme() : theme;
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
}: {
	children: React.ReactNode;
	defaultTheme?: Theme;
}) {
	const [theme, setThemeState] = useState<Theme>(defaultTheme);
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
		if (stored === "light" || stored === "dark" || stored === "system") {
			setThemeState(stored);
		}
	}, []);

	useEffect(() => {
		setResolvedTheme(resolve(theme));
	}, [theme]);

	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle("dark", resolvedTheme === "dark");
	}, [resolvedTheme]);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			if (theme === "system") setResolvedTheme(media.matches ? "dark" : "light");
		};
		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [theme]);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		localStorage.setItem(STORAGE_KEY, next);
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}