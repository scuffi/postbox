import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { readJsonBody } from "@/lib/http/request";
import { countPushSubscriptions, deletePushSubscription, getVapidKeys, savePushSubscription } from "@/lib/push/service";

const subscriptionSchema = z.object({
	endpoint: z.string().url().max(2048),
	keys: z.object({
		p256dh: z.string().min(40).max(200),
		auth: z.string().min(16).max(64),
	}),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2048) });

/** The public VAPID key the browser subscribes with, and how many devices are on. */
export async function GET(request: Request) {
	const env = getEnv();
	const { user, error } = await requireSessionUser(env, request);
	if (error) return error;
	const db = getDb(env);
	const [vapid, devices] = await Promise.all([getVapidKeys(db), countPushSubscriptions(db, user.id)]);
	return NextResponse.json({ publicKey: vapid.publicKey, devices });
}

export async function POST(request: Request) {
	const env = getEnv();
	const { user, error } = await requireSessionUser(env, request);
	if (error) return error;
	const parsed = subscriptionSchema.safeParse(await readJsonBody(request, 8 * 1024).catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });

	try {
		await savePushSubscription(getDb(env), {
			userId: user.id,
			endpoint: parsed.data.endpoint,
			p256dh: parsed.data.keys.p256dh,
			auth: parsed.data.keys.auth,
			origin: new URL(request.url).origin,
			userAgent: request.headers.get("user-agent"),
		});
	} catch (saveError) {
		const message = saveError instanceof Error ? saveError.message : "Could not save subscription";
		return NextResponse.json({ error: message }, { status: 400 });
	}
	return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
	const env = getEnv();
	const { user, error } = await requireSessionUser(env, request);
	if (error) return error;
	const parsed = unsubscribeSchema.safeParse(await readJsonBody(request, 4 * 1024).catch(() => null));
	if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	await deletePushSubscription(getDb(env), user.id, parsed.data.endpoint);
	return NextResponse.json({ ok: true });
}
