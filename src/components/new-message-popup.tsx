"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { PostboxGlyph } from "@/components/brand/postbox-mark";
import { getEmailDisplayName } from "@/lib/email/address";
import type { NewMessagePopupProps } from "./new-message-popup-types";

export function NewMessagePopup({ notification, onDismiss }: NewMessagePopupProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -16, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } }}
			transition={{ type: "spring", stiffness: 420, damping: 32 }}
			className="group fixed right-4 top-4 z-[100] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl bg-popover shadow-float"
		>
			<div className="flex items-start gap-3 p-3.5">
				<motion.div
					initial={{ rotate: -12, scale: 0.8 }}
					animate={{ rotate: 0, scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
				>
					<PostboxGlyph className="size-10" />
				</motion.div>
				<Link href={`/inbox/${notification.messageId}`} onClick={onDismiss} className="min-w-0 flex-1 pt-0.5">
					<p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.06em] text-primary">
						<span className="relative flex size-1.5">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
							<span className="relative inline-flex size-1.5 rounded-full bg-primary" />
						</span>
						New mail
					</p>
					<p className="mt-1 truncate text-sm font-semibold text-foreground">
						{notification.fromName ?? getEmailDisplayName(notification.from)}
					</p>
					<p className="truncate text-[13px] text-muted-foreground">{notification.subject || "(no subject)"}</p>
				</Link>
				<button
					type="button"
					onClick={onDismiss}
					className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					<X className="size-4" />
					<span className="sr-only">Dismiss notification</span>
				</button>
			</div>
			<motion.div
				className="h-0.5 origin-left bg-primary/70"
				initial={{ scaleX: 1 }}
				animate={{ scaleX: 0 }}
				transition={{ duration: 8, ease: "linear" }}
			/>
		</motion.div>
	);
}
