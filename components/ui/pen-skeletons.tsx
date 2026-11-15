import PenLoader from "./pen-loader";

export function PenCardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="நூல் ஏற்றப்படுகிறது / Loading book"
      className="flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-card"
    >
      <div className="flex aspect-[3/4] w-full animate-pulse items-center justify-center bg-[#F4F4F5]">
        <PenLoader size="md" label="Loading book cover" />
      </div>
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-4 w-4/5 animate-pulse rounded-full bg-black/[0.08]" />
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-black/[0.05]" />
        <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-3">
          <div className="h-5 w-16 animate-pulse rounded-full bg-brand-red/15" />
          <div className="h-11 w-24 animate-pulse rounded-full bg-black/[0.07]" />
        </div>
      </div>
    </div>
  );
}

export function PenGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="நூல்கள் ஏற்றப்படுகின்றன / Loading books"
      className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PenCardSkeleton key={i} />
      ))}
    </div>
  );
}
