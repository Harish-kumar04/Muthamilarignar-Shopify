"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignupForm() {
  const search = useSearchParams();
  const next = search.get("next") || "/account";

  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      // TODO shopify: create customer via Shopify Storefront API `customerCreate`
      throw new Error("TODO shopify: customer signup is not connected yet");
    } catch (err: any) {
      setError(err.message || "Signup unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 space-y-3">
        <div className="text-center">
          <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-[13px] text-gray-500">
            Set up your account in under a minute.
          </p>
        </div>
        {error && (
          <p className="text-[13px] text-brand-red-dark rounded-xl border border-brand-red-soft bg-brand-red-light px-4 py-2">
            {error}
          </p>
        )}
        <input
          className="w-full h-12 rounded-full border border-gray-200 bg-white px-5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="First name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <input
          className="w-full h-12 rounded-full border border-gray-200 bg-white px-5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="Last name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <input
          type="email"
          required
          className="w-full h-12 rounded-full border border-gray-200 bg-white px-5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          required
          minLength={8}
          className="w-full h-12 rounded-full border border-gray-200 bg-white px-5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-red"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 rounded-full bg-brand-red disabled:bg-gray-300 text-white text-[15px] font-medium hover:bg-brand-red-dark transition-colors"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
        <p className="text-[13px] text-gray-500 text-center mt-2">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-brand-red hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-gray-500">Loading…</div>}>
      <SignupForm />
    </Suspense>
  );
}