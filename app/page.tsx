import { redirect } from "next/navigation";
import { DEFAULT_TENANT } from "@/lib/site-defaults";

export default function RootPage() {
  // TODO shopify: flatten `[tenant]` route prefix once single-store Shopify routing is finalized
  redirect(`/${DEFAULT_TENANT}`);
}
