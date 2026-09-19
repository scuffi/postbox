import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { blockContact, unblockContact } from "@/lib/contacts/service";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import type { BlockContactRequest, UnblockContactRequest } from "./types";

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const body = (await request.json()) as BlockContactRequest;
	if (!body.mailboxId || !body.address?.trim()) {
		return NextResponse.json({ error: "Mailbox and contact are required" }, { status: 400 });
	}

	const access = await getMailboxAccessLevel(getDb(env), user, body.mailboxId);
	if (!access?.canManage) {
		return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	}

	const contact = await blockContact(env, {
		userId: access.mailbox.userId,
		mailboxId: access.mailbox.id,
		domainId: access.mailbox.domainId,
		address: body.address,
	});
	return NextResponse.json({ contact });
}

export async function DELETE(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const body = (await request.json()) as UnblockContactRequest;
	if (!body.address?.trim()) {
		return NextResponse.json({ error: "Contact is required" }, { status: 400 });
	}

	let userId = user.id;
	if (body.mailboxId) {
		const access = await getMailboxAccessLevel(getDb(env), user, body.mailboxId);
		if (!access?.canManage) {
			return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
		}
		userId = access.mailbox.userId;
	}

	const contact = await unblockContact(env, userId, body.address);
	return NextResponse.json({ contact });
}
