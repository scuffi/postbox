import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const displaySerif = Instrument_Serif({
	variable: "--font-display-serif",
	subsets: ["latin"],
	weight: "400",
	style: ["normal", "italic"],
});

export const metadata: Metadata = {
	title: "postbox",
	description: "Self-hosted email for every domain you own",
	icons: { icon: "/api/branding/icon" },
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f3f1ee" },
		{ media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
	],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("postbox-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
				<link rel="icon" href="/api/branding/icon"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
