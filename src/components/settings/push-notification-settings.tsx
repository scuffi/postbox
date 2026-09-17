"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BellOff, BellRing, Share, SquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import {
	disablePushNotifications,
	enablePushNotifications,
	fetchPushConfig,
	getCurrentPushSubscription,
	getPushSupport,
	sendTestPushNotification,
} from "@/lib/push/client";

function subscribeToNothing() {
	return () => {};
}

/** Support and permission are read on the client only; the server renders nothing here. */
function usePushSupport() {
	const state = useSyncExternalStore(subscribeToNothing, () => getPushSupport().state, () => null);
	const permission = useSyncExternalStore(
		subscribeToNothing,
		() => (typeof Notification === "undefined" ? "default" : Notification.permission),
		() => "default" as NotificationPermission,
	);
	return { state, permission };
}

export function PushNotificationSettings() {
	const support = usePushSupport();
	const [publicKey, setPublicKey] = useState<string | null>(null);
	const [subscribed, setSubscribed] = useState(false);
	const [pending, setPending] = useState<"enable" | "disable" | "test" | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (getPushSupport().state !== "ready") return;
		let cancelled = false;
		// Load the key up front: enabling has to go straight from the tap to the prompt.
		Promise.all([fetchPushConfig(), getCurrentPushSubscription()])
			.then(([config, subscription]) => {
				if (cancelled) return;
				setPublicKey(config.publicKey);
				setSubscribed(!!subscription && Notification.permission === "granted");
			})
			.catch((loadError) => {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Push notifications are unavailable");
			});
		return () => {
			cancelled = true;
		};
	}, []);

	async function enable() {
		if (!publicKey) return;
		setPending("enable");
		setError(null);
		try {
			await enablePushNotifications(publicKey);
			setSubscribed(true);
			toast.success("Notifications are on for this device");
		} catch (enableError) {
			setError(enableError instanceof Error ? enableError.message : "Could not turn on notifications");
		} finally {
			setPending(null);
		}
	}

	async function disable() {
		setPending("disable");
		setError(null);
		try {
			await disablePushNotifications();
			setSubscribed(false);
		} catch (disableError) {
			setError(disableError instanceof Error ? disableError.message : "Could not turn off notifications");
		} finally {
			setPending(null);
		}
	}

	async function test() {
		setPending("test");
		setError(null);
		try {
			await sendTestPushNotification();
			toast.success("Test notification sent");
		} catch (testError) {
			setError(testError instanceof Error ? testError.message : "Could not send a test notification");
		} finally {
			setPending(null);
		}
	}

	if (!support.state) return null;

	if (support.state === "install-required") {
		return (
			<div className="space-y-3 text-[13px] text-muted-foreground">
				<p className="text-sm font-medium text-foreground">Add postbox to your Home Screen first</p>
				<p>On iPhone and iPad, notifications only work from the installed app.</p>
				<ol className="space-y-2">
					<li className="flex items-center gap-2">
						<Share className="size-4 shrink-0 text-foreground" />
						Tap Share in Safari&apos;s toolbar.
					</li>
					<li className="flex items-center gap-2">
						<SquarePlus className="size-4 shrink-0 text-foreground" />
						Choose Add to Home Screen, then open postbox from there and come back here.
					</li>
				</ol>
			</div>
		);
	}

	if (support.state === "unsupported") {
		return <p className="text-[13px] text-muted-foreground">This browser can&apos;t receive push notifications.</p>;
	}

	const blocked = support.permission === "denied";

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-3">
				<span
					className={
						subscribed
							? "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground"
							: "flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
					}
				>
					{subscribed ? <BellRing className="size-4" /> : <BellOff className="size-4" />}
				</span>
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground">
						{subscribed ? "On for this device" : blocked ? "Blocked on this device" : "Off for this device"}
					</p>
					<p className="text-[13px] text-muted-foreground">
						{subscribed
							? "You'll get a notification for new mail in your inbox, even when postbox is closed."
							: blocked
								? "Notifications were denied. Allow them for postbox in your browser or device settings, then try again."
								: "Get a notification for new mail in your inbox, even when postbox is closed."}
					</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
				{subscribed ? (
					<>
						<Button type="button" variant="secondary" onClick={() => void test()} disabled={pending !== null}>
							{pending === "test" ? "Sending…" : "Send test notification"}
						</Button>
						<Button type="button" variant="ghost" onClick={() => void disable()} disabled={pending !== null}>
							{pending === "disable" ? "Turning off…" : "Turn off"}
						</Button>
					</>
				) : (
					<Button type="button" onClick={() => void enable()} disabled={!publicKey || pending !== null}>
						{pending === "enable" ? "Turning on…" : "Turn on notifications"}
					</Button>
				)}
			</div>
			{error && <p className="text-[13px] text-destructive">{error}</p>}
		</div>
	);
}
