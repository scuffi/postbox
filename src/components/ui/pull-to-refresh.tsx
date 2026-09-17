"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { RotateCw } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { PullToRefreshProps } from "./pull-to-refresh-types";

/** Past this many pixels of (resisted) pull, releasing refreshes. */
const THRESHOLD = 64;
/** Where the content rests while the refresh runs. */
const HOLD = 52;
/** The pull approaches, but never reaches, this distance. */
const MAX_PULL = 140;
/** Keeps a fast refresh from flashing the spinner. */
const MIN_SPIN_MS = 500;

const settle = { type: "spring", stiffness: 420, damping: 38 } as const;

/**
 * Native-style pull-down refresh for touch screens. It renders the scroll container itself
 * so it can tell when the list is at the top; on pointer devices it is a plain container.
 */
export function PullToRefresh({ onRefresh, disabled = false, className, children }: PullToRefreshProps) {
	const touch = useMediaQuery("(pointer: coarse)");
	const scrollRef = useRef<HTMLDivElement>(null);
	const pull = useMotionValue(0);
	const [armed, setArmed] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const onRefreshRef = useRef(onRefresh);
	const blockedRef = useRef(disabled);

	useEffect(() => {
		onRefreshRef.current = onRefresh;
		blockedRef.current = disabled || refreshing;
	});

	const indicatorY = useTransform(pull, (value) => value - 44);
	const indicatorOpacity = useTransform(pull, [0, 28], [0, 1]);
	const iconRotate = useTransform(pull, (value) => value * 3);

	useEffect(() => {
		const el = scrollRef.current;
		if (!touch || !el) return;
		let mounted = true;
		let tracking = false;
		let pulling = false;
		let armedNow = false;
		let startX = 0;
		let startY = 0;

		function onTouchStart(event: TouchEvent) {
			tracking = !blockedRef.current && el!.scrollTop <= 0 && event.touches.length === 1;
			pulling = false;
			startX = event.touches[0].clientX;
			startY = event.touches[0].clientY;
		}

		function onTouchMove(event: TouchEvent) {
			if (!tracking) return;
			const dx = event.touches[0].clientX - startX;
			const dy = event.touches[0].clientY - startY;
			if (!pulling) {
				if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
				// Horizontal movement belongs to row swipes, upward movement to scrolling.
				if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || el!.scrollTop > 0) {
					tracking = false;
					return;
				}
				pulling = true;
			}
			// Take over from the browser's own overscroll bounce while pulling.
			if (event.cancelable) event.preventDefault();
			const distance = Math.max(0, MAX_PULL * (1 - 1 / (dy / MAX_PULL + 1)));
			pull.set(distance);
			const nextArmed = distance >= THRESHOLD;
			if (nextArmed !== armedNow) {
				armedNow = nextArmed;
				setArmed(nextArmed);
				if (nextArmed) navigator.vibrate?.(8);
			}
		}

		async function onTouchEnd() {
			if (!pulling) {
				tracking = false;
				return;
			}
			tracking = false;
			pulling = false;
			const release = armedNow;
			armedNow = false;
			setArmed(false);
			if (!release) {
				void animate(pull, 0, settle);
				return;
			}
			setRefreshing(true);
			void animate(pull, HOLD, settle);
			try {
				await Promise.all([
					onRefreshRef.current(),
					new Promise((resolve) => window.setTimeout(resolve, MIN_SPIN_MS)),
				]);
			} catch {
				// The list keeps its current contents; the gesture just ends.
			} finally {
				if (mounted) {
					setRefreshing(false);
					void animate(pull, 0, settle);
				}
			}
		}

		el.addEventListener("touchstart", onTouchStart, { passive: true });
		el.addEventListener("touchmove", onTouchMove, { passive: false });
		el.addEventListener("touchend", onTouchEnd);
		el.addEventListener("touchcancel", onTouchEnd);
		return () => {
			mounted = false;
			el.removeEventListener("touchstart", onTouchStart);
			el.removeEventListener("touchmove", onTouchMove);
			el.removeEventListener("touchend", onTouchEnd);
			el.removeEventListener("touchcancel", onTouchEnd);
		};
	}, [touch, pull]);

	if (!touch) {
		return <div ref={scrollRef} className={className}>{children}</div>;
	}

	return (
		<div ref={scrollRef} className={cn("relative", className)} aria-busy={refreshing || undefined}>
			<motion.div
				aria-hidden
				style={{ y: indicatorY, opacity: indicatorOpacity }}
				className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
			>
				<span
					className={cn(
						"flex size-9 items-center justify-center rounded-full bg-popover shadow-float transition-colors",
						armed || refreshing ? "text-primary" : "text-muted-foreground",
					)}
				>
					<motion.span style={{ rotate: refreshing ? 0 : iconRotate }} className="flex">
						<RotateCw className={cn("size-4", refreshing && "animate-spin")} strokeWidth={2.2} />
					</motion.span>
				</span>
			</motion.div>
			<motion.div style={{ y: pull }}>{children}</motion.div>
		</div>
	);
}
