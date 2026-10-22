import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time; latin-ext covers Turkish characters.
const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getDictionary();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.meta.title, template: "%s | Garpuz" },
    description: t.meta.description,
    applicationName: "Garpuz",
    openGraph: {
      type: "website",
      siteName: "Garpuz",
      title: t.meta.title,
      description: t.meta.description,
      locale: locale === "tr" ? "tr_TR" : "en_GB",
      images: [{ url: "/watermelon-mark.png", width: 1536, height: 1024, alt: "Garpuz" }],
    },
    twitter: { card: "summary_large_image", title: t.meta.title, description: t.meta.description, images: ["/watermelon-mark.png"] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={await getLocale()} className={inter.variable}><body>{children}</body></html>;
}
