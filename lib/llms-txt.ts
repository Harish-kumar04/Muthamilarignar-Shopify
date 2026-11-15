import { getCatalogSummarySafe } from "@/lib/shopify";
import { splitBilingual } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site-defaults";
import { PUBLISHER_ENTITY } from "@/lib/seo-schema";
import { AUTHORS, POLICY_LAST_UPDATED_ISO } from "@/lib/aeo-data";

export async function buildLlmsMarkdown(baseOrigin = SITE_URL): Promise<string> {
  const { products, collections: categories } = await getCatalogSummarySafe();
  const home = baseOrigin.replace(/\/$/, "");
  const books = products.slice(0, 40);

  const lines: string[] = [
    `# ${PUBLISHER_ENTITY.nameEn} (${PUBLISHER_ENTITY.nameTa})`,
    "",
    `> Official Tamil and English online bookstore of ${PUBLISHER_ENTITY.nameEn} (${PUBLISHER_ENTITY.nameTa}), headquartered at ${PUBLISHER_ENTITY.addressLineEn}. Publishes authentic printed editions on Dravidian movement history, social justice, constitutional federalism, language rights, the Dravidian Model of governance, and the literary and political works of Muthamilarignar Dr. Kalaignar M. Karunanidhi.`,
    "",
    `Last updated: ${POLICY_LAST_UPDATED_ISO}`,
    "",
    "## Key Pages",
    `- [Home](${home}/): Featured releases, curated collections, publisher strip, and FAQ.`,
    `- [All Books Catalog](${home}/books): Complete bilingual catalog with instant search, category filters, and sorting.`,
    `- [About the Publisher](${home}/about): Official entity profile, mission, and verified Chennai contact details.`,
    `- [Authors](${home}/authors): Profiles and bibliographies for Muthamilarignar Kalaignar, M. K. Stalin, and Dravidian movement scholars.`,
    `- [FAQ](${home}/faq): Direct answers on ordering, Cash on Delivery (COD), delivery estimates, free delivery above ₹500, and official editions.`,
    `- [Shipping Policy](${home}/policies/shipping): Pan-India delivery and free shipping on orders above ₹500.`,
    `- [Returns & Refunds Policy](${home}/policies/returns): 7-day free replacement or full refund for damaged or misprinted books.`,
    `- [Privacy Policy](${home}/policies/privacy): Reader data protection and secure payment handling.`,
    `- [Terms & Conditions](${home}/policies/terms): Authentic official publisher editions and INR pricing.`,
    `- [XML Sitemap](${home}/sitemap.xml)`,
    "",
    "## Categories",
    ...(categories as any[])
      .filter((c) => c?.slug)
      .map((c) => {
        const [ta, en] = splitBilingual(c.name, "|");
        return `- [${ta}${en && en !== ta ? ` | ${en}` : ""}](${home}/categories/${c.slug})`;
      }),
    "",
    "## Authors",
    ...AUTHORS.map((a) => `- [${a.nameEn} (${a.nameTa})](${home}/authors/${a.slug}): ${a.honorificEn}`),
    "",
    "## Featured & Published Books (INR)",
    ...books.map((b) => {
      const [ta, en] = splitBilingual(b.name, "|");
      const priceInr = Math.round(((b.sale_price_cents && b.sale_price_cents < b.price_cents ? b.sale_price_cents : b.price_cents) || 0) / 100);
      const slugOrId = b.slug || b.id;
      return `- [${ta}${en && en !== ta ? ` | ${en}` : ""}](${home}/books/${slugOrId}) — ₹${priceInr}`;
    }),
    "",
    "## How to Order & Delivery",
    "- Browse any book page and click **Add to Cart** or **Buy Now** to proceed to checkout.",
    "- Cash on Delivery (COD) and online payment options are available at checkout; see checkout for exact delivery estimates.",
    "- Free pan-India delivery applies automatically on orders above ₹500.",
    "- Every title is a 100% authentic official publisher edition from Muthamilarignar Pathipagam.",
    "",
    "## Verified Contact & Publisher Entity",
    `- Legal / Brand Name: ${PUBLISHER_ENTITY.nameTa} | ${PUBLISHER_ENTITY.nameEn}`,
    `- Address: ${PUBLISHER_ENTITY.addressLineEn}`,
    `- Phone / WhatsApp: +91 ${PUBLISHER_ENTITY.phoneDisplay} (${PUBLISHER_ENTITY.phoneE164})`,
    `- Email: ${PUBLISHER_ENTITY.email}`,
    `- Official Facebook: ${PUBLISHER_ENTITY.sameAs[0]}`,
    "",
  ];

  return lines.join("\n");
}
