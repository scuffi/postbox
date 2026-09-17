const MESSAGE_FOLDERS = "inbox|starred|snoozed|sent|drafts|archived|spam|trash";
const MESSAGE_DETAIL_PATH = new RegExp(`^/(?:(?:${MESSAGE_FOLDERS})|folders/[^/]+)/[^/]+/?$`);

/** Reading a message is full screen on phones, so the tab bar steps aside for the reader's own action bar. */
export function isMessageDetailPath(pathname: string) {
	return MESSAGE_DETAIL_PATH.test(pathname);
}

export function isTabActive(pathname: string, href: string, exact = false) {
	if (exact) return pathname === href;
	return pathname === href || pathname.startsWith(`${href}/`);
}
