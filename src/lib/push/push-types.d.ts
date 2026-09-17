export type PushSubscriptionKeys = {
	endpoint: string;
	/** The browser's P-256 public key, base64url. */
	p256dh: string;
	/** The browser's 16-byte auth secret, base64url. */
	auth: string;
};

/** What the service worker receives and turns into a notification. */
export type PushNotificationPayload = {
	title: string;
	body: string;
	/** Path the notification opens, e.g. `/inbox/msg_…`. */
	url: string;
	/** Notifications with the same tag replace each other. */
	tag?: string;
};

export type PushSendResult = "sent" | "expired" | "failed";

export type VapidKeys = {
	/** Uncompressed P-256 point, base64url — what browsers take as `applicationServerKey`. */
	publicKey: string;
	privateKey: CryptoKey;
};
