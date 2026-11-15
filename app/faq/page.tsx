import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/t";
import FaqSection from "@/components/home/faq-section";
import {
  POLICY_LAST_UPDATED_EN,
  POLICY_LAST_UPDATED_ISO,
  POLICY_LAST_UPDATED_TA,
  STORE_FAQS,
  buildFaqJsonLd,
} from "@/lib/aeo-data";
import { BRAND, LOGO_ALT, SITE_URL, getShareLogoUrl } from "@/lib/site-defaults";
import { PUBLISHER_ENTITY, buildBreadcrumbNode } from "@/lib/seo-schema";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const title = `வினா-விடை | Frequently Asked Questions — ${BRAND.nameTa} | ${BRAND.nameEn}`;
  const description =
    "Direct answers on ordering from Muthamilarignar Pathipagam, Cash on Delivery (COD), delivery estimates, free delivery above ₹500, and official publisher editions.";
  const url = `${SITE_URL}/faq`;
  const shareLogo = getShareLogoUrl();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: `${BRAND.nameTa} | ${BRAND.nameEn}`,
      locale: "ta_IN",
      type: "website",
      images: [{ url: shareLogo, width: 1200, height: 1197, alt: LOGO_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareLogo],
    },
  };
}

export default function FaqPage() {
  const url = `${SITE_URL}/faq`;
  const faqSchema = buildFaqJsonLd(STORE_FAQS, url);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    ...buildBreadcrumbNode(
      [
        { name: `${PUBLISHER_ENTITY.nameTa} | Home`, url: SITE_URL },
        { name: "வினா-விடை | FAQ", url },
      ],
      `${url}#breadcrumb`,
    ),
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="container-site pt-8 pb-4 max-w-4xl">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[13px] text-black/70">
          <Link href="/" prefetch={false} className="hover:text-brand-red-dark">
            <T ta="முகப்பு" en="Home" />
          </Link>
          <span aria-hidden="true" className="opacity-40">/</span>
          <span className="font-semibold text-black">
            <T ta="வினா-விடை" en="FAQ" />
          </span>
        </nav>

        <p className="eyebrow">
          <T ta="வாசகர் வழிகாட்டி" en="Help Center & FAQ" />
        </p>
        <h1 className="mt-2 text-[32px] font-extrabold tracking-tight text-black sm:text-[44px]">
          <T ta="அடிக்கடி கேட்கப்படும் கேள்விகள்" en="Frequently Asked Questions" />
        </h1>
        <p className="mt-2 text-[13px] font-semibold text-black/65">
          <T ta="கடைசியாகப் புதுப்பிக்கப்பட்டது:" en="Last updated:" />{" "}
          <time dateTime={POLICY_LAST_UPDATED_ISO}>
            <T ta={POLICY_LAST_UPDATED_TA} en={POLICY_LAST_UPDATED_EN} />
          </time>
        </p>
      </div>

      <FaqSection faqs={STORE_FAQS} showAllLink={false} />
    </div>
  );
}
