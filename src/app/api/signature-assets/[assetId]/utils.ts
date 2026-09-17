export const SIGNATURE_ASSET_PREFIX = "signature-assets/";
export const SIGNATURE_LOGO_MAX_BYTES = 1024 * 1024;

/** Raster types only, keyed by MIME type, with the extension they are stored under. */
export const SIGNATURE_IMAGE_TYPES: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/gif": "gif",
	"image/webp": "webp",
};

/** Asset ids are generated server-side: a nanoid plus one of the extensions above. */
export function isValidSignatureAssetId(assetId: string): boolean {
	return /^[A-Za-z0-9_-]{10,40}\.(png|jpg|gif|webp)$/.test(assetId);
}
