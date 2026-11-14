import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/t";
import { getShopifyHostedAccountUrls } from "@/lib/shopify-cart";
import { BRAND, DEFAULT_SOCIAL, whatsappHref } from "@/lib/site-defaults";

export const metadata: Metadata = {
  title: `ஆர்டர் நிலை | Track Your Order — ${BRAND.nameTa} | ${BRAND.nameEn}`,
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  const hosted = getShopifyHostedAccountUrls();

  return (
    <div className="container-site max-w-3xl py-12 sm:py-16">
      <header className="mb-8">
        <p className="eyebrow">
          <T ta="பார்சல் கண்காணிப்பு" en="Order Status Lookup" />
        </p>
        <h1 className="mt-2 text-[32px] font-extrabold tracking-tight text-black sm:text-[42px]">
          <T ta="உங்கள் ஆர்டர் நிலையை அறிக" en="Track Your Order" />
        </h1>
        <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
        <p className="mt-3 text-[15px] leading-relaxed text-black/75">
          <T
            ta="Shopify ஆர்டர் நிலைப் பக்கம் வழியாக உங்கள் நூல் பார்சல் மற்றும் கூரியர் விவரங்களை உடனடியாக அறியலாம்."
            en="Look up live fulfillment status and courier tracking links directly through Shopify's hosted order status portal."
          />
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-3xl border border-black/10 bg-[#FAFAFA] p-6 shadow-card sm:p-8">
          <h2 className="text-[19px] font-extrabold text-black">
            <T
              ta="1. Shopify ஆர்டர் நிலைப் பக்கம் (பரிந்துரைக்கப்படுகிறது)"
              en="1. Look Up via Shopify Customer & Order Portal"
            />
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-black/75">
            <T
              ta="ஆர்டர் செய்த மின்னஞ்சல் முகவரி மூலம் Shopify போர்ட்டலில் உள்நுழைந்து அனைத்து ஆர்டர்களின் தற்போதைய நிலையையும் கூரியர் டிராக்கிங் இணைப்பையும் பார்க்கலாம்."
              en="Sign in with your checkout email on Shopify's hosted order portal to view real-time packing, dispatch, and courier tracking links."
            />
          </p>
          <div className="mt-5">
            {hosted ? (
              <a
                href={hosted.orderLookupUrl}
                className="btn-red h-12 px-7 text-[14.5px] font-bold shadow-glow"
              >
                <T ta="Shopify ஆர்டர் நிலையைத் திறக்க →" en="Open Shopify Order Status Lookup →" />
              </a>
            ) : (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-50 px-5 py-3.5 text-[13.5px] font-semibold text-amber-950">
                <T
                  ta="சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை — Store is temporarily unavailable"
                  en="Store is temporarily unavailable"
                />
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-[18px] font-extrabold text-black">
            <T
              ta="2. மின்னஞ்சல் / SMS நேரடி இணைப்பு"
              en="2. Direct Link in Your Order Confirmation Email / SMS"
            />
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-black/75">
            <T
              ta="ஆர்டர் உறுதியானவுடன் உங்கள் மின்னஞ்சல் அல்லது அலைபேசிக்கு அனுப்பப்பட்ட 'View your order' இணைப்பைத் தட்டினால் உள்நுழைவு இன்றி நேரடியாக ஆர்டர் நிலைப் பக்கம் திறக்கும்."
              en="Every Shopify order confirmation and shipping update email/SMS includes a one-click 'View your order' link that opens your live order status page directly."
            />
          </p>
          <p className="mt-4 border-t border-black/10 pt-4 text-[13.5px] text-black/70">
            <T
              ta="உறுதிப்படுத்தல் மின்னஞ்சல் கிடைக்கவில்லையா? உங்கள் ஆர்டர் எண்ணை எங்களுக்கு அனுப்பவும்:"
              en="Can't find your confirmation email? Message our dispatch desk with your name or phone number:"
            />{" "}
            <a
              href={whatsappHref(DEFAULT_SOCIAL)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-red-dark hover:underline"
            >
              WhatsApp +91 {DEFAULT_SOCIAL.whatsappDisplay}
            </a>{" "}
            ·{" "}
            <a
              href={`mailto:${DEFAULT_SOCIAL.email}`}
              className="font-bold text-brand-red-dark hover:underline"
            >
              {DEFAULT_SOCIAL.email}
            </a>
          </p>
        </section>
      </div>

      <div className="mt-8 text-center">
        <Link href="/books" className="text-[13.5px] font-semibold text-black/70 hover:underline">
          <T ta="← நூலகத்திற்குத் திரும்புக" en="← Back to Bookstore" />
        </Link>
      </div>
    </div>
  );
}
