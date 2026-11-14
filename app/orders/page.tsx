import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/t";
import { getShopifyHostedAccountUrls } from "@/lib/shopify-cart";
import { BRAND } from "@/lib/site-defaults";

export const metadata: Metadata = {
  title: `எனது ஆர்டர்கள் | My Orders — ${BRAND.nameTa} | ${BRAND.nameEn}`,
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  const hosted = getShopifyHostedAccountUrls();

  return (
    <div className="container-site max-w-3xl py-12 sm:py-16">
      <header className="mb-8">
        <p className="eyebrow">
          <T ta="ஆர்டர் வரலாறு" en="Order History" />
        </p>
        <h1 className="mt-2 text-[32px] font-extrabold tracking-tight text-black sm:text-[42px]">
          <T ta="எனது ஆர்டர்கள்" en="My Orders" />
        </h1>
        <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
        <p className="mt-3 text-[15px] leading-relaxed text-black/75">
          <T
            ta="உங்கள் அனைத்து ஆர்டர்கள், கூரியர் கண்காணிப்பு எண்கள் மற்றும் விலைப்பட்டியல்கள் Shopify வாடிக்கையாளர் கணக்கில் பாதுகாப்பாக உள்ளன."
            en="Your complete order history, courier tracking numbers, and downloadable receipts are available in Shopify's hosted customer account."
          />
        </p>
      </header>

      <div className="rounded-3xl border border-black/10 bg-[#FAFAFA] p-6 shadow-card sm:p-10">
        {hosted ? (
          <div className="space-y-5">
            <p className="text-[14.5px] leading-relaxed text-black/80">
              <T
                ta="ஆர்டர் செய்யும்போது பயன்படுத்திய மின்னஞ்சல் முகவரி மூலம் உள்நுழைந்து உங்கள் ஆர்டர்களைப் பார்க்கவும்."
                en="Sign in with the email address you used at checkout to view all orders and live shipment updates."
              />
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={hosted.ordersUrl}
                className="btn-red h-12 px-7 text-[14.5px] font-bold shadow-glow"
              >
                <T ta="Shopify கணக்கில் ஆர்டர்களைக் காண்க →" en="View Orders on Shopify →" />
              </a>
              <Link
                href="/track"
                className="btn-outline h-12 px-6 text-[14px] font-bold"
              >
                <T ta="ஆர்டர் நிலை அறிதல்" en="Track an Order" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-50 px-5 py-4 text-[14px] font-semibold text-amber-950">
            <T
              ta="சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை — Store is temporarily unavailable"
              en="Store is temporarily unavailable"
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-black/70">
        <Link href="/returns" className="font-bold text-brand-red-dark hover:underline">
          <T ta="மாற்று & பணம் திரும்பக் கொள்கை →" en="Returns & Replacement Information →" />
        </Link>
        <Link href="/books" className="hover:underline">
          <T ta="← நூல்களைப் பார்வையிடுக" en="← Browse Books" />
        </Link>
      </div>
    </div>
  );
}