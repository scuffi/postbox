import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { SIGNATURE_ASSET_PREFIX, SIGNATURE_IMAGE_TYPES, SIGNATURE_LOGO_MAX_BYTES } from "@/app/api/signature-assets/[assetId]/utils";
import type { MailboxRouteParams } from "../types";

/**
 * Stores a signature image and returns the public path recipients' mail clients load it
 * from. SVG is refused: it can carry script and would be served from the app's origin.
 */
export async function POST(request: Request, { params }: MailboxRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const { user, error } = await requireSessionUser(env, request);
	if (error) return error;

	const access = await getMailboxAccessLevel(getDb(env), user, id);
	if (!access?.canManage) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });

	const form = await request.formData().catch(() => null);
	const file = form?.get("file");
	if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
	const extension = SIGNATURE_IMAGE_TYPES[file.type];
	if (!extension) return NextResponse.json({ error: "Use a PNG, JPEG, GIF or WebP image" }, { status: 400 });
	if (file.size > SIGNATURE_LOGO_MAX_BYTES) return NextResponse.json({ error: "Images must be 1 MB or smaller" }, { status: 400 });

	const assetId = `${newId()}.${extension}`;
	await env.BUCKET.put(`${SIGNATURE_ASSET_PREFIX}${assetId}`, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type },
		customMetadata: { mailboxId: id, uploadedBy: user.id },
	});
	return NextResponse.json({ path: `/api/signature-assets/${assetId}` });
}
