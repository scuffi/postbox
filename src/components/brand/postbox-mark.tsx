"use client";

import { useId, useState } from "react";
import { useBranding } from "@/components/branding-provider";
import { cn } from "@/lib/utils";

/** The pillar-box glyph on a red enamel tile. */
export function PostboxGlyph({ className }: { className?: string }) {
	const id = useId().replace(/:/g, "");
	return (
		<svg viewBox="0 0 32 32" className={className} aria-hidden="true">
			<defs>
				<linearGradient id={`tile-${id}`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#ee3a43" />
					<stop offset="1" stopColor="#c0141d" />
				</linearGradient>
				<linearGradient id={`sheen-${id}`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#fff" stopOpacity="0.28" />
					<stop offset="0.5" stopColor="#fff" stopOpacity="0" />
				</linearGradient>
			</defs>
			<rect width="32" height="32" rx="9" fill={`url(#tile-${id})`} />
			<rect width="32" height="32" rx="9" fill={`url(#sheen-${id})`} />
			<rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#000" strokeOpacity="0.12" />
			<g fill="#fff">
				<path d="M10.5 11.2c0-3.3 2.5-5.4 5.5-5.4s5.5 2.1 5.5 5.4z" />
				<rect x="9.2" y="11" width="13.6" height="2.2" rx="1.1" />
				<rect x="10.6" y="13" width="10.8" height="11.2" />
				<rect x="9.2" y="23.6" width="13.6" height="2.8" rx="1.2" />
			</g>
			<rect x="12.8" y="15.2" width="6.4" height="1.5" rx="0.75" fill="#b3141d" />
			<circle cx="16" cy="19.9" r="1.55" fill="#e0b25a" />
		</svg>
	);
}

/** Brand mark: the org's custom icon when licensed branding sets one, otherwise the postbox glyph. */
export function BrandMark({ className }: { className?: string }) {
	const branding = useBranding();
	const [failed, setFailed] = useState(false);

	if (branding.hasCustomIcon && !failed) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={branding.iconUrl}
				alt=""
				onError={() => setFailed(true)}
				className={cn("size-7 rounded-lg object-contain", className)}
			/>
		);
	}

	return <PostboxGlyph className={cn("size-7 drop-shadow-[0_2px_4px_rgb(218_32_42/0.25)]", className)} />;
}

/** Wordmark lockup. */
export function BrandLockup({ className, label }: { className?: string; label?: string }) {
	const branding = useBranding();
	return (
		<span className={cn("flex min-w-0 items-center gap-2.5", className)}>
			<BrandMark />
			<span className="truncate text-[15px] font-semibold tracking-[-0.02em] text-foreground">
				{label ?? branding.appName}
			</span>
		</span>
	);
}
