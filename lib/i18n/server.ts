import "server-only";

import { cookies, headers } from "next/headers";
import { dictionaries, isLang, LANG_COOKIE, type Lang } from "./dictionaries";

/** The visitor's language: their saved choice, else their browser, else English. */
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*tr\b/i.test(accept) ? "tr" : "en";
}

export async function getDictionary() {
  const lang = await getLang();
  return { lang, t: dictionaries[lang] };
}
