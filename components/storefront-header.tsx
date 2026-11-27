import Link from "next/link";
import LanguageToggle from "./language-toggle";
import { AccountButton, CartButton, HeaderNav, type NavItem } from "./header/header-islands";
import HeaderLogo from "./header/header-logo";
import HeaderSearch, { type SearchBookItem } from "./header/header-search";
import {
  DEFAULT_LOGO_URL,
  DEFAULT_SOCIAL,
  isExternal,
  resolveLink,
  type AnnouncementConfig,
  type SocialConfig,
} from "@/lib/site-defaults";

const NAV: NavItem[] = [
  { path: "", ta: "முகப்பு", en: "Home" },
  { path: "/books", ta: "நூல்கள்", en: "Books" },
];

export default function StorefrontHeader({
  searchBooks = [],
  announcement,
  social = DEFAULT_SOCIAL,
  logoUrl = DEFAULT_LOGO_URL,
}: {
  searchBooks?: SearchBookItem[];
  announcement?: AnnouncementConfig;
  social?: SocialConfig;
  logoUrl?: string;
}) {
  const showAnnouncement = announcement ? announcement.enabled : true;
  const annTa =
    announcement?.ta ||
    "இந்தியா முழுவதும் டெலிவரி உண்டு • ரொக்கப் பணம் செலுத்தும் வசதி (COD) • 100% அதிகாரப்பூர்வப் பதிப்புகள்";
  const annEn =
    announcement?.en ||
    "Pan-India Delivery Available • Cash on Delivery (COD) • 100% Official Publisher Editions";
  const annHref = announcement?.link ? resolveLink(announcement.link) : null;

  const tickerText = (
    <>
      <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-brand-red" aria-hidden="true" />
      <span className="i18n-ta truncate">{annTa}</span>
      <span className="i18n-en truncate">{annEn}</span>
    </>
  );

  return (
    <>
      {/* 1. Admin-Controlled Top Announcement Ticker */}
      {showAnnouncement && (
        <div
          role="region"
          aria-label="Store announcement"
          className="border-b border-white/10 bg-black px-4 py-1.5 text-[12px] font-medium tracking-wide text-white"
        >
          <div className="container-site flex items-center justify-between gap-4">
            {annHref ? (
              isExternal(annHref) ? (
                <a
                  href={annHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2 hover:underline"
                >
                  {tickerText}
                </a>
              ) : (
                <Link href={annHref} prefetch={false} className="flex min-w-0 items-center gap-2 hover:underline">
                  {tickerText}
                </Link>
              )
            ) : (
              <div className="flex min-w-0 items-center gap-2">{tickerText}</div>
            )}

            <div className="hidden flex-shrink-0 items-center gap-4 text-[12px] text-white/80 md:flex">
              <a
                href={`tel:+${social.whatsapp}`}
                className="transition-colors hover:text-white"
              >
                +91 {social.whatsappDisplay}
              </a>
              <span className="text-white/30" aria-hidden="true">
                |
              </span>
              <span className="font-semibold text-white/90">முத்தமிழறிஞர் பதிப்பகம்</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sticky Header Bar — accommodates 56px mobile / 72px desktop logo with zero overlap */}
      <header className="sticky top-0 z-40 w-full border-b border-black/[0.08] bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container-site flex items-center justify-between gap-2 py-2 md:gap-5 lg:gap-6 lg:py-2.5">
          <HeaderLogo logoUrl={logoUrl} />

          <div className="hidden min-w-0 flex-1 md:mx-2 md:block md:max-w-md">
            <HeaderSearch books={searchBooks} />
          </div>

          <HeaderNav items={NAV} variant="desktop" />

          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 sm:gap-2.5 md:ml-0">
            <LanguageToggle />
            <AccountButton />
            <CartButton />
          </div>
        </div>

        {/* Dedicated mobile search row (<768px) so 56px logo, language switch, and search never overlap */}
        <div className="container-site pb-2.5 md:hidden">
          <HeaderSearch books={searchBooks} />
        </div>
      </header>
    </>
  );
}