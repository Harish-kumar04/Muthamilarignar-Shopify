"use client";

import { useLanguage } from "@/components/language-provider";

export const DEFAULT_FREE_SHIPPING_RUPEES = 500;

export default function FreeShippingBar({
  subtotalCents,
  thresholdRupees = DEFAULT_FREE_SHIPPING_RUPEES,
  className = "",
}: {
  subtotalCents: number;
  thresholdRupees?: number;
  className?: string;
}) {
  const { t } = useLanguage();
  const safeThresholdRupees =
    Number.isFinite(thresholdRupees) && thresholdRupees > 0
      ? thresholdRupees
      : DEFAULT_FREE_SHIPPING_RUPEES;
  const thresholdCents = Math.round(safeThresholdRupees * 100);
  const clamped = Math.max(0, subtotalCents || 0);
  const unlocked = clamped >= thresholdCents;
  const remainingCents = Math.max(0, thresholdCents - clamped);
  const remainingRupees = Math.ceil(remainingCents / 100);
  const pct = Math.min(100, Math.round((clamped / thresholdCents) * 100));

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-[13px] ${
        unlocked
          ? "border-green-200 bg-green-50 text-green-900"
          : "border-black/10 bg-[#FAFAFA] text-black"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 font-semibold">
        <span>
          {unlocked
            ? t(
                "✓ வாழ்த்துகள்! உங்களுக்கு இலவச விநியோகம் கிடைத்துள்ளது",
                "✓ You've unlocked FREE pan-India delivery!",
              )
            : t(
                `மேலும் ₹${remainingRupees.toLocaleString("en-IN")} சேர்த்தால் இலவச விநியோகம்!`,
                `Add ₹${remainingRupees.toLocaleString("en-IN")} more for FREE delivery!`,
              )}
        </span>
        <span className="text-[11.5px] font-bold text-black/70">{pct}%</span>
      </div>

      <div
        role="progressbar"
        aria-label={t("இலவச விநியோக நிலை", "Free shipping progress")}
        aria-valuenow={Math.min(safeThresholdRupees, Math.round(clamped / 100))}
        aria-valuemin={0}
        aria-valuemax={Math.round(safeThresholdRupees)}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10"
      >
        <div
          style={{ width: `${pct}%` }}
          className={`h-full rounded-full transition-all duration-300 ${
            unlocked ? "bg-green-600" : "bg-brand-red"
          }`}
        />
      </div>
    </div>
  );
}
