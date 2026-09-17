"use client";

import { ComposeForm } from "@/components/compose/compose-form";
import { useCompose } from "@/components/compose/compose-context";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useVisualViewport } from "@/hooks/use-visual-viewport";

/** Dragging the sheet's header this far down (or flicking it) dismisses the composer. */
const DISMISS_OFFSET = 120;
const DISMISS_VELOCITY = 600;

export function FloatingComposer() {
	const { open, draftId, closeComposer } = useCompose();
	// Phones get a full-screen sheet that slides up; larger screens keep the floating window.
	const sheet = !useMediaQuery("(min-width: 640px)");
	// Size the sheet to the visible area so the bottom action bar rides above the keyboard.
	const viewport = useVisualViewport(sheet && open);
	const dragControls = useDragControls();

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					key={draftId ?? "new"}
					data-keyboard={viewport?.keyboardOpen ? "open" : undefined}
					className="group/sheet fixed inset-0 z-50 sm:inset-auto sm:bottom-4 sm:right-4 sm:z-40"
					initial={sheet ? { y: "100%" } : { opacity: 0, y: 40, scale: 0.97 }}
					animate={sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
					exit={
						sheet
							? { y: "100%", transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } }
							: { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.16, ease: "easeIn" } }
					}
					transition={sheet ? { type: "spring", stiffness: 420, damping: 40 } : { type: "spring", stiffness: 380, damping: 32 }}
					style={{
						transformOrigin: "bottom right",
						...(sheet && viewport ? { top: viewport.offsetTop, height: viewport.height } : {}),
					}}
					drag={sheet ? "y" : false}
					dragControls={dragControls}
					dragListener={false}
					dragConstraints={{ top: 0, bottom: 0 }}
					dragElastic={{ top: 0, bottom: 0.9 }}
					onDragEnd={(_, info) => {
						if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) closeComposer();
					}}
				>
					<ComposeForm
						key={draftId ?? "new"}
						mode="popup"
						sheet={sheet}
						draftIdToLoad={draftId}
						onClose={closeComposer}
						onHeaderPointerDown={sheet ? (event) => dragControls.start(event) : undefined}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
