import type { ReactNode } from "react";
import Link from "next/link";
import Img from "@/components/ui/img";
import { T } from "@/components/i18n/t";
import { ArrowRightIcon } from "@/components/brand/icons";
import { SunburstBackdrop } from "@/components/brand/patterns";
import { KALAIGNAR_ABOUT_COPY } from "@/lib/i18n";
import { DEFAULT_LOGO_URL, cloudinaryImageUrl } from "@/lib/site-defaults";

/** Pencil sketch of Kalaignar speaking at a microphone (intrinsic 1120x1404). */
const KALAIGNAR_SPEECH_ART_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1790526460/1_cavhvy.webp";

/** Portrait illustration of M. K. Stalin (intrinsic 735x919, 4:5 ratio). */
const STALIN_ART_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1794754146/M_K_Stalin_Art_fqp4fs.jpg";

/** Monochrome seated portrait sketch of Udhayanidhi Stalin (intrinsic 1122x1402, 4:5 ratio). */
const UDHAYANIDHI_SEATED_PORTRAIT_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1795543292/Monochrome_Seated_Portrait_Sketch_sbtcsz.png";

type Bi = { readonly ta: string; readonly en: string };

const BODY_TEXT_CLASS =
  "text-base leading-[1.7] text-black/80 sm:text-[1.0625rem] [&_.i18n-ta]:text-[1.0625rem]";

function BlockHeading({ heading, role }: { heading: Bi; role?: Bi }) {
  return (
    <>
      <h2 className="text-[1.375rem] font-extrabold leading-[1.25] tracking-tight text-black sm:text-[1.625rem]">
        <T ta={heading.ta} en={heading.en} />
      </h2>
      {role && (
        <p className="mt-1 text-[0.90625rem] font-bold text-brand-red-dark sm:text-[0.9375rem]">
          <T ta={role.ta} en={role.en} />
        </p>
      )}
      <div aria-hidden="true" className="mt-2.5 h-1 w-12 rounded-full bg-brand-red" />
    </>
  );
}

/**
 * Shared full-width card for the alternating (zig-zag) About / leaders list:
 * - Mobile (< md): image on top, text below
 * - Desktop (md+): flex-row (image left) or flex-row-reverse (image right)
 * - Identical fixed 4:5 frame (220px mobile / 260px desktop) for all four rows
 */
