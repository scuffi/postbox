"use client";

import { useState } from "react";
import { Archive, Clock, Mail, MailOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MessageListRowActionsProps } from "./types";
import { getSnoozePresets, isMessageSnoozed, snoozeMessage, unsnoozeMessage } from "./message-list-row-actions-utils";

const actionButton =
	"flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-[15px]";

export function MessageListRowActions({ message, onAction }: MessageListRowActionsProps) {
	const [snoozeOpen, setSnoozeOpen] = useState(false);
	const [snoozedUntil, setSnoozedUntil] = useState(() => getSnoozePresets()[0].value);
	const [snoozing, setSnoozing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const snoozePresets = getSnoozePresets();
	const snoozed = isMessageSnoozed(message.snoozedUntil);
	const readAction = message.read ? "unread" : "read";

	async function handleSnooze() {
		setSnoozing(true);
		setError(null);
		try {
			await snoozeMessage(message.id, snoozedUntil);
			setSnoozeOpen(false);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Unable to snooze message");
		} finally {
			setSnoozing(false);
		}
	}

	return (
		<>
			<div className="pointer-events-none absolute right-2.5 top-1/2 z-10 flex -translate-y-1/2 translate-x-1 items-center gap-0.5 rounded-xl bg-popover p-0.5 opacity-0 shadow-[0_0_0_1px_var(--border),0_4px_12px_-2px_rgb(0_0_0/0.12)] transition-[opacity,transform] duration-150 ease-out group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
				<Tooltip label="Archive" shortcut="E">
					<button type="button" className={actionButton} onClick={() => void onAction("archive")} aria-label="Archive">
						<Archive />
					</button>
				</Tooltip>
				<Tooltip label="Delete" shortcut="#">
					<button type="button" className={cn(actionButton, "hover:bg-destructive/10 hover:text-destructive")} onClick={() => void onAction("trash")} aria-label="Trash">
						<Trash2 />
					</button>
				</Tooltip>
				<Tooltip label={readAction === "read" ? "Mark as read" : "Mark as unread"}>
					<button type="button" className={actionButton} onClick={() => void onAction(readAction)} aria-label={readAction === "read" ? "Mark as read" : "Mark as unread"}>
						{readAction === "read" ? <MailOpen /> : <Mail />}
					</button>
				</Tooltip>
				<Tooltip label={snoozed ? "Unsnooze" : "Snooze"}>
					<button
						type="button"
						className={actionButton}
						onClick={() => {
							if (snoozed) {
								void unsnoozeMessage(message.id);
								return;
							}
							setSnoozeOpen(true);
						}}
						aria-label={snoozed ? "Unsnooze" : "Snooze"}
					>
						<Clock />
					</button>
				</Tooltip>
			</div>

			<Dialog open={snoozeOpen} onOpenChange={setSnoozeOpen}>
				<DialogContent className="w-[min(420px,calc(100vw-32px))]">
					<DialogHeader>
						<DialogTitle>Snooze</DialogTitle>
						<DialogDescription>Hide this email from your inbox until the time you choose.</DialogDescription>
					</DialogHeader>
					<div className="space-y-5">
						<div className="grid grid-cols-3 gap-2">
							{snoozePresets.map((preset) => {
								const selected = snoozedUntil === preset.value;
								return (
									<button
										key={preset.label}
										type="button"
										onClick={() => setSnoozedUntil(preset.value)}
										className={cn(
											"flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-[13px] font-medium ring-1 ring-inset transition-all",
											selected
												? "bg-primary-soft text-primary-soft-foreground ring-primary/40"
												: "bg-card text-foreground ring-border hover:bg-accent",
										)}
									>
										<Clock className="size-4 opacity-70" />
										{preset.label}
									</button>
								);
							})}
						</div>
						<div className="space-y-2">
							<Label htmlFor={`snooze-until-${message.id}`}>Or pick a date and time</Label>
							<Input id={`snooze-until-${message.id}`} type="datetime-local" value={snoozedUntil} onChange={(event) => setSnoozedUntil(event.target.value)} />
						</div>
						{error && <p className="text-[13px] text-destructive">{error}</p>}
					</div>
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => setSnoozeOpen(false)}>
							Cancel
						</Button>
						<Button type="button" onClick={() => void handleSnooze()} disabled={snoozing}>
							{snoozing ? "Snoozing…" : "Snooze"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
