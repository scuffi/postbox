/* postbox service worker: shows Web Push notifications and opens mail from them. */

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
	let payload = {};
	try {
		payload = event.data ? event.data.json() : {};
	} catch {
		payload = { title: "New email", body: event.data ? event.data.text() : "" };
	}

	// Safari revokes a subscription whose pushes do not show a notification, so every
	// push shows one, even while the app is open.
	event.waitUntil(
		self.registration.showNotification(payload.title || "New email", {
			body: payload.body || "",
			tag: payload.tag,
			icon: "/icon-96.png",
			badge: "/icon-96.png",
			data: { url: payload.url || "/inbox" },
		}),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const target = new URL(event.notification.data?.url || "/inbox", self.location.origin).href;

	event.waitUntil(
		(async () => {
			const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
			const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
			if (existing) {
				await existing.focus();
				if ("navigate" in existing) return existing.navigate(target);
				return undefined;
			}
			return self.clients.openWindow(target);
		})(),
	);
});