function AboutEditorialCard({
  heading,
  role,
  body,
  imageSrc,
  imageAlt,
  reverse = false,
  isLogo = false,
  footer,
}: {
  heading: Bi;
  role?: Bi;
  body: Bi;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  isLogo?: boolean;
  footer?: ReactNode;
}) {
  return (
    <article
      className={`flex w-full flex-col items-center gap-6 rounded-2xl border border-black/10 bg-white p-5 shadow-card sm:p-7 md:gap-10 lg:gap-12 ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      <div className="flex shrink-0 justify-center">
        <div
          className={`relative aspect-[4/5] w-[220px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white md:w-[260px] ${
            isLogo ? "p-5" : ""
          }`}
        >
          {isLogo ? (
            <div className="relative h-full w-full">
              <Img
                src={cloudinaryImageUrl(imageSrc, 520)}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 220px, 260px"
                className="object-contain object-center"
              />
            </div>
          ) : (
            <Img
              src={cloudinaryImageUrl(imageSrc, 520)}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 220px, 260px"
              className="object-contain object-center p-1.5"
            />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <BlockHeading heading={heading} role={role} />
        <p className={`mt-3 max-w-[65ch] ${BODY_TEXT_CLASS}`}>
          <T ta={body.ta} en={body.en} />
        </p>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </article>
  );
}

/**
 * Home-page About / leaders section (Server Component, zero client JS):
 * Alternating (zig-zag) full-width cards on desktop; image-above-text on mobile.
 * 1. Muthamizharignar Kalaignar (image LEFT)
 * 2. Hon'ble M.K. Stalin (image RIGHT)
 * 3. Hon'ble Udhayanidhi Stalin (image LEFT)
 * 4. Muthamizharignar Pathippagam (logo RIGHT + View books CTA under text)
 * All images are lazy-loaded (below the fold, never LCP) with reserved 4:5 frames.
 */
export function KalaignarArtworkBanner() {
  const { kalaignar, stalin, udhayanidhi, pathippagam } = KALAIGNAR_ABOUT_COPY;

  return (
    <section
      id="kalaignar-books-banner"
      aria-label="முத்தமிழறிஞர் கலைஞர் | Muthamizharignar Kalaignar"
      className="pattern-red-dots relative overflow-hidden border-y border-black/[0.08] bg-white py-10 sm:py-14"
    >
      <h1 className="sr-only">
        <T
          ta={KALAIGNAR_ABOUT_COPY.srOnlyHeading.ta}
          en={KALAIGNAR_ABOUT_COPY.srOnlyHeading.en}
        />
      </h1>

      <SunburstBackdrop position="right" />

      <div className="container-site relative">
        <div className="flex flex-col gap-6 sm:gap-7">
          {/* Row 1: Kalaignar — image LEFT, text RIGHT */}
          <AboutEditorialCard
            heading={kalaignar.heading}
            body={kalaignar.body}
            imageSrc={KALAIGNAR_SPEECH_ART_URL}
            imageAlt={`${kalaignar.imageAlt.ta} / ${kalaignar.imageAlt.en}`}
          />

          {/* Row 2: M.K. Stalin — text LEFT, image RIGHT */}
          <AboutEditorialCard
            heading={stalin.heading}
            role={stalin.role}
            body={stalin.body}
            imageSrc={STALIN_ART_URL}
            imageAlt="மாண்புமிகு மு.க.ஸ்டாலின் / M.K. Stalin"
            reverse
          />

          {/* Row 3: Udhayanidhi Stalin — image LEFT, text RIGHT */}
          <AboutEditorialCard
            heading={udhayanidhi.heading}
            role={udhayanidhi.role}
            body={udhayanidhi.body}
            imageSrc={UDHAYANIDHI_SEATED_PORTRAIT_URL}
            imageAlt="மாண்புமிகு உதயநிதி ஸ்டாலின் / Udhayanidhi Stalin"
          />

          {/* Row 4: Muthamizharignar Pathippagam — text LEFT, logo RIGHT + CTA under text */}
          <AboutEditorialCard
            heading={pathippagam.heading}
            body={pathippagam.body}
            imageSrc={DEFAULT_LOGO_URL}
            imageAlt="முத்தமிழறிஞர் பதிப்பகம் / Muthamizharignar Pathippagam logo"
            reverse
            isLogo
            footer={
              <Link
                href="/books"
                prefetch={false}
                className="btn-red h-11 px-6 text-[15px] shadow-glow"
              >
                <T
                  ta={KALAIGNAR_ABOUT_COPY.viewBooks.ta}
                  en={KALAIGNAR_ABOUT_COPY.viewBooks.en}
                />
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </div>
    </section>
  );
}

/**
 * "Kalaignar legacy / திராவிட இயக்க மரபு" feature section on the home page
 * showcasing Asset C (735x919 black-and-white portrait art of M. K. Stalin)
 * with a short caption and a "View books" button linking to /books.
 */
export function DravidianLegacyFeature() {
  return (
    <section
      aria-label="திராவிட இயக்க மரபு | Kalaignar legacy"
      className="relative overflow-hidden border-t border-black/[0.08] bg-white py-14 sm:py-20"
    >
      <div className="container-site relative">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: Heading, short caption, and View books CTA */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            <p className="eyebrow">
              <T ta="திராவிட இயக்க மரபு" en="Kalaignar legacy" />
            </p>
            <h2 className="mt-2 text-[26px] font-extrabold leading-[1.18] tracking-tight text-black sm:text-[34px] lg:text-[40px]">
              <T
                ta="திராவிட இயக்க மரபு"
                en="Kalaignar legacy & Dravidian movement"
              />
            </h2>
            <div aria-hidden="true" className="mt-3 h-1 w-14 rounded-full bg-brand-red" />
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-black/80 sm:text-[17px]">
              <T
                ta="முத்தமிழறிஞர் பதிப்பகத்தின் திராவிட இயக்கம் மற்றும் கலைஞர் மரபு சார்ந்த தமிழ் நூல்கள் தொகுப்பு."
                en="Explore Tamil books on the Dravidian movement and Kalaignar legacy from Muthamilarignar Pathipagam."
              />
            </p>
            <div className="mt-7">
              <Link
                href="/books"
                prefetch={false}
                className="btn-black h-12 px-7 text-[15.5px]"
              >
                <T ta="நூல்களைக் காண்க" en="View books" />
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right: Portrait Artwork Frame (Asset C: 735x919) */}
          <div className="order-1 mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:order-2 lg:col-span-5 lg:max-w-[360px]">
            <figure className="overflow-hidden rounded-3xl border border-black/10 bg-[#FAFAFA] p-3 shadow-card">
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                <Img
                  src={cloudinaryImageUrl(STALIN_ART_URL, 735)}
                  alt="மு. க. ஸ்டாலின் அவர்களின் கருப்பு-வெள்ளை உருவ ஓவியம் | Black-and-white portrait illustration of M. K. Stalin"
                  width={735}
                  height={919}
                  sizes="(max-width: 640px) 82vw, 360px"
                  className="h-auto w-full bg-white object-contain"
                />
              </div>
              <figcaption className="mt-2.5 px-1 text-center text-[13.5px] font-medium text-black/70">
                <T
                  ta="மு. க. ஸ்டாலின் — உருவ ஓவியம்"
                  en="M. K. Stalin — Portrait Illustration"
                />
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}

const WHITE_LOGO_BANNER_URL =
  "https://res.cloudinary.com/dikaxqooz/image/upload/v1794758234/shopify_white_logo_banner_8k_rn9z1s.png";

/**
 * Dark brand strip near the bottom of the home page showcasing Asset D
 * (`shopify_white_logo_banner_8k_rn9z1s.png`, intrinsic 1200x323 wide banner).
 * Placed exclusively on a rich black + red-accented band so the panoramic banner
 * stands out with crisp contrast while keeping its red/black publisher emblem sharp.
 */
export function DarkBrandBannerStrip() {
  return (
    <section
      aria-label="முத்தமிழறிஞர் பதிப்பகம் அடையாளப் பதாகை | Muthamilarignar Pathipagam Brand Strip"
      className="pattern-white-dots relative overflow-hidden border-y-2 border-brand-red bg-brand-black py-10 sm:py-14"
    >
      <div className="container-site relative">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl">
          <Img
            src={cloudinaryImageUrl(WHITE_LOGO_BANNER_URL, 1200)}
            alt="முத்தமிழறிஞர் பதிப்பகம் அதிகாரப்பூர்வ இலச்சினைப் பதாகை | Muthamilarignar Pathipagam Official Publisher Logo Banner"
            width={1200}
            height={323}
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 86vw, 896px"
            className="h-auto w-full object-contain"
          />
        </div>
      </div>
    </section>
  );
}
