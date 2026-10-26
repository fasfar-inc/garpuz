import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext", "greek"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "FASFAR — Different ventures. One vision.", template: "%s — FASFAR" },
  description: "FASFAR builds and scales digital products and ventures that create meaningful impact around the world.",
};

export const viewport: Viewport = {
  themeColor: "#f1ede6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={interTight.variable}>
      <body>{children}</body>
    </html>
  );
}
