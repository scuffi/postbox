import { escapeHtml, SIGNATURE_DESIGN_COMMENT } from "@/components/compose/rich-text-utils";
import type { SignatureDesign } from "./signature-design-types";

export const SIGNATURE_ACCENTS = ["#DA202A", "#1F2937", "#2563EB", "#0F766E", "#7C3AED", "#B45309"];

const FONT = "Arial, Helvetica, sans-serif";
const MUTED = "#6B7280";
const TEXT = "#111827";

export function emptySignatureDesign(email: string, name: string): SignatureDesign {
	return { layout: "classic", name, title: "", company: "", phone: "", website: "", email, logoUrl: "", accent: SIGNATURE_ACCENTS[0] };
}

/** The designer fields a saved signature was built from, if it was built in the designer. */
export function readSignatureDesign(signature: string | null | undefined): SignatureDesign | null {
	const encoded = signature?.match(SIGNATURE_DESIGN_COMMENT)?.[1];
	if (!encoded) return null;
	try {
		const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
		return JSON.parse(new TextDecoder().decode(bytes)) as SignatureDesign;
	} catch {
		return null;
	}
}

/**
 * Email-client-safe HTML for a design: tables and inline styles only, since Outlook and
 * Gmail ignore stylesheets and most layout CSS. The design rides along in a leading
 * comment (stripped before sending) so the designer can reopen it.
 */
export function renderSignatureDesign(design: SignatureDesign): string {
	const accent = /^#[0-9a-f]{6}$/i.test(design.accent) ? design.accent : SIGNATURE_ACCENTS[0];
	const text = (value: string) => escapeHtml(value.trim());
	const website = design.website.trim();
	const websiteHref = website && !/^https?:\/\//i.test(website) ? `https://${website}` : website;
	const websiteLabel = website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
	const phoneHref = design.phone.replace(/[^\d+]/g, "");
	const logo = safeImageUrl(design.logoUrl);

	const role = [design.title, design.company].map((part) => part.trim()).filter(Boolean).map(escapeHtml).join(" · ");
	const contacts = [
		design.phone.trim() && `<a href="tel:${escapeHtml(phoneHref)}" style="color:${TEXT};text-decoration:none;">${text(design.phone)}</a>`,
		design.email.trim() && `<a href="mailto:${escapeHtml(design.email.trim())}" style="color:${TEXT};text-decoration:none;">${text(design.email)}</a>`,
		website && `<a href="${escapeHtml(websiteHref)}" style="color:${accent};text-decoration:none;">${escapeHtml(websiteLabel)}</a>`,
	].filter(Boolean);

	const nameLine = design.name.trim() ? `<div style="font-family:${FONT};font-size:15px;font-weight:bold;color:${TEXT};line-height:20px;">${text(design.name)}</div>` : "";
	const roleLine = role ? `<div style="font-family:${FONT};font-size:13px;color:${MUTED};line-height:18px;">${role}</div>` : "";
	const contactLine = contacts.length ? `<div style="font-family:${FONT};font-size:12px;color:${TEXT};line-height:18px;margin-top:6px;">${contacts.join(`<span style="color:${MUTED};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`)}</div>` : "";

	let body: string;
	if (design.layout === "minimal") {
		body = `<div style="font-family:${FONT};font-size:13px;color:${TEXT};line-height:19px;">${nameLine}${roleLine}${contactLine}</div>`;
	} else if (design.layout === "stacked") {
		const logoRow = logo ? `<tr><td style="padding-bottom:10px;"><img src="${escapeHtml(logo)}" alt="${text(design.company || design.name)}" height="40" style="display:block;height:40px;width:auto;border:0;"></td></tr>` : "";
		body = `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${logoRow}<tr><td style="border-top:2px solid ${accent};padding-top:10px;">${nameLine}${roleLine}${contactLine}</td></tr></table>`;
	} else {
		const logoCell = logo ? `<td style="padding-right:14px;vertical-align:middle;"><img src="${escapeHtml(logo)}" alt="${text(design.company || design.name)}" width="64" height="64" style="display:block;width:64px;height:64px;border-radius:8px;border:0;"></td>` : "";
		body = `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>${logoCell}<td style="border-left:2px solid ${accent};padding-left:14px;vertical-align:middle;">${nameLine}${roleLine}${contactLine}</td></tr></table>`;
	}

	const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(design))));
	return `<!--postbox-signature-design:${encoded}-->${body}`;
}

function safeImageUrl(value: string): string {
	try {
		const url = new URL(value.trim());
		return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
	} catch {
		return "";
	}
}

export async function uploadSignatureLogo(mailboxId: string, file: File, fetcher: typeof fetch): Promise<string> {
	const body = new FormData();
	body.set("file", file);
	const response = await fetcher(`/api/mailboxes/${mailboxId}/signature-logo`, { method: "POST", body });
	const data = (await response.json().catch(() => ({}))) as { path?: string; error?: string };
	if (!response.ok || !data.path) throw new Error(data.error ?? "Upload failed");
	// Recipients load it from their own mail client, so it has to be an absolute URL.
	return new URL(data.path, window.location.origin).href;
}
