import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { DEFAULT_TENANT } from "@/lib/site-defaults";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // TODO shopify: verify `x-shopify-hmac-sha256` webhook signature using SHOPIFY_REVALIDATION_SECRET
  const secretHeader =
    req.headers.get("x-shopify-hmac-sha256") ||
    req.headers.get("x-revalidate-secret") ||
    req.headers.get("revalidate-secret") ||
    req.nextUrl.searchParams.get("secret");

  const expectedSecret = process.env.SHOPIFY_REVALIDATION_SECRET;
  if (expectedSecret && secretHeader !== expectedSecret) {
    return NextResponse.json({ message: "Invalid revalidation secret" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const tenant = body.tenant || DEFAULT_TENANT;
    const productId = body.productId || body.id;
    const slug = body.slug || body.handle;

    revalidateTag("products");
    revalidateTag(`products:${tenant}`);
    revalidateTag("categories");
    revalidateTag(`categories:${tenant}`);
    revalidateTag("store");
    revalidateTag(`store:${tenant}`);
    if (productId) {
      revalidateTag(`book:${tenant}:${productId}`);
    }
    if (slug && slug !== productId) {
      revalidateTag(`book:${tenant}:${slug}`);
    }

    revalidatePath(`/${tenant}`, "page");
    revalidatePath(`/${tenant}/books`, "page");
    revalidatePath(`/${tenant}/products`, "page");
    if (slug) {
      revalidatePath(`/${tenant}/books/${slug}`, "page");
      revalidatePath(`/${tenant}/products/${slug}`, "page");
    }

    return NextResponse.json({
      revalidated: true,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Error revalidating", error: err?.message },
      { status: 500 },
    );
  }
}
