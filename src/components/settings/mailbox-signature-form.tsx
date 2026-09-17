"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { RichTextEditor } from "@/components/compose/rich-text-editor";
import { SIGNATURE_DESIGN_COMMENT, isHtmlSignature, signatureToHtml, textToHtml } from "@/components/compose/rich-text-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { updateMailboxSignature } from "./utils";
import {
	emptySignatureDesign,
	readSignatureDesign,
	renderSignatureDesign,
	SIGNATURE_ACCENTS,
	uploadSignatureLogo,
} from "./signature-design-utils";
import type { SignatureDesign, SignatureEditorMode, SignatureLayout } from "./signature-design-types";

const LAYOUTS: Array<{ value: SignatureLayout; label: string }> = [
	{ value: "classic", label: "Classic" },
	{ value: "stacked", label: "Stacked" },
	{ value: "minimal", label: "Minimal" },
];

/** The editable HTML of a saved signature: designer comment removed, plain text converted. */
function editableSignatureHtml(signature: string): string {
	if (!signature.trim()) return "";
	if (!isHtmlSignature(signature)) return textToHtml(signature);
	return signatureToHtml(signature.replace(SIGNATURE_DESIGN_COMMENT, ""));
}

export function MailboxSignatureForm() {
	const { selectedMailbox, setSelectedMailbox, isLoading } = useSelectedMailbox();
	const [signature, setSignature] = useState("");
	const [savedSignature, setSavedSignature] = useState("");
	const [mode, setMode] = useState<SignatureEditorMode>("design");
	const [design, setDesign] = useState<SignatureDesign | null>(null);
	const [editHtml, setEditHtml] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);
	const logoInput = useRef<HTMLInputElement | null>(null);

	const address = selectedMailbox ? `${selectedMailbox.localPart}@${selectedMailbox.hostname}` : "";

	useEffect(() => {
		const nextSignature = selectedMailbox?.signature ?? "";
		const savedDesign = readSignatureDesign(nextSignature);
		setSignature(nextSignature);
		setSavedSignature(nextSignature);
		setDesign(savedDesign ?? emptySignatureDesign(address, selectedMailbox?.displayName ?? ""));
		// Open where the signature was made: the designer for designed or empty ones.
		setMode(savedDesign || !nextSignature.trim() ? "design" : "edit");
		setEditHtml(editableSignatureHtml(nextSignature));
		setStatus(null);
	}, [selectedMailbox?.id, selectedMailbox?.signature, selectedMailbox?.displayName, address]);

	const previewHtml = useMemo(() => signatureToHtml(signature), [signature]);
	const hasManualEdits = !!signature.trim() && !readSignatureDesign(signature);

	function updateDesign(patch: Partial<SignatureDesign>) {
		if (!design) return;
		const next = { ...design, ...patch };
		setDesign(next);
		setSignature(renderSignatureDesign(next));
	}

	function changeMode(next: SignatureEditorMode) {
		// The rich editor owns its HTML while open; seed it fresh so it never fights the caret.
		if (next === "edit") setEditHtml(editableSignatureHtml(signature));
		if (next === "design" && design && !hasManualEdits) setSignature(renderSignatureDesign(design));
		setMode(next);
	}

	async function onLogoSelected(file: File | undefined) {
		if (!file || !selectedMailbox) return;
		setUploading(true);
		setStatus(null);
		try {
			updateDesign({ logoUrl: await uploadSignatureLogo(selectedMailbox.id, file, authFetch) });
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Upload failed");
		} finally {
			setUploading(false);
			if (logoInput.current) logoInput.current.value = "";
		}
	}

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedMailbox) return;
		setSaving(true);
		setStatus(null);
		try {
			const saved = await updateMailboxSignature(selectedMailbox.id, signature);
			setSignature(saved);
			setSavedSignature(saved);
			setSelectedMailbox({ ...selectedMailbox, signature: saved });
			setStatus("Saved");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Failed to update signature");
		} finally {
			setSaving(false);
		}
	}

	if (isLoading) return <p className="text-sm text-muted-foreground">Loading inbox…</p>;
	if (!selectedMailbox || !design) return <p className="text-sm text-muted-foreground">Select an inbox to configure its signature.</p>;

	const canManage = selectedMailbox.permission === "full_access";
	const disabled = !canManage || saving;

	return (
		<form onSubmit={onSubmit} className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="min-w-0 text-[13px] text-muted-foreground">
					Signature for <span className="font-medium text-foreground">{address}</span>
				</p>
				<Segmented
					size="sm"
					value={mode}
					onChange={changeMode}
					options={[
						{ value: "design", label: "Design" },
						{ value: "edit", label: "Edit" },
						{ value: "html", label: "HTML" },
					]}
				/>
			</div>

			{mode === "design" && (
				<div className="space-y-4">
					{hasManualEdits && (
						<p className="rounded-lg bg-amber-500/10 px-3 py-2 text-[13px] text-amber-800 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300">
							This signature was edited by hand. Changing anything here replaces it with a designed one.
						</p>
					)}
					<div className="flex flex-wrap items-center gap-3">
						<Segmented size="sm" value={design.layout} onChange={(layout) => updateDesign({ layout })} options={LAYOUTS} />
						<div className="flex items-center gap-1.5" role="radiogroup" aria-label="Accent colour">
							{SIGNATURE_ACCENTS.map((accent) => (
								<button
									key={accent}
									type="button"
									role="radio"
									aria-checked={design.accent === accent}
									aria-label={`Accent ${accent}`}
									disabled={disabled}
									onClick={() => updateDesign({ accent })}
									style={{ backgroundColor: accent }}
									className={cn(
										"size-6 rounded-full ring-offset-2 ring-offset-card transition-shadow",
										design.accent === accent ? "ring-2 ring-foreground/60" : "ring-1 ring-black/10",
									)}
								/>
							))}
						</div>
					</div>

					<div className="flex items-center gap-3">
						{design.logoUrl ? (
							<span className="relative">
								{/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded, external to Next's image pipeline */}
								<img src={design.logoUrl} alt="" className="size-14 rounded-lg object-cover ring-1 ring-border" />
								<button
									type="button"
									aria-label="Remove image"
									disabled={disabled}
									onClick={() => updateDesign({ logoUrl: "" })}
									className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-popover text-muted-foreground shadow-float hover:text-foreground"
								>
									<X className="size-3" />
								</button>
							</span>
						) : (
							<span className="flex size-14 items-center justify-center rounded-lg bg-muted text-subtle-foreground ring-1 ring-inset ring-border">
								<ImagePlus className="size-5" />
							</span>
						)}
						<div>
							<Button type="button" variant="secondary" size="sm" disabled={disabled || uploading} onClick={() => logoInput.current?.click()}>
								{uploading ? <Loader2 className="animate-spin" /> : null}
								{design.logoUrl ? "Replace logo or photo" : "Add logo or photo"}
							</Button>
							<p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, GIF or WebP, up to 1 MB. Square works best.</p>
						</div>
						<input
							ref={logoInput}
							type="file"
							accept="image/png,image/jpeg,image/gif,image/webp"
							className="hidden"
							onChange={(event) => void onLogoSelected(event.target.files?.[0])}
						/>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						{([
							["name", "Name", "Archie Ferguson"],
							["title", "Job title", "Founder"],
							["company", "Company", "Artic Labs"],
							["phone", "Phone", "+44 20 7946 0000"],
							["email", "Email", address],
							["website", "Website", "articlabs.dev"],
						] as const).map(([field, label, placeholder]) => (
							<div key={field} className="space-y-1.5">
								<Label htmlFor={`signature-${field}`}>{label}</Label>
								<Input
									id={`signature-${field}`}
									value={design[field]}
									placeholder={placeholder}
									disabled={disabled}
									onChange={(event) => updateDesign({ [field]: event.target.value })}
								/>
							</div>
						))}
					</div>
				</div>
			)}

			{mode === "edit" && (
				<div className="flex min-h-56 flex-col overflow-hidden rounded-xl ring-1 ring-inset ring-border">
					<RichTextEditor
						id="mailboxSignatureEditor"
						value={editHtml}
						onChange={(html) => {
							setEditHtml(html);
							setSignature(html);
						}}
						disabled={disabled}
						placeholder="Your name, role and contact details"
					/>
				</div>
			)}

			{mode === "html" && (
				<div className="space-y-1.5">
					<Textarea
						aria-label="Signature HTML"
						value={signature.replace(SIGNATURE_DESIGN_COMMENT, "")}
						onChange={(event) => setSignature(event.target.value)}
						rows={10}
						spellCheck={false}
						disabled={disabled}
						placeholder={'<table cellpadding="0" cellspacing="0">…</table>'}
						className="font-mono text-[12px] leading-5"
					/>
					<p className="text-xs text-muted-foreground">
						Use tables and inline styles; most mail apps ignore stylesheets. Scripts and unsafe markup are removed.
					</p>
				</div>
			)}

			<div className="space-y-1.5">
				<p className="text-xs font-medium uppercase tracking-wide text-subtle-foreground">Preview</p>
				<div className="email-paper rounded-xl p-4 ring-1 ring-inset ring-border">
					{previewHtml.trim() ? (
						<div className="email-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
					) : (
						<p className="text-[13px] text-muted-foreground">No signature yet.</p>
					)}
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
				<Button type="submit" disabled={disabled || signature.trim() === savedSignature.trim()}>
					{saving ? "Saving…" : "Save signature"}
				</Button>
				{signature.trim() && (
					<Button type="button" variant="ghost" disabled={disabled} onClick={() => {
						setSignature("");
						setEditHtml("");
						setDesign(emptySignatureDesign(address, selectedMailbox.displayName ?? ""));
					}}>
						Clear
					</Button>
				)}
				{!canManage && <p className="text-sm text-muted-foreground">Full access is required to edit this signature.</p>}
				{status && <p className="animate-fade-in text-[13px] text-muted-foreground">{status}</p>}
			</div>
		</form>
	);
}
