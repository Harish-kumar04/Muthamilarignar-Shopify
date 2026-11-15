import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/t";
import { getShopifyHostedAccountUrls } from "@/lib/shopify-cart";
import {
  BRAND,
  DEFAULT_SOCIAL,
  LOGO_ALT,
  SITE_URL,
  getShareLogoUrl,
  whatsappHref,
} from "@/lib/site-defaults";

const returnsTitle = `மாற்று & பணம் திரும்பத் தகவல் | Returns & Replacements — ${BRAND.nameTa} | ${BRAND.nameEn}`;
const returnsDesc =
  "7-day replacement and return information for damaged, misprinted, or incorrect books ordered from Muthamilarignar Pathipagam.";
const returnsShareLogo = getShareLogoUrl();

export const metadata: Metadata = {
  title: returnsTitle,
  description: returnsDesc,
  alternates: { canonical: `${SITE_URL}/returns` },
  openGraph: {
    title: returnsTitle,
    description: returnsDesc,
    url: `${SITE_URL}/returns`,
    siteName: `${BRAND.nameTa} | ${BRAND.nameEn}`,
    locale: "ta_IN",
    type: "website",
    images: [{ url: returnsShareLogo, width: 1200, height: 1197, alt: LOGO_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: returnsTitle,
    description: returnsDesc,
    images: [returnsShareLogo],
  },
};

export default function ReturnsInfoPage() {
  const hosted = getShopifyHostedAccountUrls();

  return (
    <div className="container-site max-w-4xl py-12 sm:py-16">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-[13px] text-black/70"
      >
        <Link href="/" prefetch={false} className="hover:text-brand-red-dark">
          <T ta="முகப்பு" en="Home" />
        </Link>
        <span aria-hidden="true" className="opacity-40">
          /
        </span>
        <span className="font-semibold text-black">
          <T ta="மாற்று & பணம் திரும்ப" en="Returns & Replacements" />
        </span>
      </nav>

      <header className="border-b border-black/10 pb-6">
        <p className="eyebrow">
          <T ta="வாசகர் சேவை வழிகாட்டி" en="Reader Support & Returns Guide" />
        </p>
        <h1 className="mt-2 text-[32px] font-extrabold tracking-tight text-black sm:text-[42px]">
          <T
            ta="நூல் மாற்று & பணம் திரும்பப் பெறுதல்"
            en="Returns, Replacements & Refunds"
          />
        </h1>
        <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
        <p className="mt-4 rounded-2xl border border-brand-red/20 bg-brand-red-light p-4 text-[14.5px] font-medium leading-relaxed text-black">
          <T
            ta="நூல் கிடைத்த 7 நாட்களுக்குள் அச்சுப் பிழை, பக்கக் குறைபாடு, போக்குவரத்துச் சேதம் அல்லது தவறான நூல் அனுப்பப்பட்டிருந்தால் இலவச மாற்றுப் பிரதி அல்லது முழுப் பணம் திரும்ப வழங்கப்படும்."
            en="Report transit damage, binding/printing defects, or wrong titles within 7 days of delivery for a free replacement copy or full refund."
          />
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-black/10 bg-[#FAFAFA] p-6">
          <h2 className="text-[18px] font-extrabold text-black">
            <T ta="தகுதியான காரணங்கள்" en="What Qualifies for Free Replacement" />
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-[14.5px] leading-relaxed text-black/80">
            <li>
              <T
                ta="கூரியர் போக்குவரத்தின் போது ஏற்பட்ட கடுமையான சேதம்"
                en="Severe physical damage sustained during courier transit"
              />
            </li>
            <li>
              <T
                ta="அச்சுக் குறைபாடு, வெற்றுப் பக்கங்கள் அல்லது பைண்டிங் பிரிதல்"
                en="Missing/blank pages, misprints, or binding defects"
              />
            </li>
            <li>
              <T
                ta="ஆர்டர் செய்த நூலுக்குப் பதிலாக வேறு நூல் வந்திருந்தால்"
                en="Incorrect book or edition delivered against your order"
              />
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-black/10 bg-[#FAFAFA] p-6">
          <h2 className="text-[18px] font-extrabold text-black">
            <T ta="விண்ணப்பிக்கும் முறை (3 படிகள்)" en="How to Request a Return (3 Steps)" />
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-[14.5px] leading-relaxed text-black/80">
            <li>
              <T
                ta="நூல் கிடைத்த 7 நாட்களுக்குள் ஆர்டர் எண்ணைக் குறிப்பிடவும்."
                en="Note your Shopify order number within 7 days of delivery."
              />
            </li>
            <li>
              <T
                ta="சேதமடைந்த பகுதி மற்றும் உறையின் தெளிவான புகைப்படம் எடுக்கவும்."
                en="Take a clear photo of the outer parcel label and the affected pages/cover."
              />
            </li>
            <li>
              <T
                ta="கீழே உள்ள வாட்ஸ்அப், மின்னஞ்சல் அல்லது Shopify கணக்கு வழியாக அனுப்பவும்."
                en="Submit via your Shopify customer account or send directly to our support team below."
              />
            </li>
          </ol>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-card">
        <h2 className="text-[18px] font-extrabold text-black">
          <T ta="பணம் திரும்பப் பெறும் கால அளவு" en="Refund Processing Timeline" />
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-black/75">
          <T
            ta="மாற்றுப் பிரதி கையிருப்பில் இல்லையெனில், ஒப்புதல் அளிக்கப்பட்ட 5–7 வணிக நாட்களுக்குள் நீங்கள் செலுத்திய அதே கட்டண முறையில் (UPI / Card / NetBanking) அல்லது வங்கிக் கணக்கில் (COD ஆர்டர்களுக்கு) முழுத் தொகையும் திருப்பிச் செலுத்தப்படும்."
            en="Approved refunds are credited within 5–7 business days to your original payment method (UPI / Card / NetBanking) or via bank/UPI transfer for Cash on Delivery orders."
          />
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {hosted && (
            <a
              href={hosted.ordersUrl}
              className="btn-black h-11 px-6 text-[14px] font-bold"
            >
              <T ta="Shopify கணக்கில் ஆர்டரைத் திறக்க →" en="Open Orders on Shopify →" />
            </a>
          )}
          <a
            href={whatsappHref(DEFAULT_SOCIAL)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-red h-11 px-6 text-[14px] font-bold"
          >
            WhatsApp +91 {DEFAULT_SOCIAL.whatsappDisplay}
          </a>
          <Link
            href="/policies/returns"
            className="btn-outline h-11 px-5 text-[13.5px] font-bold"
          >
            <T ta="முழுக் கொள்கை விவரம்" en="Full Returns Policy" />
          </Link>
        </div>
      </section>
    </div>
  );
}