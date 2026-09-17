"use client";

import { ComposeForm } from "@/components/compose/compose-form";
import { useCompose } from "@/components/compose/compose-context";
import { AnimatePresence, motion } from "motion/react";

export function FloatingComposer() {
	const { open, draftId, closeComposer } = useCompose();
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					key={draftId ?? "new"}
					className="fixed bottom-0 right-0 z-40 sm:bottom-4 sm:right-4"
					initial={{ opacity: 0, y: 40, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.16, ease: "easeIn" } }}
					transition={{ type: "spring", stiffness: 380, damping: 32 }}
					style={{ transformOrigin: "bottom right" }}
				>
					<ComposeForm key={draftId ?? "new"} mode="popup" draftIdToLoad={draftId} onClose={closeComposer} />
				</motion.div>
			)}
		</AnimatePresence>
	);
}
