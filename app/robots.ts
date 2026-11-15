import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-defaults";

const PRIVATE_PATHS = [
  "/admin",
  "/admin/",
  "/cart",
  "/checkout",
  "/account",
  "/orders",
  "/returns",
  "/track",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/",
  "/_next/",
];

const AI_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((agent) => ({
        userAgent: agent,
        allow: ["/", "/llms.txt"],
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
