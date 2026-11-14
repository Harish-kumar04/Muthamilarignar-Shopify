import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/t";
import { getShopifyHostedAccountUrls } from "@/lib/shopify-cart";
import { BRAND, DEFAULT_SOCIAL, whatsappHref } from "@/lib/site-defaults";

export const metadata: Metadata = {
  title: `வாசகர் கணக்கு | Customer Account — ${BRAND.nameTa} | ${BRAND.nameEn}`,
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  const hosted = getShopifyHostedAccountUrls();

  return (
    <div className="container-site max-w-4xl py-12 sm:py-16">
      <header className="mb-10">
        <p className="eyebrow">
          <T ta="வாசகர் கணக்கு" en="Reader Account" />
        </p>
        <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-black sm:text-[42px]">
          <T ta="உங்கள் கணக்கில் உள்நுழைக" en="Sign in to Your Account" />
        </h1>
        <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
        <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-black/75">
          <T
            ta="உங்கள் ஆர்டர்கள், விலைப்பட்டியல், முகவரி விவரங்கள் மற்றும் விநியோக நிலையைப் பார்க்க Shopify பாதுகாப்பான வாடிக்கையாளர் கணக்கில் உள்நுழைக."
            en="Access your order history, invoices, saved addresses, and shipment updates securely through Shopify's hosted customer account portal."
          />
        </p>
      </header>

      <div className="rounded-3xl border border-black/10 bg-[#FAFAFA] p-6 shadow-card sm:p-10">
        {hosted ? (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[20px] font-extrabold text-black">
                <T ta="Shopify வாடிக்கையாளர் கணக்கு" en="Shopify Customer Account Login" />
              </h2>
              <p className="mt-1.5 max-w-xl text-[14px] text-black/70">
                <T
                  ta="உங்கள் மின்னஞ்சல் முகவரி மூலம் கடவுச்சொல் இல்லாத ஒருமுறை குறியீடு (OTP) வழியாகப் பாதுகாப்பாக உள்நுழையலாம்."
                  en="Sign in with your checkout email using Shopify's secure hosted login."
                />
              </p>
            </div>
            <a
              href={hosted.loginUrl}
              className="btn-red h-12 flex-shrink-0 px-7 text-[15px] font-bold shadow-glow"
            >
              <T ta="கணக்கில் உள்நுழைக →" en="Sign in on Shopify →" />
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-50 px-5 py-4 text-[14px] font-semibold text-amber-950">
            <T
              ta="சேவையகம் தற்காலிகமாகக் கிடைக்கவில்லை — Store is temporarily unavailable"
              en="Store is temporarily unavailable"
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-black/10 pt-8 sm:grid-cols-3">
          <Link
            href="/orders"
            className="card-glow flex flex-col justify-between bg-white p-5"
          >
            <div>
              <h3 className="text-[15.5px] font-bold text-black">
                <T ta="எனது ஆர்டர்கள்" en="My Orders" />
              </h3>
              <p className="mt-1.5 text-[13px] text-black/65">
                <T
                  ta="முந்தைய ஆர்டர்கள் மற்றும் ரசீதுகளைக் காண்க."
                  en="View past orders, receipts, and fulfillment status."
                />
              </p>
            </div>
            <span className="mt-4 text-[13px] font-bold text-brand-red-dark">
              <T ta="ஆர்டர்கள் →" en="View orders →" />
            </span>
          </Link>

          <Link
            href="/track"
            className="card-glow flex flex-col justify-between bg-white p-5"
          >
            <div>
              <h3 className="text-[15.5px] font-bold text-black">
                <T ta="ஆர்டர் நிலை அறிதல்" en="Track Order" />
              </h3>
              <p className="mt-1.5 text-[13px] text-black/65">
                <T
                  ta="உங்கள் நூல் பார்சலின் தற்போதைய நிலையைச் சரிபார்க்கவும்."
                  en="Check real-time shipment and courier tracking."
                />
              </p>
            </div>
            <span className="mt-4 text-[13px] font-bold text-brand-red-dark">
              <T ta="நிலை அறிக →" en="Track shipment →" />
            </span>
          </Link>

          <Link
            href="/returns"
            className="card-glow flex flex-col justify-between bg-white p-5"
          >
            <div>
              <h3 className="text-[15.5px] font-bold text-black">
                <T ta="மாற்று & பணம் திரும்ப" en="Returns & Replacements" />
              </h3>
              <p className="mt-1.5 text-[13px] text-black/65">
                <T
                  ta="7-நாள் மாற்றுப் பிரதி மற்றும் பணம் திரும்பப் பெறும் விதிமுறைகள்."
                  en="Read our 7-day replacement and return guidelines."
                />
              </p>
            </div>
            <span className="mt-4 text-[13px] font-bold text-brand-red-dark">
              <T ta="விவரங்கள் →" en="Returns info →" />
            </span>
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-[13.5px] text-black/70">
        <T ta="உதவி தேவையா?" en="Need assistance with an order?" />{" "}
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
    </div>
  );
}