import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_TOPICS = new Set([
  "products/create",
  "products/update",
  "products/delete",
  "collections/update",
  "collections/create",
  "collections/delete",
]);

function verifyShopifyWebhookHmac(
  rawBody: string,
  hmacHeader: string,
  secret: string,
): boolean {
  const computed = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const expectedBuf = Buffer.from(computed, "utf8");
  const receivedBuf = Buffer.from(hmacHeader.trim(), "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(req: NextRequest) {
  const secret = (process.env.SHOPIFY_REVALIDATION_SECRET ?? "").trim();
  if (!secret) {
    return NextResponse.json(
      { error: "SHOPIFY_REVALIDATION_SECRET is not configured" },
      { status: 500 },
    );
  }

  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  if (!hmacHeader) {
    return NextResponse.json(
      { error: "Missing X-Shopify-Hmac-Sha256 header" },
      { status: 401 },
    );
  }

  const rawBody = await req.text();
  if (!verifyShopifyWebhookHmac(rawBody, hmacHeader, secret)) {
    return NextResponse.json(
      { error: "Invalid Shopify webhook HMAC signature" },
      { status: 401 },
    );
  }

  const topic = (req.headers.get("x-shopify-topic") || "").trim().toLowerCase();

  let payload: Record<string, any> = {};
  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  const handle =
    typeof payload.handle === "string" && payload.handle.trim()
      ? payload.handle.trim()
      : null;
  const adminGid =
    typeof payload.admin_graphql_api_id === "string"
      ? payload.admin_graphql_api_id
      : payload.id
        ? `gid://shopify/Product/${payload.id}`
        : null;

  const revalidatedTags = new Set<string>();
  const addTag = (tag: string) => {
    revalidateTag(tag);
    revalidatedTags.add(tag);
  };

  if (topic.startsWith("products/")) {
    addTag("products");
    addTag("collections");
    if (handle) {
      addTag(`product:${handle}`);
      revalidatePath(`/books/${handle}`, "page");
      revalidatePath(`/products/${handle}`, "page");
    }
    if (adminGid) {
      addTag(`product:${adminGid}`);
      addTag(`recommendations:${adminGid}`);
    }
  } else if (topic.startsWith("collections/")) {
    addTag("collections");
    addTag("products");
    if (handle) {
      addTag(`collection:${handle}`);
      revalidatePath(`/categories/${handle}`, "page");
    }
  } else {
    addTag("products");
    addTag("collections");
  }

  revalidatePath("/", "page");
  revalidatePath("/books", "page");
  revalidatePath("/products", "page");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({
    revalidated: true,
    topic: topic || "unknown",
    knownTopic: SUPPORTED_TOPICS.has(topic),
    tags: Array.from(revalidatedTags),
    timestamp: Date.now(),
  });
}
