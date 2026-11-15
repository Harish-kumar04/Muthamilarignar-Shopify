import Link from "next/link";
import BrandLogo from "@/components/brand/brand-logo";
import { DEFAULT_LOGO_URL, LOGO_ALT } from "@/lib/site-defaults";

export default function HeaderLogo({
  logoUrl = DEFAULT_LOGO_URL,
}: {
  logoUrl?: string;
}) {
  return (
    <Link
      href="/"
      prefetch={false}
      aria-label={LOGO_ALT}
      className="inline-flex flex-shrink-0 items-center rounded-xl border border-black/[0.06] bg-white px-2 py-1 shadow-sm transition-transform duration-150 hover:border-brand-red/30 active:scale-[0.98]"
    >
      <BrandLogo
        src={logoUrl}
        priority
        targetWidth={288}
        sizes="(max-width: 768px) 69px, 89px"
        className="h-[56px] md:h-[72px]"
      />
    </Link>
  );
}
