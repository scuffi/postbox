"use client";

import { ComposeForm } from "@/components/compose/compose-form";
import { useCompose } from "@/components/compose/compose-context";
import { AnimatePresence, motion } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";

export function FloatingComposer() {
	const { open, draftId, closeComposer } = useCompose();
	// Phones get a full-screen sheet that slides up; larger screens keep the floating window.
	const sheet = !useMediaQuery("(min-width: 640px)");
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					key={draftId ?? "new"}
					className="fixed inset-0 z-50 sm:inset-auto sm:bottom-4 sm:right-4 sm:z-40"
					initial={sheet ? { y: "100%" } : { opacity: 0, y: 40, scale: 0.97 }}
					animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
					exit={
						sheet
							? { y: "100%", transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } }
							: { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.16, ease: "easeIn" } }
					}
					transition={sheet ? { type: "spring", stiffness: 420, damping: 40 } : { type: "spring", stiffness: 380, damping: 32 }}
					style={{ transformOrigin: "bottom right" }}
				>
					<ComposeForm key={draftId ?? "new"} mode="popup" draftIdToLoad={draftId} onClose={closeComposer} />
				</motion.div>
			)}
		</AnimatePresence>
	);
}
