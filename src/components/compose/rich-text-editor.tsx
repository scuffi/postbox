"use client";

import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import {
	Bold,
	CodeXml,
	Italic,
	Link2,
	List,
	ListOrdered,
	Quote,
	RemoveFormatting,
	Strikethrough,
	Underline,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RichTextEditorProps, ToolbarCommand } from "./rich-text-editor-types";

const COMMANDS: ToolbarCommand[] = [
	{ command: "bold", label: "Bold (⌘B)", icon: Bold },
	{ command: "italic", label: "Italic (⌘I)", icon: Italic },
	{ command: "underline", label: "Underline (⌘U)", icon: Underline },
	{ command: "strikeThrough", label: "Strikethrough", icon: Strikethrough },
	{ command: "insertUnorderedList", label: "Bulleted list", icon: List },
	{ command: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
	{ command: "formatBlock", label: "Quote", icon: Quote, value: "blockquote" },
];

/**
 * A small HTML editor built on contentEditable. It stays deliberately light:
 * inline styles, lists, quotes and links, with pasted content flattened to
 * text so a message never carries another site's markup.
 */
export function RichTextEditor({
	id,
	value,
	onChange,
	quotedHtml,
	disabled,
	placeholder,
	className,
	toolbarStart,
	toolbarEnd,
	toolbarHidden = false,
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement | null>(null);
	const [active, setActive] = useState<Record<string, boolean>>({});
	const [linkOpen, setLinkOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [showQuoted, setShowQuoted] = useState(false);
	// Raw HTML view for pasting a designed block or fixing markup the toolbar can't reach.
	const [sourceMode, setSourceMode] = useState(false);
	const savedRange = useRef<Range | null>(null);

	// Keep the DOM in step with the value without resetting the caret on every keystroke.
	useEffect(() => {
		const element = editorRef.current;
		if (element && element.innerHTML !== value) element.innerHTML = value;
	}, [value]);

	useEffect(() => {
		function refresh() {
			const element = editorRef.current;
			if (!element || !element.contains(document.activeElement)) return;
			const next: Record<string, boolean> = {};
			for (const item of COMMANDS) {
				if (item.command === "formatBlock") {
					next[item.command] = document.queryCommandValue("formatBlock").toLowerCase() === "blockquote";
				} else {
					next[item.command] = document.queryCommandState(item.command);
				}
			}
			setActive(next);
		}
		document.addEventListener("selectionchange", refresh);
		return () => document.removeEventListener("selectionchange", refresh);
	}, []);

	function emit() {
		onChange(editorRef.current?.innerHTML ?? "");
	}

	function run(command: string, commandValue?: string) {
		editorRef.current?.focus();
		if (command === "formatBlock" && active.formatBlock) {
			document.execCommand("formatBlock", false, "div");
		} else {
			document.execCommand(command, false, commandValue);
		}
		emit();
	}

	function openLink() {
		const selection = window.getSelection();
		savedRange.current = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null;
		setLinkUrl("");
		setLinkOpen(true);
	}

	function applyLink() {
		const url = linkUrl.trim();
		setLinkOpen(false);
		if (!url) return;
		const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
		editorRef.current?.focus();
		const selection = window.getSelection();
		if (savedRange.current && selection) {
			selection.removeAllRanges();
			selection.addRange(savedRange.current);
		}
		if (selection && selection.isCollapsed) {
			document.execCommand("insertHTML", false, `<a href="${href.replace(/"/g, "&quot;")}">${href}</a>`);
		} else {
			document.execCommand("createLink", false, href);
		}
		emit();
	}

	function onPaste(event: ClipboardEvent<HTMLDivElement>) {
		event.preventDefault();
		const text = event.clipboardData.getData("text/plain");
		document.execCommand("insertText", false, text);
	}

	function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			openLink();
		}
	}

	return (
		<div className={cn("flex min-h-0 flex-1 flex-col", className)}>
			<div className="relative min-h-0 flex-1 overflow-y-auto">
				<div
					ref={editorRef}
					id={id}
					role="textbox"
					aria-multiline="true"
					aria-label="Message body"
					contentEditable={!disabled}
					suppressContentEditableWarning
					data-placeholder={placeholder}
					onInput={emit}
					onBlur={emit}
					onPaste={onPaste}
					onKeyDown={onKeyDown}
					className={cn(
						// Phones zoom into editable text under 16px, so the body steps up there.
						"email-body max-w-none px-4 py-4 text-foreground outline-none max-sm:text-base",
						sourceMode && "hidden",
						"min-h-32 empty:before:pointer-events-none empty:before:text-subtle-foreground empty:before:content-[attr(data-placeholder)]",
						disabled && "cursor-not-allowed opacity-60",
					)}
				/>
				{sourceMode && (
					<textarea
						aria-label="Message HTML"
						value={value}
						onChange={(event) => onChange(event.target.value)}
						disabled={disabled}
						spellCheck={false}
						className="block h-full min-h-48 w-full resize-none bg-transparent px-4 py-4 font-mono text-[12.5px] leading-5 text-foreground outline-none max-sm:text-base"
					/>
				)}
				{quotedHtml && (
					<div className="px-4 pb-3">
						<button
							type="button"
							onClick={() => setShowQuoted((open) => !open)}
							aria-expanded={showQuoted}
							className="rounded-full bg-muted px-2 text-xs leading-5 text-muted-foreground ring-1 ring-inset ring-border transition-colors hover:bg-accent hover:text-foreground"
							title={showQuoted ? "Hide quoted text" : "Show quoted text"}
						>
							•••
						</button>
						{showQuoted && (
							<div
								className="email-body mt-2 max-w-none border-l-2 border-border-strong pl-3 text-sm text-muted-foreground"
								dangerouslySetInnerHTML={{ __html: quotedHtml }}
							/>
						)}
					</div>
				)}
			</div>
			<div className={cn("relative flex items-center gap-0.5 overflow-x-auto border-t border-border bg-elevated/60 px-3 py-2.5 scrollbar-none", toolbarHidden && "hidden")}>
				{toolbarStart}
				{COMMANDS.map((item) => (
					<Tooltip key={item.command} label={item.label}>
						<button
							type="button"
							aria-label={item.label}
							aria-pressed={!!active[item.command]}
							disabled={disabled || sourceMode}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => run(item.command, item.value)}
							className={cn(
								"flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
								active[item.command] && "bg-accent text-foreground ring-1 ring-inset ring-border",
							)}
						>
							<item.icon className="size-4" />
						</button>
					</Tooltip>
				))}
				<Tooltip label="Insert link (⌘K)">
					<button
						type="button"
						aria-label="Insert link"
						disabled={disabled}
						onMouseDown={(event) => event.preventDefault()}
						onClick={openLink}
						className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<Link2 className="size-4" />
					</button>
				</Tooltip>
				<Tooltip label={sourceMode ? "Back to formatted view" : "Edit HTML"}>
					<button
						type="button"
						aria-label="Edit HTML"
						aria-pressed={sourceMode}
						disabled={disabled}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => setSourceMode((open) => !open)}
						className={cn(
							"flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
							sourceMode && "bg-accent text-foreground ring-1 ring-inset ring-border",
						)}
					>
						<CodeXml className="size-4" />
					</button>
				</Tooltip>
				<Tooltip label="Clear formatting">
					<button
						type="button"
						aria-label="Clear formatting"
						disabled={disabled}
						onMouseDown={(event) => event.preventDefault()}
						onClick={() => run("removeFormat")}
						className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<RemoveFormatting className="size-4" />
					</button>
				</Tooltip>
				{toolbarEnd}
				{linkOpen && (
					<form
						className="anim-pop absolute bottom-full left-2 z-10 mb-2 flex items-center gap-1.5 rounded-xl bg-popover p-1.5 shadow-float" data-state="open"
						onSubmit={(event) => {
							event.preventDefault();
							applyLink();
						}}
					>
						<input
							autoFocus
							value={linkUrl}
							onChange={(event) => setLinkUrl(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Escape") setLinkOpen(false);
							}}
							placeholder="https://example.com"
							className="h-8 w-64 rounded-lg bg-muted px-2.5 text-[13px] text-foreground outline-none ring-1 ring-inset ring-border placeholder:text-subtle-foreground focus:ring-ring/40"
						/>
						<button type="submit" className="h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-[filter] hover:brightness-110">
							Apply
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
