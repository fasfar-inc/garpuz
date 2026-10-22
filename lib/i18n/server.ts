import "server-only";

import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, dictionaries, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/dictionaries";

export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accepted = (await headers()).get("accept-language") ?? "";
  return /^tr\b/i.test(accepted.trim()) ? "tr" : DEFAULT_LOCALE;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
