import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Garpuz — Find it locally", template: "%s | Garpuz" },
  description: "Search products from trusted local shops across North Cyprus and compare prices.",
  icons: { icon: "/watermelon-mark.png" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLang();
  return <html lang={lang}><body>{children}</body></html>;
}
