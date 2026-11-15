"use client";

import type { ImageLoader } from "next/image";
import Img from "@/components/ui/img";
import {
  DEFAULT_LOGO_URL,
  LOGO_ALT,
  LOGO_HEIGHT,
  LOGO_WIDTH,
  cloudinaryImageUrl,
  isCloudinaryUrl,
} from "@/lib/site-defaults";

const TRIMMED_LOGO_WIDTH = 770;
const TRIMMED_LOGO_HEIGHT = 625;

function buildCloudinaryLogoUrl(src: string, width: number): string {
  const clamped = Math.max(64, Math.min(1200, Math.round(width || 288)));
  const marker = "/image/upload/";
  const idx = src.indexOf(marker);
  if (idx === -1) return src;
  const after = src
    .slice(idx + marker.length)
    .replace(/^(?:e_trim:\d+\/)?(?:f_auto,q_auto,w_\d+\/)?/i, "");
  return `${src.slice(0, idx + marker.length)}e_trim:10/f_auto,q_auto,w_${clamped}/${after}`;
}

const trimmedLogoLoader: ImageLoader = ({ src, width }) => buildCloudinaryLogoUrl(src, width);

/**
 * Publisher brand logo (Asset A) rendered via next/image with Cloudinary transforms
 * (e_trim:10/f_auto,q_auto,w_<width>). Trims the 60% baked-in white JPEG border so
 * the actual emblem fills the 56px mobile / 72px desktop / 64px footer heights cleanly.
 */
export default function BrandLogo({
  src = DEFAULT_LOGO_URL,
  sizes = "(max-width: 768px) 69px, 89px",
  className = "h-[56px] md:h-[72px]",
  wrapperClassName = "",
  priority = false,
  targetWidth = 288,
}: {
  src?: string | null;
  sizes?: string;
  className?: string;
  wrapperClassName?: string;
  penSize?: "sm" | "md";
  priority?: boolean;
  targetWidth?: number;
}) {
  const rawSrc = src && src !== "/logo.jpg" ? src : DEFAULT_LOGO_URL;
  const isOfficialAssetA = isCloudinaryUrl(rawSrc) && rawSrc.includes("Logo_vuhujt");
  const intrinsicW = isOfficialAssetA ? TRIMMED_LOGO_WIDTH : LOGO_WIDTH;
  const intrinsicH = isOfficialAssetA ? TRIMMED_LOGO_HEIGHT : LOGO_HEIGHT;
  const effectiveSrc = isOfficialAssetA
    ? buildCloudinaryLogoUrl(rawSrc, targetWidth)
    : cloudinaryImageUrl(rawSrc, targetWidth);

  return (
    <span
      className={`relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white ${wrapperClassName}`}
      style={{ aspectRatio: `${intrinsicW} / ${intrinsicH}` }}
    >
      <Img
        src={effectiveSrc}
        loader={isOfficialAssetA ? trimmedLogoLoader : undefined}
        alt={`${LOGO_ALT} — அதிகாரப்பூர்வ இலச்சினை / Official Publisher Logo`}
        width={intrinsicW}
        height={intrinsicH}
        sizes={sizes}
        priority={priority}
        placeholder="empty"
        className={`w-auto object-contain ${className}`}
      />
    </span>
  );
}
