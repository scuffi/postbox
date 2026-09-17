import { getEnvAsync } from "@/lib/cloudflare";
import { isValidSignatureAssetId, SIGNATURE_ASSET_PREFIX, SIGNATURE_IMAGE_TYPES } from "./utils";

/**
 * Public on purpose: signature images are loaded by recipients' mail clients, which have
 * no session. Ids are unguessable, and each upload gets a new one, so it caches forever.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
	const { assetId } = await params;
	if (!isValidSignatureAssetId(assetId)) return new Response("Not found", { status: 404 });

	const env = await getEnvAsync();
	const object = await env.BUCKET.get(`${SIGNATURE_ASSET_PREFIX}${assetId}`);
	const contentType = object?.httpMetadata?.contentType ?? "";
	if (!object || !SIGNATURE_IMAGE_TYPES[contentType]) return new Response("Not found", { status: 404 });

	return new Response(object.body, {
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=31536000, immutable",
			"X-Content-Type-Options": "nosniff",
			"Content-Security-Policy": "default-src 'none'",
		},
	});
}
