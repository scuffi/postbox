import {
	demoCredentials,
	ensureDemoBranding,
	ensureDemoDomains,
	ensureDemoMailboxes,
	ensureDemoUser,
	insertDemoMessages,
} from "@/lib/seed-utils";

/** Dev-only seed without Cloudflare API (domains must be onboarded separately). */
export async function seedDemoData(env: CloudflareEnv): Promise<{ messageCount: number }> {
	const user = await ensureDemoUser(env);
	await ensureDemoBranding(env);
	const domainMap = await ensureDemoDomains(env, user.id);
	const mailboxMap = await ensureDemoMailboxes(env, user.id, domainMap);
	const messageCount = await insertDemoMessages(env, user.id, mailboxMap);

	console.info("Seeded demo user:", demoCredentials);

	return { messageCount };
}