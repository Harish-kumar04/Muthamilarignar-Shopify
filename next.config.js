/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const IMAGE_HOSTS = [
  "https://cdn.shopify.com",
  "https://res.cloudinary.com",
];

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          `img-src 'self' data: ${IMAGE_HOSTS.join(" ")}`,
          `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data:",
          "connect-src 'self' https://*.myshopify.com https://cdn.shopify.com https://res.cloudinary.com" +
            (isDev ? " ws:" : ""),
          "frame-src 'self'",
          "worker-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self' https://*.myshopify.com",
        ].join("; "),
      },
    ];
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Hashed build output: safe to cache forever.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Unhashed public assets (logo, brand images): long-lived, revalidated in the background.
        source: "/:file((?!_next/).+\\.(?:jpg|jpeg|png|webp|avif|svg|ico|gif))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        // Never cache or index cart, checkout, or customer account/orders pages.
        source: "/:section(cart|checkout|account|orders|returns|track)/:rest*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  async redirects() {
    const reserved =
      "api|_next|books|categories|about|faq|authors|policies|products|cart|checkout|account|orders|returns|track|login|signup|forgot-password|reset-password|brand";
    const cleanSections =
      "books|categories|about|faq|authors|policies|products|cart|checkout|account|orders|returns|track";
    const seoFiles = "llms\\.txt|robots\\.txt|sitemap\\.xml";

    return [
      {
        source: "/:auth(login|signup|forgot-password|reset-password)",
        destination: "/account",
        statusCode: 301,
      },
      {
        source: "/account/consent",
        destination: "/account",
        statusCode: 301,
      },
      {
        source: "/demo-store",
        destination: "/",
        statusCode: 301,
      },
      {
        source: "/demo-store/:path+",
        destination: "/:path+",
        statusCode: 301,
      },
      {
        source: `/:tenant((?!${reserved})[^/.]+)/:section(${cleanSections}|${seoFiles})`,
        destination: "/:section",
        statusCode: 301,
      },
      {
        source: `/:tenant((?!${reserved})[^/.]+)/:section(${cleanSections})/:rest+`,
        destination: "/:section/:rest+",
        statusCode: 301,
      },
    ];
  },
};
