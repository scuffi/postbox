"use client";

import { authFetch } from "@/lib/auth/client";
import { base64UrlDecode, base64UrlEncode } from "./push-utils";

/** Set on a device with push on, so the page skips its own duplicate notifications. */
export const PUSH_ENABLED_STORAGE_KEY = "postbox-push-enabled";

export type PushSupport =
	| { state: "unsupported" }
	/** iPhone and iPad only allow web push from an app added to the Home Screen. */
	| { state: "install-required" }
	| { state: "ready"; permission: NotificationPermission };

export function getPushSupport(): PushSupport {
	if (typeof window === "undefined") return { state: "unsupported" };
	const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
		|| (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
	const standalone = window.matchMedia("(display-mode: standalone)").matches
		|| (navigator as Navigator & { standalone?: boolean }).standalone === true;
	if (ios && !standalone) return { state: "install-required" };
	if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
		return { state: "unsupported" };
	}
	return { state: "ready", permission: Notification.permission };
}

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
	return navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
		console.warn("Service worker registration failed", error);
		return null;
	});
}

export async function fetchPushConfig(): Promise<{ publicKey: string; devices: number }> {
	const response = await authFetch("/api/push/subscriptions");
	const data = (await response.json()) as { publicKey?: string; devices?: number; error?: string };
	if (!response.ok || !data.publicKey) throw new Error(data.error ?? "Push notifications are unavailable");
	return { publicKey: data.publicKey, devices: data.devices ?? 0 };
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
	if (!("serviceWorker" in navigator)) return null;
	const registration = await navigator.serviceWorker.getRegistration("/");
	return (await registration?.pushManager.getSubscription()) ?? null;
}

/**
 * Must run straight from a tap: Safari only shows the permission prompt for a user
 * gesture, so the public key is fetched beforehand and passed in.
 */
export async function enablePushNotifications(publicKey: string): Promise<void> {
	const permission = await Notification.requestPermission();
	if (permission !== "granted") {
		throw new Error(permission === "denied"
			? "Notifications are blocked. Allow them for postbox in your device settings."
			: "Notifications were not allowed.");
	}

	const registration = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
	let subscription = await registration.pushManager.getSubscription();
	// A subscription made with another server key (say, after a restore) cannot be reused.
	const existingKey = subscription?.options.applicationServerKey;
	if (subscription && existingKey && base64UrlEncode(existingKey) !== publicKey) {
		await subscription.unsubscribe();
		subscription = null;
	}
	subscription ??= await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: base64UrlDecode(publicKey),
	});

	const response = await authFetch("/api/push/subscriptions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(subscription.toJSON()),
	});
	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as { error?: string };
		throw new Error(data.error ?? "Could not turn on notifications");
	}
	setPushEnabledFlag(true);
}

export async function disablePushNotifications(): Promise<void> {
	const subscription = await getCurrentPushSubscription();
	if (subscription) {
		await authFetch("/api/push/subscriptions", {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ endpoint: subscription.endpoint }),
		});
		await subscription.unsubscribe();
	}
	setPushEnabledFlag(false);
}

export async function sendTestPushNotification(): Promise<void> {
	const response = await authFetch("/api/push/test", { method: "POST" });
	if (!response.ok) {
		const data = (await response.json().catch(() => ({}))) as { error?: string };
		throw new Error(data.error ?? "Could not send a test notification");
	}
}

export function isPushEnabledOnThisDevice(): boolean {
	try {
		return localStorage.getItem(PUSH_ENABLED_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}

function setPushEnabledFlag(enabled: boolean) {
	try {
		if (enabled) localStorage.setItem(PUSH_ENABLED_STORAGE_KEY, "1");
		else localStorage.removeItem(PUSH_ENABLED_STORAGE_KEY);
	} catch {
		// Storage can be unavailable; the only cost is a possible duplicate notification.
	}
}
