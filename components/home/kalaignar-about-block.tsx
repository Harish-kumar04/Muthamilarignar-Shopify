"use client";

import { useState } from "react";
import { T } from "@/components/i18n/t";
import { KALAIGNAR_ABOUT_COPY } from "@/lib/i18n";

const SECOND_PARA_ID = "kalaignar-about-para-2";

/**
 * Crawlable bilingual "About Muthamizh Arignar Kalaignar" block inside the
 * Kalaignar portrait banner on `/`.
 *
 * - Both paragraphs are always rendered into the SSR HTML for search engines & AI crawlers.
 * - Desktop (`>=768px`, `md:`): both paragraphs are always visible.
 * - Mobile (`<768px`): shows paragraph 1 plus an accessible `aria-expanded` toggle for paragraph 2.
 */
export default function KalaignarAboutBlock() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-6 max-w-[60ch] border-t border-black/10 pt-5">
      <h3 className="text-[18px] font-bold leading-snug text-black sm:text-[19px]">
        <T
          ta={KALAIGNAR_ABOUT_COPY.heading.ta}
          en={KALAIGNAR_ABOUT_COPY.heading.en}
        />
      </h3>

      <div className="mt-2.5 text-[17px] leading-[1.7] text-black/80">
        <p>
          <T
            ta={KALAIGNAR_ABOUT_COPY.paragraph1.ta}
            en={KALAIGNAR_ABOUT_COPY.paragraph1.en}
          />
        </p>

        <p
          id={SECOND_PARA_ID}
          className={expanded ? "mt-3 block" : "mt-3 hidden md:block"}
        >
          <T
            ta={KALAIGNAR_ABOUT_COPY.paragraph2.ta}
            en={KALAIGNAR_ABOUT_COPY.paragraph2.en}
          />
        </p>
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={SECOND_PARA_ID}
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-bold text-brand-red-dark underline decoration-brand-red/40 underline-offset-4 transition-colors hover:text-brand-red md:hidden"
      >
        {expanded ? (
          <T
            ta={KALAIGNAR_ABOUT_COPY.readLess.ta}
            en={KALAIGNAR_ABOUT_COPY.readLess.en}
          />
        ) : (
          <T
            ta={KALAIGNAR_ABOUT_COPY.readMore.ta}
            en={KALAIGNAR_ABOUT_COPY.readMore.en}
          />
        )}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-150 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
