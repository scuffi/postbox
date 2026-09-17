import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { sendPushToUsers } from "@/lib/push/service";

/** Sends a notification to every device the signed-in user has turned push on for. */
export async function POST(request: Request) {
	const env = getEnv();
	const { user, error } = await requireSessionUser(env, request);
	if (error) return error;
	const result = await sendPushToUsers(env, [user.id], {
		title: "Notifications are on",
		body: "New mail will show up here, even when postbox is closed.",
		url: "/inbox",
		tag: "postbox-test",
	});
	if (result.sent === 0) {
		return NextResponse.json({ error: "No device accepted the notification. Try turning notifications off and on again." }, { status: 502 });
	}
	return NextResponse.json(result);
}
