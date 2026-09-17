import type { MetadataRoute } from "next";

/** Lets phones install postbox to the home screen and open it without browser chrome. */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "postbox",
		short_name: "postbox",
		description: "Self-hosted email for every domain you own",
		start_url: "/inbox",
		display: "standalone",
		background_color: "#f3f1ee",
		theme_color: "#f3f1ee",
		icons: [
			{ src: "/icon-96.png", sizes: "96x96", type: "image/png" },
			{ src: "/api/branding/icon", sizes: "any" },
		],
	};
}
