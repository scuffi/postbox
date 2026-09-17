import { base64UrlDecode, base64UrlEncode, concatBytes } from "./push-utils";
import type { PushSendResult, PushSubscriptionKeys, VapidKeys } from "./push-types";

const encoder = new TextEncoder();
const RECORD_SIZE = 4096;
const VAPID_TOKEN_LIFETIME_SECONDS = 12 * 60 * 60;

/**
 * Sends one Web Push message: the payload encrypted for the subscription (RFC 8291,
 * aes128gcm) and authorised with a VAPID token (RFC 8292). Built on Web Crypto alone so
 * it runs the same on Workers and in the Node runtime.
 */
export async function sendWebPush(
	subscription: PushSubscriptionKeys,
	payload: string,
	vapid: VapidKeys,
	subject: string,
	options: { ttlSeconds?: number; urgency?: "normal" | "high" } = {},
): Promise<PushSendResult> {
	const body = await encryptPayload(subscription, encoder.encode(payload));
	const token = await createVapidToken(new URL(subscription.endpoint).origin, subject, vapid.privateKey);
	const response = await fetch(subscription.endpoint, {
		method: "POST",
		headers: {
			Authorization: `vapid t=${token}, k=${vapid.publicKey}`,
			"Content-Encoding": "aes128gcm",
			"Content-Type": "application/octet-stream",
			TTL: String(options.ttlSeconds ?? 24 * 60 * 60),
			Urgency: options.urgency ?? "high",
		},
		body,
	});
	if (response.ok) return "sent";
	// The browser unsubscribed, or the app was removed from the home screen.
	if (response.status === 404 || response.status === 410) return "expired";
	console.warn(`Web Push to ${new URL(subscription.endpoint).host} failed: ${response.status} ${await response.text().catch(() => "")}`);
	return "failed";
}

async function encryptPayload(subscription: PushSubscriptionKeys, plaintext: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
	const userAgentPublic = base64UrlDecode(subscription.p256dh);
	const authSecret = base64UrlDecode(subscription.auth);

	const serverKeys = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
	const serverPublic = new Uint8Array(await crypto.subtle.exportKey("raw", serverKeys.publicKey));
	const userAgentKey = await crypto.subtle.importKey("raw", userAgentPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
	const sharedSecret = new Uint8Array(
		await crypto.subtle.deriveBits({ name: "ECDH", public: userAgentKey }, serverKeys.privateKey, 256),
	);

	// RFC 8291 §3.4: mix the auth secret and both public keys into the IKM.
	const prkKey = await hmac(authSecret, sharedSecret);
	const keyInfo = concatBytes(encoder.encode("WebPush: info\0"), userAgentPublic, serverPublic);
	const ikm = await hmac(prkKey, concatBytes(keyInfo, new Uint8Array([1])));

	// RFC 8188: derive the content key and nonce from a random salt.
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const prk = await hmac(salt, ikm);
	const contentKey = (await hmac(prk, encoder.encode("Content-Encoding: aes128gcm\0\x01"))).slice(0, 16);
	const nonce = (await hmac(prk, encoder.encode("Content-Encoding: nonce\0\x01"))).slice(0, 12);

	// A single record: the payload followed by the last-record delimiter.
	const record = concatBytes(plaintext, new Uint8Array([2]));
	const aesKey = await crypto.subtle.importKey("raw", contentKey, "AES-GCM", false, ["encrypt"]);
	const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, record));

	const header = new Uint8Array(16 + 4 + 1 + serverPublic.length);
	header.set(salt, 0);
	new DataView(header.buffer).setUint32(16, RECORD_SIZE);
	header[20] = serverPublic.length;
	header.set(serverPublic, 21);
	return concatBytes(header, ciphertext);
}

async function hmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
	const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data));
}

async function createVapidToken(audience: string, subject: string, privateKey: CryptoKey): Promise<string> {
	const header = base64UrlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
	const claims = base64UrlEncode(
		encoder.encode(JSON.stringify({
			aud: audience,
			exp: Math.floor(Date.now() / 1000) + VAPID_TOKEN_LIFETIME_SECONDS,
			sub: subject,
		})),
	);
	const signingInput = `${header}.${claims}`;
	// Web Crypto returns the raw r||s signature, which is exactly JWS's ES256 encoding.
	const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, encoder.encode(signingInput));
	return `${signingInput}.${base64UrlEncode(signature)}`;
}
