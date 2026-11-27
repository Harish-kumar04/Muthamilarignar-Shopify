import Link from "next/link";
import BrandLogo from "./brand/brand-logo";
import { T } from "./i18n/t";
import PageLines from "./brand/page-lines";
import Sunburst from "./brand/sunburst";
import { FacebookIcon, MailIcon, WhatsAppIcon } from "./brand/icons";
import { DEFAULT_LOGO_URL, LOGO_ALT, type SocialConfig, whatsappHref } from "@/lib/site-defaults";

/**
 * Storefront footer (Server Component): solid black with red accents,
 * a layered "book pages" top edge, contact details and social icon buttons.
 */
export default function StorefrontFooter({
  social,
  bookCount,
  logoUrl = DEFAULT_LOGO_URL,
}: {
  social: SocialConfig;
  bookCount?: number;
  logoUrl?: string;
}) {
  const year = new Date().getFullYear();
  const count = bookCount ? ` (${bookCount})` : "";

  const socials = [
    { href: social.facebook, label: "Facebook — Muthamilarignar Pathipagam", Icon: FacebookIcon },
    { href: `mailto:${social.email}`, label: `Email / Gmail — ${social.email}`, Icon: MailIcon },
    { href: whatsappHref(social), label: `WhatsApp — ${social.whatsappDisplay}`, Icon: WhatsAppIcon },
  ];

  const linkCls = "inline-flex min-h-[44px] items-center text-white/85 transition-colors hover:text-white active:opacity-80";

  return (
    <footer className="mt-16">
      <PageLines className="h-8 sm:h-10" />
      <div className="pattern-white-dots relative overflow-hidden bg-brand-black text-white">
        <div className="h-1 w-full bg-brand-red" aria-hidden="true" />
        <Sunburst className="pointer-events-none absolute -right-16 -top-4 w-72 opacity-[0.06] sm:w-96" />
        <div className="container-site relative py-14 lg:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Link href="/" prefetch={false} className="inline-block" aria-label={LOGO_ALT}>
                <div className="inline-flex items-center justify-center rounded-xl bg-white px-2.5 py-1.5 shadow-md">
                  <BrandLogo
                    src={logoUrl}
                    targetWidth={256}
                    sizes="79px"
                    className="h-16"
                  />
                </div>
              </Link>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/85">
                <T
                  ta="திராவிட இயக்க வரலாறு, சமூகநீதி, மாநில சுயாட்சி மற்றும் முத்தமிழறிஞர் கலைஞர் அவர்களின் படைப்புகளைத் தாங்கி வரும் அதிகாரப்பூர்வப் பதிப்பகம்."
                  en="The official publishing house for Dravidian movement history, social justice, state autonomy and the works of Muthamilarignar Kalaignar."
                />
              </p>
              <ul className="mt-6 flex items-center gap-3" aria-label="Social">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-white transition-all hover:border-brand-red hover:bg-[#D11D1A] active:scale-[0.96]"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#FF6B68]">
                <T ta="நூலகம் & பதிப்பகம்" en="Bookstore & Press" />
              </p>
              <ul className="space-y-1 text-[15.5px]">
                <li><Link href="/books" prefetch={false} className={linkCls}><T ta={`அனைத்து நூல்கள்${count}`} en={`All books${count}`} /></Link></li>
                <li><Link href="/about" prefetch={false} className={linkCls}><T ta="பதிப்பகம் பற்றி" en="About publisher" /></Link></li>
                <li><Link href="/authors" prefetch={false} className={linkCls}><T ta="ஆசிரியர்கள்" en="Authors" /></Link></li>
                <li><Link href="/faq" prefetch={false} className={linkCls}><T ta="வினா-விடை (FAQ)" en="FAQ" /></Link></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#FF6B68]">
                <T ta="கொள்கைகள் & கணக்கு" en="Policies & Account" />
              </p>
              <ul className="space-y-1 text-[15.5px]">
                <li><Link href="/policies/shipping" prefetch={false} className={linkCls}><T ta="விநியோகக் கொள்கை" en="Shipping policy" /></Link></li>
                <li><Link href="/policies/returns" prefetch={false} className={linkCls}><T ta="மாற்று & பணம் திரும்ப" en="Returns & refunds" /></Link></li>
                <li><Link href="/policies/privacy" prefetch={false} className={linkCls}><T ta="தனியுரிமைக் கொள்கை" en="Privacy policy" /></Link></li>
                <li><Link href="/policies/terms" prefetch={false} className={linkCls}><T ta="விதிமுறைகள்" en="Terms & conditions" /></Link></li>
                <li><Link href="/account" prefetch={false} className={linkCls}><T ta="என் கணக்கு" en="Reader account" /></Link></li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[#FF6B68]">
                <T ta="தொடர்புக்கு" en="Contact" />
              </p>
              <p className="mb-3 whitespace-pre-line text-[13.5px] leading-relaxed text-white/80">
                <T
                  ta="முத்தமிழறிஞர் பதிப்பகம், திமுக இளைஞர் அணி, அன்பகம், 614, அண்ணா சாலை, தேனாம்பேட்டை, சென்னை - 600 018"
                  en={"Muthamizharingnar Publication\nDMK Youth Wing\nAnbagam, 614, Anna Salai,\nTeynampet, Chennai - 600 018"}
                />
              </p>
              <ul className="space-y-2 text-[14.5px]">
                <li>
                  <a href={whatsappHref(social)} target="_blank" rel="noopener noreferrer" className={`gap-2.5 ${linkCls}`}>
                    <WhatsAppIcon className="h-4 w-4 flex-shrink-0 text-[#FF6B68]" /> +91 {social.whatsappDisplay}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${social.email}`} className={`gap-2.5 break-all ${linkCls}`}>
                    <MailIcon className="h-4 w-4 flex-shrink-0 text-[#FF6B68]" /> {social.email}
                  </a>
                </li>
                <li>
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className={`gap-2.5 ${linkCls}`}>
                    <FacebookIcon className="h-4 w-4 flex-shrink-0 text-[#FF6B68]" /> Facebook
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-[13px] text-white/75 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} <T ta="முத்தமிழறிஞர் பதிப்பகம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை." en="Muthamilarignar Pathipagam. All rights reserved." />
            </p>
            <p>
              <T ta="இந்தியா முழுவதும் விநியோகம் • பாதுகாப்பான கட்டணம் • COD" en="Pan-India delivery • Secure checkout • Cash on delivery" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}