#!/usr/bin/env node
/**
 * Live Shopify Storefront Cart API verification script:
 *   cartCreate -> cartLinesAdd -> cartLinesUpdate -> cartLinesRemove
 *
 * Reads SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_TOKEN, and SHOPIFY_VENDOR_FILTER
 * from process.env or .env.local. Prints PASS / FAIL for each step and exits
 * non-zero on any failure.
 */

import fs from "node:fs";
import path from "node:path";

const API_VERSION = "2026-01";
const TIMEOUT_MS = 8_000;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const rawDomain = (process.env.SHOPIFY_STORE_DOMAIN || "")
  .trim()
  .replace(/^https?:\/\//i, "")
  .replace(/\/+$/, "");
const token = (process.env.SHOPIFY_STOREFRONT_TOKEN || "").trim();
const vendorFilter = (process.env.SHOPIFY_VENDOR_FILTER || "").trim();

function fail(step, reason) {
  console.error(`[FAIL] ${step}: ${reason}`);
  console.error("RESULT: FAIL");
  process.exit(1);
}

if (!rawDomain || !token) {
  fail(
    "config",
    "Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_TOKEN in environment / .env.local.",
  );
}

const endpoint = `https://${rawDomain}/api/${API_VERSION}/graphql.json`;

async function storefrontFetch(query, variables = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text.slice(0, 200)}`);
    }
    const payload = await res.json();
    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      const msg = payload.errors.map((e) => e.message).join("; ");
      const err = new Error(msg);
      err.graphqlErrors = payload.errors;
      throw err;
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
}

function buildProductsQuery(includeQty) {
  return `
    query FindPurchasableVariant($query: String) {
      products(first: 25, query: $query) {
        nodes {
          handle
          title
          vendor
          availableForSale
          variants(first: 5) {
            nodes {
              id
              availableForSale
              ${includeQty ? "quantityAvailable" : ""}
            }
          }
        }
      }
    }
  `;
}

function buildCartFragment(includeQty) {
  return `
    fragment VerifyCartFields on Cart {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount { amount currencyCode }
        totalAmount { amount currencyCode }
      }
      lines(first: 20) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                availableForSale
                ${includeQty ? "quantityAvailable" : ""}
                product { handle title }
              }
            }
          }
        }
      }
    }
  `;
}

async function run() {
  console.log(`Target Storefront endpoint: ${endpoint}`);

  let includeQty = true;
  async function findVariant(searchQuery) {
    try {
      return await storefrontFetch(buildProductsQuery(includeQty), {
        query: searchQuery || null,
      });
    } catch (err) {
      if (includeQty && /quantityAvailable/i.test(String(err.message))) {
        includeQty = false;
        return await storefrontFetch(buildProductsQuery(false), {
          query: searchQuery || null,
        });
      }
      throw err;
    }
  }

  let chosenVariant = null;
  let chosenProduct = null;

  try {
    const vendorQuery = vendorFilter
      ? `vendor:${JSON.stringify(vendorFilter)}`
      : null;
    const primary = await findVariant(vendorQuery);
    for (const p of primary?.products?.nodes || []) {
      const v = (p.variants?.nodes || []).find((x) => x.availableForSale);
      if (v) {
        chosenProduct = p;
        chosenVariant = v;
        break;
      }
    }

    if (!chosenVariant && vendorQuery) {
      console.warn(
        `[WARN] 0 availableForSale variants matched SHOPIFY_VENDOR_FILTER="${vendorFilter}"; checking unfiltered catalog for Cart API smoke test...`,
      );
      const fallback = await findVariant(null);
      for (const p of fallback?.products?.nodes || []) {
        const v = (p.variants?.nodes || []).find((x) => x.availableForSale);
        if (v) {
          chosenProduct = p;
          chosenVariant = v;
          break;
        }
      }
    }
  } catch (err) {
    fail("catalogLookup", err.message || String(err));
  }

  if (!chosenVariant) {
    fail(
      "catalogLookup",
      "No availableForSale product variants found in the live Shopify store to add to cart.",
    );
  }

  console.log(
    `Selected variant: ${chosenVariant.id} (${chosenProduct.handle}) qtyAvailable=${chosenVariant.quantityAvailable ?? "n/a"}`,
  );

  // 1. cartCreate
  let cartId;
  try {
    const frag = buildCartFragment(includeQty);
    const data = await storefrontFetch(
      `
      ${frag}
      mutation VerifyCartCreate {
        cartCreate(input: {}) {
          cart { ...VerifyCartFields }
          userErrors { field message }
        }
      }
    `,
    );
    const errs = data?.cartCreate?.userErrors || [];
    if (errs.length > 0) throw new Error(errs.map((e) => e.message).join("; "));
    const cart = data?.cartCreate?.cart;
    if (!cart?.id || !cart?.checkoutUrl) {
      throw new Error("cartCreate did not return id + checkoutUrl");
    }
    cartId = cart.id;
    console.log(`[PASS] cartCreate -> id=${cart.id}, totalQuantity=${cart.totalQuantity}`);
  } catch (err) {
    fail("cartCreate", err.message || String(err));
  }

  // 2. cartLinesAdd
  let lineId;
  try {
    const frag = buildCartFragment(includeQty);
    const data = await storefrontFetch(
      `
      ${frag}
      mutation VerifyCartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...VerifyCartFields }
          userErrors { field message }
        }
      }
    `,
      {
        cartId,
        lines: [{ merchandiseId: chosenVariant.id, quantity: 1 }],
      },
    );
    const errs = data?.cartLinesAdd?.userErrors || [];
    if (errs.length > 0) throw new Error(errs.map((e) => e.message).join("; "));
    const cart = data?.cartLinesAdd?.cart;
    const edge = cart?.lines?.edges?.[0]?.node;
    if (!edge?.id || cart.totalQuantity !== 1) {
      throw new Error(
        `Expected totalQuantity=1 and 1 line, got totalQuantity=${cart?.totalQuantity}`,
      );
    }
    lineId = edge.id;
    console.log(
      `[PASS] cartLinesAdd -> lineId=${lineId}, totalQuantity=${cart.totalQuantity}, subtotal=${cart.cost.subtotalAmount.amount} ${cart.cost.subtotalAmount.currencyCode}`,
    );
  } catch (err) {
    fail("cartLinesAdd", err.message || String(err));
  }

  // 3. cartLinesUpdate
  const targetQty =
    typeof chosenVariant.quantityAvailable === "number" &&
    chosenVariant.quantityAvailable < 2
      ? 1
      : 2;
  try {
    const frag = buildCartFragment(includeQty);
    const data = await storefrontFetch(
      `
      ${frag}
      mutation VerifyCartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart { ...VerifyCartFields }
          userErrors { field message }
        }
      }
    `,
      {
        cartId,
        lines: [{ id: lineId, quantity: targetQty }],
      },
    );
    const errs = data?.cartLinesUpdate?.userErrors || [];
    if (errs.length > 0) throw new Error(errs.map((e) => e.message).join("; "));
    const cart = data?.cartLinesUpdate?.cart;
    if (cart?.totalQuantity !== targetQty) {
      throw new Error(
        `Expected totalQuantity=${targetQty}, got totalQuantity=${cart?.totalQuantity}`,
      );
    }
    console.log(
      `[PASS] cartLinesUpdate -> quantity=${targetQty}, totalQuantity=${cart.totalQuantity}`,
    );
  } catch (err) {
    fail("cartLinesUpdate", err.message || String(err));
  }

  // 4. cartLinesRemove
  try {
    const frag = buildCartFragment(includeQty);
    const data = await storefrontFetch(
      `
      ${frag}
      mutation VerifyCartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ...VerifyCartFields }
          userErrors { field message }
        }
      }
    `,
      {
        cartId,
        lineIds: [lineId],
      },
    );
    const errs = data?.cartLinesRemove?.userErrors || [];
    if (errs.length > 0) throw new Error(errs.map((e) => e.message).join("; "));
    const cart = data?.cartLinesRemove?.cart;
    if (cart?.totalQuantity !== 0 || (cart?.lines?.edges?.length ?? -1) !== 0) {
      throw new Error(
        `Expected empty cart (totalQuantity=0), got totalQuantity=${cart?.totalQuantity}`,
      );
    }
    console.log(`[PASS] cartLinesRemove -> totalQuantity=${cart.totalQuantity}, lines=0`);
  } catch (err) {
    fail("cartLinesRemove", err.message || String(err));
  }

  console.log("RESULT: PASS");
}

run();
