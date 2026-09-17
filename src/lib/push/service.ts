import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import type { AppDatabase } from "@/db";
import { pushSettings, pushSubscriptions } from "@/db/schema";
import { newId } from "@/lib/ids";
import { base64UrlEncode, isValidPushEndpoint } from "./push-utils";
import { sendWebPush } from "./web-push";
import type { PushNotificationPayload, PushSubscriptionKeys, VapidKeys } from "./push-types";

const PUSH_SETTINGS_ID = "default";

/**
 * The instance's VAPID keys, created the first time anything needs them so push works
 * without configuring secrets. Two first requests racing both try to insert; the loser's
 * insert is ignored and it reads back the winner's keys.
 */
export async function getVapidKeys(db: AppDatabase): Promise<VapidKeys> {
	let [row] = await db.select().from(pushSettings).where(eq(pushSettings.id, PUSH_SETTINGS_ID)).limit(1);
	if (!row) {
		const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
		await db
			.insert(pushSettings)
			.values({
				id: PUSH_SETTINGS_ID,
				publicKey: base64UrlEncode(await crypto.subtle.exportKey("raw", pair.publicKey)),
				privateKeyJwk: JSON.stringify(await crypto.subtle.exportKey("jwk", pair.privateKey)),
			})
			.onConflictDoNothing();
		[row] = await db.select().from(pushSettings).where(eq(pushSettings.id, PUSH_SETTINGS_ID)).limit(1);
	}
	const privateKey = await crypto.subtle.importKey(
		"jwk",
		JSON.parse(row!.privateKeyJwk) as JsonWebKey,
		{ name: "ECDSA", namedCurve: "P-256" },
		false,
		["sign"],
	);
	return { publicKey: row!.publicKey, privateKey };
}

export async function savePushSubscription(
	db: AppDatabase,
	input: PushSubscriptionKeys & { userId: string; origin: string; userAgent?: string | null },
): Promise<void> {
	if (!isValidPushEndpoint(input.endpoint)) throw new Error("Invalid push endpoint");
	// An endpoint belongs to one browser profile; re-subscribing (or signing in as someone
	// else on the same device) moves it rather than duplicating it.
	await db
		.insert(pushSubscriptions)
		.values({
			id: newId("push"),
			userId: input.userId,
			endpoint: input.endpoint,
			p256dh: input.p256dh,
			auth: input.auth,
			origin: input.origin,
			userAgent: input.userAgent?.slice(0, 300) ?? null,
		})
		.onConflictDoUpdate({
			target: pushSubscriptions.endpoint,
			set: {
				userId: input.userId,
				p256dh: input.p256dh,
				auth: input.auth,
				origin: input.origin,
				userAgent: input.userAgent?.slice(0, 300) ?? null,
			},
		});
}

export async function deletePushSubscription(db: AppDatabase, userId: string, endpoint: string): Promise<void> {
	const [row] = await db
		.select({ id: pushSubscriptions.id, userId: pushSubscriptions.userId })
		.from(pushSubscriptions)
		.where(eq(pushSubscriptions.endpoint, endpoint))
		.limit(1);
	if (row?.userId === userId) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
}

export async function countPushSubscriptions(db: AppDatabase, userId: string): Promise<number> {
	const rows = await db.select({ id: pushSubscriptions.id }).from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
	return rows.length;
}

/**
 * Delivers a notification to every device the users turned push on for. Never throws:
 * a push service being down must not fail mail delivery. Dead endpoints are removed.
 */
export async function sendPushToUsers(
	env: CloudflareEnv,
	userIds: string[],
	payload: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
	const tally = { sent: 0, failed: 0 };
	if (userIds.length === 0) return tally;
	try {
		const db = getDb(env);
		const subscriptions = await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds));
		if (subscriptions.length === 0) return tally;
		const vapid = await getVapidKeys(db);
		const body = JSON.stringify(payload);

		await Promise.all(subscriptions.map(async (subscription) => {
			try {
				const result = await sendWebPush(subscription, body, vapid, subscription.origin);
				if (result === "sent") {
					tally.sent += 1;
					await db.update(pushSubscriptions).set({ lastSuccessAt: new Date() }).where(eq(pushSubscriptions.id, subscription.id));
				} else {
					tally.failed += 1;
					if (result === "expired") await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
				}
			} catch (error) {
				tally.failed += 1;
				console.error("Web Push delivery failed", error);
			}
		}));
	} catch (error) {
		console.error("Web Push dispatch failed", error);
	}
	return tally;
}
