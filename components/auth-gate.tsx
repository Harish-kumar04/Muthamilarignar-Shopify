"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isStorefrontLoggedIn, subscribeStorefrontAuth } from "@/lib/auth";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(isStorefrontLoggedIn());
    const unsub = subscribeStorefrontAuth(() => setAuthed(isStorefrontLoggedIn()));
    return unsub;
  }, []);

  if (authed === null) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-[13px] text-gray-500">
        Loading…
      </div>
    );
  }

  if (!authed) {
    return <SignInPrompt />;
  }

  return <>{children}</>;
}

function SignInPrompt() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-900 text-white text-[20px] font-semibold">
          I
        </div>
        <h1 className="mt-6 text-[32px] sm:text-[40px] font-semibold tracking-tight text-gray-900">
          Sign in to continue
        </h1>
        <p className="mt-3 text-[15px] text-gray-500 max-w-md mx-auto">
          Your orders, returns, account details and consent preferences live
          behind sign-in. New here — create an account in under a minute.
        </p>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-4">
        <Link
          href="/login?next=/account"
          className="rounded-2xl border border-gray-100 bg-white p-6 hover:border-gray-300 transition-colors"
        >
          <p className="text-[15px] font-semibold text-gray-900">
            I already have an account
          </p>
          <p className="mt-1 text-[13px] text-gray-500">
            Sign in with email and password.
          </p>
          <p className="mt-4 text-[13px] font-medium text-brand-red">
            Sign in →
          </p>
        </Link>
        <Link
          href="/signup?next=/account"
          className="rounded-2xl border border-gray-900 bg-gray-900 p-6 hover:opacity-90 transition-opacity"
        >
          <p className="text-[15px] font-semibold text-white">
            Create an account
          </p>
          <p className="mt-1 text-[13px] text-gray-300">
            New here — set up your account in under a minute.
          </p>
          <p className="mt-4 text-[13px] font-medium text-white">
            Get started →
          </p>
        </Link>
      </div>

      <p className="mt-8 text-center text-[13px] text-gray-500">
        Just looking for an order?{" "}
        <Link
          href="/track"
          className="text-brand-red hover:underline"
        >
          Track your order by ID + email
        </Link>
      </p>
    </div>
  );
}