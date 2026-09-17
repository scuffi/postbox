import {
	FileArchive,
	FileCode,
	FileSpreadsheet,
	FileText,
	FileType,
	FileVideoCamera,
	Image,
	Music,
	Presentation,
} from "lucide-react";
import type { MessageAttachment } from "@/app/(dashboard)/inbox/[messageId]/types";
import type { AttachmentVisual } from "./message-attachment-card-types";
import { getAttachmentPreviewKind } from "./message-attachment-viewer-utils";

export function getAttachmentVisual(
	attachment: Pick<MessageAttachment, "filename" | "type">,
): AttachmentVisual {
	const type = attachment.type.toLowerCase();
	const filename = attachment.filename.toLowerCase();
	const previewKind = getAttachmentPreviewKind(attachment);

	if (previewKind === "image") {
		return {
			icon: Image,
			iconClassName: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
			label: "Image",
			thumbnail: "image",
		};
	}
	if (previewKind === "video") {
		return {
			icon: FileVideoCamera,
			iconClassName: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
			label: "Video",
			thumbnail: "video",
		};
	}
	if (previewKind === "audio") {
		return {
			icon: Music,
			iconClassName: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
			label: "Audio",
			thumbnail: null,
		};
	}
	if (previewKind === "pdf") {
		return {
			icon: FileText,
			iconClassName: "bg-red-500/10 text-red-700 dark:text-red-300",
			label: "PDF",
			thumbnail: null,
		};
	}
	if (
		type.includes("spreadsheet") ||
		type.includes("excel") ||
		type === "text/csv" ||
		/\.(csv|xls|xlsx|ods)$/.test(filename)
	) {
		return {
			icon: FileSpreadsheet,
			iconClassName: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
			label: "Spreadsheet",
			thumbnail: null,
		};
	}
	if (
		type.includes("presentation") ||
		type.includes("powerpoint") ||
		/\.(ppt|pptx|odp)$/.test(filename)
	) {
		return {
			icon: Presentation,
			iconClassName: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
			label: "Presentation",
			thumbnail: null,
		};
	}
	if (
		type.includes("zip") ||
		type.includes("compressed") ||
		type.includes("archive") ||
		/\.(zip|rar|7z|tar|gz|bz2)$/.test(filename)
	) {
		return {
			icon: FileArchive,
			iconClassName: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
			label: "Archive",
			thumbnail: null,
		};
	}
	if (
		type.includes("json") ||
		type.includes("xml") ||
		type.includes("javascript") ||
		type.includes("typescript") ||
		/\.(js|jsx|ts|tsx|json|xml|html|css|md|yml|yaml)$/.test(filename)
	) {
		return {
			icon: FileCode,
			iconClassName: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
			label: "Code",
			thumbnail: null,
		};
	}
	if (previewKind === "text" || type.includes("word") || /\.(doc|docx|odt|rtf|txt)$/.test(filename)) {
		return {
			icon: FileType,
			iconClassName: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
			label: "Document",
			thumbnail: null,
		};
	}

	return {
		icon: FileText,
		iconClassName: "bg-muted text-muted-foreground",
		label: "File",
		thumbnail: null,
	};
}
