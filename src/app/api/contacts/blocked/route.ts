import { NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/api/auth";
import { getEnv } from "@/lib/cloudflare";
import { listBlockedContacts } from "@/lib/contacts/service";
import { toContactDetails } from "../utils";

export async function GET(request: Request) {
	const env = getEnv();
	const { user, error } = await requireSessionUser(env, request);
	if (error) return error;

	const rows = await listBlockedContacts(env, user.id);
	return NextResponse.json({ contacts: rows.map(toContactDetails) });
}
