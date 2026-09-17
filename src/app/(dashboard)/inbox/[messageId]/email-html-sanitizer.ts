const ALLOWED_TAGS = new Set([
	"a",
	"abbr",
	"address",
	"b",
	"blockquote",
	"br",
	"caption",
	"code",
	"col",
	"colgroup",
	"dd",
	"del",
	"div",
	"dl",
	"dt",
	"em",
	"figcaption",
	"figure",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"hr",
	"i",
	"img",
	"ins",
	"kbd",
	"li",
	"ol",
	"p",
	"pre",
	"q",
	"s",
	"samp",
	"small",
	"span",
	"strong",
	"sub",
	"sup",
	"table",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"tr",
	"u",
	"ul",
]);

const DROP_CONTENT_TAGS = new Set([
	"base",
	"button",
	"embed",
	"form",
	"iframe",
	"input",
	"link",
	"math",
	"meta",
	"object",
	"option",
	"script",
	"select",
	"style",
	"svg",
	"textarea",
]);

const GLOBAL_ATTRIBUTES = new Set(["dir", "lang", "style", "title"]);
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
	a: new Set(["href"]),
	blockquote: new Set(["cite"]),
	col: new Set(["span", "width"]),
	img: new Set(["alt", "height", "src", "width"]),
	li: new Set(["value"]),
	ol: new Set(["start", "type"]),
	table: new Set(["border", "cellpadding", "cellspacing", "width"]),
	td: new Set(["align", "colspan", "rowspan", "valign", "width"]),
	th: new Set(["align", "colspan", "rowspan", "scope", "valign", "width"]),
};

const ALLOWED_STYLE_PROPERTIES = new Set([
	"background-color",
	"border",
	"border-bottom",
	"border-color",
	"border-left",
	"border-radius",
	"border-right",
	"border-style",
	"border-top",
	"border-width",
	"color",
	"display",
	"font-family",
	"font-size",
	"font-style",
	"font-weight",
	"height",
	"letter-spacing",
	"line-height",
	"margin",
	"margin-bottom",
	"margin-left",
	"margin-right",
	"margin-top",
	"max-width",
	"min-width",
	"padding",
	"padding-bottom",
	"padding-left",
	"padding-right",
	"padding-top",
	"text-align",
	"text-decoration",
	"text-indent",
	"text-transform",
	"vertical-align",
	"white-space",
	"width",
	"word-break",
	"word-wrap",
]);
const APP_FONT_FALLBACK = "var(--font-geist-sans), system-ui, sans-serif";

function isSafeLinkUrl(value: string): boolean {
	try {
		const url = new URL(value, window.location.origin);
		return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
	} catch {
		return false;
	}
}

function isSafeImageUrl(value: string): boolean {
	if (value.startsWith("/api/messages/")) return true;
	if (/^data:image\/(?:gif|jpeg|png|webp);base64,/i.test(value)) return true;
	try {
		const url = new URL(value, window.location.origin);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

/**
 * The style object lists shorthands as their longhands (`border-left` arrives as
 * `border-left-width`, `-style` and `-color`), so a longhand of an allowed shorthand is
 * allowed too. Without this, borders and `text-decoration: none` were silently dropped.
 */
function isAllowedStyleProperty(property: string): boolean {
	if (ALLOWED_STYLE_PROPERTIES.has(property)) return true;
	for (const allowed of ALLOWED_STYLE_PROPERTIES) {
		if (property.startsWith(`${allowed}-`)) return true;
	}
	return false;
}

/** Splits a style attribute into declarations, ignoring semicolons inside parentheses or quotes. */
function splitDeclarations(style: string): string[] {
	const declarations: string[] = [];
	let current = "";
	let depth = 0;
	let quote: string | null = null;
	for (const char of style) {
		if (quote) {
			if (char === quote) quote = null;
		} else if (char === "\"" || char === "'") {
			quote = char;
		} else if (char === "(") {
			depth += 1;
		} else if (char === ")") {
			depth = Math.max(0, depth - 1);
		} else if (char === ";" && depth === 0) {
			declarations.push(current);
			current = "";
			continue;
		}
		current += char;
	}
	declarations.push(current);
	return declarations;
}

/**
 * Keeps allowed declarations as written, so `border-left: 2px solid red` stays one
 * declaration instead of the dozen longhands the style object would expand it to.
 * Escapes and comments are refused outright: they are how `u\72l(` slips past a
 * pattern check, and legitimate mail has no need for them in inline styles.
 */
function sanitizeStyle(element: HTMLElement, options: SanitizeOptions): void {
	const safeDeclarations: string[] = [];
	const probe = document.createElement("div").style;
	for (const declaration of splitDeclarations(element.getAttribute("style") ?? "")) {
		const separator = declaration.indexOf(":");
		if (separator <= 0) continue;
		const property = declaration.slice(0, separator).trim().toLowerCase();
		const value = declaration.slice(separator + 1).trim().replace(/\s*!important\s*$/i, "");
		if (!value || !isAllowedStyleProperty(property)) continue;
		if (/[\\<>]|\/\*/.test(value)) continue;
		if (/url\s*\(|expression\s*\(|javascript:|@import|behavior\s*:|-moz-binding|image-set\s*\(/i.test(value)) continue;
		// Let the browser's own parser reject anything that is not valid CSS for the property.
		probe.cssText = "";
		probe.setProperty(property, value);
		if (!probe.length) continue;
		const safeValue = property === "font-family" && options.appFontFallback !== false
			? `${value}, ${APP_FONT_FALLBACK}`
			: value;
		safeDeclarations.push(`${property}: ${safeValue}`);
	}
	if (safeDeclarations.length) {
		element.setAttribute("style", safeDeclarations.join("; "));
	} else {
		element.removeAttribute("style");
	}
}

function sanitizeElement(element: Element, options: SanitizeOptions): void {
	const tag = element.tagName.toLowerCase();
	if (!ALLOWED_TAGS.has(tag)) {
		if (DROP_CONTENT_TAGS.has(tag)) {
			element.remove();
			return;
		}
		element.replaceWith(...Array.from(element.childNodes));
		return;
	}

	for (const attribute of Array.from(element.attributes)) {
		const name = attribute.name.toLowerCase();
		const allowed = GLOBAL_ATTRIBUTES.has(name) || TAG_ATTRIBUTES[tag]?.has(name);
		if (!allowed || name.startsWith("on")) element.removeAttribute(attribute.name);
	}

	if (element instanceof HTMLElement) sanitizeStyle(element, options);

	if (tag === "a") {
		const href = element.getAttribute("href");
		if (!href || !isSafeLinkUrl(href)) {
			element.removeAttribute("href");
		} else {
			element.setAttribute("target", "_blank");
			element.setAttribute("rel", "noopener noreferrer");
		}
	}

	if (tag === "img") {
		const src = element.getAttribute("src");
		if (!src || !isSafeImageUrl(src)) {
			element.remove();
			return;
		}
		element.setAttribute("loading", "lazy");
		element.setAttribute("referrerpolicy", "no-referrer");
	}
}

type SanitizeOptions = {
	/**
	 * Appends the app font to font-family so received mail reads in the UI's type. Off for
	 * HTML that will be sent, like signatures, where recipients have no such font.
	 */
	appFontFallback?: boolean;
};

export function sanitizeEmailHtml(html: string | null, options: SanitizeOptions = {}): string | null {
	if (!html) return null;
	const document = new DOMParser().parseFromString(html, "text/html");
	for (const element of Array.from(document.body.querySelectorAll("*"))) {
		sanitizeElement(element, options);
	}
	return document.body.innerHTML;
}
