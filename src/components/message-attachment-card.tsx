"use client";

import { ArrowDownToLine, Play } from "lucide-react";
import { formatAttachmentSize } from "@/app/(dashboard)/inbox/[messageId]/utils";
import type { MessageAttachmentCardProps } from "./message-attachment-card-types";
import { getAttachmentFileUrl } from "./message-attachment-viewer-utils";
import { getAttachmentVisual } from "./message-attachment-card-utils";

export function MessageAttachmentCard({
	attachment,
	messageId,
	onPreview,
}: MessageAttachmentCardProps) {
	const visual = getAttachmentVisual(attachment);
	const Icon = visual.icon;
	const previewUrl = getAttachmentFileUrl(messageId, attachment.id, "preview");

	return (
		<button
			type="button"
			onClick={() => onPreview(attachment)}
			className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2 text-left transition-all duration-200 hover:-translate-y-px hover:border-border-strong hover:shadow-panel"
		>
			{visual.thumbnail === "image" && (
				<img
					src={previewUrl}
					alt=""
					loading="lazy"
					className="size-12 shrink-0 rounded-lg bg-muted object-cover ring-1 ring-inset ring-black/5"
				/>
			)}
			{visual.thumbnail === "video" && (
				<span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
					<video
						src={previewUrl}
						muted
						preload="metadata"
						playsInline
						className="h-full w-full object-cover"
					/>
					<span className="absolute inset-0 flex items-center justify-center bg-neutral-950/20">
						<Play className="h-5 w-5 fill-white text-white" />
					</span>
				</span>
			)}
			{visual.thumbnail === null && (
				<span className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${visual.iconClassName}`}>
					<Icon className="size-5" />
				</span>
			)}
			<span className="min-w-0 flex-1 text-left">
				<span className="block truncate text-[13px] font-medium text-foreground">
					{attachment.filename}
				</span>
				<span className="mt-0.5 block truncate text-xs text-muted-foreground">
					{visual.label} · {formatAttachmentSize(attachment.size)}
				</span>
			</span>
			<span className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-subtle-foreground transition-colors group-hover:bg-accent group-hover:text-foreground">
				<ArrowDownToLine className="size-4" />
			</span>
		</button>
	);
}
