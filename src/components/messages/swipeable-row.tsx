"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import type { PanInfo } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { SwipeAction } from "./swipeable-row-types";

const THRESHOLD = 88;

/**
 * Mail-app swipe gestures for touch screens: drag right for `leading`, left for `trailing`.
 * On pointer devices it renders the row untouched, so hover actions stay the desktop affordance.
 */
export function SwipeableRow({
	leading,
	trailing,
	className,
	children,
}: {
	leading?: SwipeAction;
	trailing?: SwipeAction;
	className?: string;
	children: ReactNode;
}) {
	const touch = useMediaQuery("(pointer: coarse)");
	const x = useMotionValue(0);
	const [direction, setDirection] = useState<"leading" | "trailing" | null>(null);
	const [armed, setArmed] = useState(false);
	const dragged = useRef(false);
	const mounted = useRef(true);
	const leadingOpacity = useTransform(x, [0, 32], [0, 1]);
	const trailingOpacity = useTransform(x, [-32, 0], [1, 0]);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	if (!touch || (!leading && !trailing)) return <div className={className}>{children}</div>;

	const action = direction === "leading" ? leading : direction === "trailing" ? trailing : undefined;
	const Icon = action?.icon;

	async function onDragEnd(_: unknown, info: PanInfo) {
		const offset = info.offset.x;
		const chosen = offset > THRESHOLD ? leading : offset < -THRESHOLD ? trailing : undefined;
		setArmed(false);
		if (!chosen) {
			void animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
			return;
		}
		navigator.vibrate?.(8);
		if (chosen.dismiss) {
			await animate(x, Math.sign(offset) * window.innerWidth, { duration: 0.22, ease: [0.4, 0, 1, 1] });
			try {
				await chosen.onTrigger();
			} finally {
				// The list normally drops the row after a change; bring it back if it is still here.
				window.setTimeout(() => {
					if (mounted.current) void animate(x, 0, { type: "spring", stiffness: 400, damping: 36 });
				}, 1500);
			}
			return;
		}
		void animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
		await chosen.onTrigger();
	}

	return (
		<div className={cn("relative overflow-hidden", className)}>
			{action && Icon && (
				<motion.div
					aria-hidden
					style={{ opacity: direction === "leading" ? leadingOpacity : trailingOpacity }}
					className={cn(
						"absolute inset-0 flex items-center rounded-[inherit] px-6 text-white",
						direction === "trailing" && "justify-end",
						action.className,
					)}
				>
					<motion.span
						animate={{ scale: armed ? 1.15 : 0.85, opacity: armed ? 1 : 0.7 }}
						transition={{ type: "spring", stiffness: 600, damping: 26 }}
						className="flex flex-col items-center gap-1 text-[11px] font-semibold"
					>
						<Icon className="size-5" strokeWidth={2.2} />
						{action.label}
					</motion.span>
				</motion.div>
			)}
			<motion.div
				drag="x"
				dragDirectionLock
				dragConstraints={{ left: trailing ? -window.innerWidth : 0, right: leading ? window.innerWidth : 0 }}
				dragElastic={0.12}
				dragMomentum={false}
				style={{ x, touchAction: "pan-y" }}
				onDragStart={() => {
					dragged.current = true;
				}}
				onDrag={(_, info) => {
					const next = info.offset.x > 0 ? "leading" : info.offset.x < 0 ? "trailing" : null;
					if (next !== direction) setDirection(next);
					const nextArmed = Math.abs(info.offset.x) > THRESHOLD;
					if (nextArmed !== armed) {
						setArmed(nextArmed);
						if (nextArmed) navigator.vibrate?.(4);
					}
				}}
				onDragEnd={onDragEnd}
				onClickCapture={(event: MouseEvent) => {
					// A drag ends with a click on the row's link; swallow it so swiping never opens the message.
					if (!dragged.current) return;
					dragged.current = false;
					event.preventDefault();
					event.stopPropagation();
				}}
				onPointerDown={() => {
					dragged.current = false;
				}}
				className="relative bg-card"
			>
				{children}
			</motion.div>
		</div>
	);
}
