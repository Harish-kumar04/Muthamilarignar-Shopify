"use client";

import { useEffect, useState } from "react";
import { T } from "@/components/i18n/t";
import { KALAIGNAR_ABOUT_COPY } from "@/lib/i18n";

const SECTION_ID = "kalaignar-books-banner";
const SECOND_PARA_ID = "kalaignar-about-para-2";

/**
 * Crawlable bilingual "Muthamizh Arignar Kalaignar" About block inside the
 * Kalaignar portrait section on `/`.
 *
 * - Dynamically syncs `--ann-bar-h` and `--site-header-h` CSS variables from the live
 *   announcement bar and sticky header DOM elements via ResizeObserver (no magic numbers).
 * - Both paragraphs are always rendered into the SSR HTML for search engines & AI crawlers.
 * - Desktop & tablet (`>=768px`, `md:`): shows both paragraphs, hides Read more toggle.
 * - Phones (`<768px`): shows paragraph 1 plus an accessible `aria-expanded` Read more toggle.
 */
export default function KalaignarAboutBlock() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const sec = document.getElementById(SECTION_ID);
    if (!sec) return;

    const syncHeights = () => {
      const annEl = document.querySelector<HTMLElement>(
        '[aria-label="Store announcement"]',
      );
      const headerEl = document.querySelector<HTMLElement>("header");
      const annH = annEl ? annEl.getBoundingClientRect().height : 0;
      const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
      sec.style.setProperty("--ann-bar-h", `${annH}px`);
      sec.style.setProperty("--site-header-h", `${headerH}px`);
    };

    syncHeights();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(syncHeights)
        : null;
    const annEl = document.querySelector<HTMLElement>(
      '[aria-label="Store announcement"]',
    );
    const headerEl = document.querySelector<HTMLElement>("header");
    if (ro) {
      if (annEl) ro.observe(annEl);
      if (headerEl) ro.observe(headerEl);
    }
    window.addEventListener("resize", syncHeights);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", syncHeights);
    };
  }, []);

  return (
    <div>
      <h2
        style={{ fontSize: "clamp(20px, 2vw, 28px)" }}
        className="font-extrabold leading-[1.2] tracking-tight text-black"
      >
        <T
          ta={KALAIGNAR_ABOUT_COPY.heading.ta}
          en={KALAIGNAR_ABOUT_COPY.heading.en}
        />
      </h2>

      <div aria-hidden="true" className="mt-2 h-1 w-12 rounded-full bg-brand-red" />

      <div
        style={{
          fontSize: "clamp(15.5px, 1.1vw + 6px, 18px)",
          lineHeight: 1.6,
        }}
        className="mt-3 text-black/80"
      >
        <p>
          <T
            ta={KALAIGNAR_ABOUT_COPY.paragraph1.ta}
            en={KALAIGNAR_ABOUT_COPY.paragraph1.en}
          />
        </p>

        <p
          id={SECOND_PARA_ID}
          className={expanded ? "mt-[10px] block" : "mt-[10px] hidden md:block"}
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
