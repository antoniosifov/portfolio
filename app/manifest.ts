import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anton Iosifov — Software Engineering Portfolio",
    short_name: "Anton Iosifov",
    description: "Full-Stack Software Engineer building production-ready web, mobile, cloud, and AI-enabled systems.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#586b40",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
