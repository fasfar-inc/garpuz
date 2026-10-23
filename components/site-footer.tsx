import Link from "next/link";
import { FooterLanguage } from "@/components/footer-language";
import { getDictionary } from "@/lib/i18n/server";
import { CONTACT_EMAIL, socialLinks, type SocialNetwork } from "@/lib/site";

const SOCIAL_LABELS: Record<SocialNetwork, string> = { instagram: "Instagram", facebook: "Facebook", x: "X" };

export async function SiteFooter() {
  const { locale, t } = await getDictionary();
  const socials = socialLinks();
  const link = "hover:text-[#07834A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#07834A]/40 rounded";
  return <footer className="bg-white px-5 py-5 sm:px-8 sm:py-6">
    <div className="mx-auto flex max-w-[1120px] items-start justify-between gap-4 text-[12.5px] text-[#4D5A52] sm:items-center sm:text-[14px]">
      <span className="hidden shrink-0 sm:block">© {new Date().getFullYear()} Garpuz</span>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 sm:gap-x-7">
        <Link href="/about" className={link}><span className="sm:hidden">{t.nav.aboutShort}</span><span className="hidden sm:inline">{t.nav.about}</span></Link>
        <Link href="/business/register" className={link}>{t.nav.addShop}</Link>
        <Link href="/privacy" className={link}>{t.nav.privacy}</Link>
        <Link href="/terms" className={link}>{t.nav.terms}</Link>
        <a href={`mailto:${CONTACT_EMAIL}`} className={link}>{t.nav.contact}</a>
      </nav>
      <div className="flex shrink-0 items-center gap-6">
        {socials.length > 0 && <ul className="hidden items-center gap-5 sm:flex">{socials.map(({ network, href }) => <li key={network}><a href={href} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[network]} className={`block text-[#26322B] ${link}`}><SocialIcon network={network} /></a></li>)}</ul>}
        <FooterLanguage locale={locale} label={t.nav.language} />
      </div>
    </div>
    <p className="mx-auto mt-4 max-w-[1120px] text-center text-[12px] text-[#4D5A52]/80 sm:text-[13px]">
      {t.nav.credit} <span className="font-semibold tracking-wide text-[#4D5A52]">FASFAR</span>
    </p>
  </footer>;
}

function SocialIcon({ network }: { network: SocialNetwork }) {
  const props = { viewBox: "0 0 24 24", className: "size-[19px]", "aria-hidden": true } as const;
  if (network === "instagram") return <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
  if (network === "facebook") return <svg {...props} fill="currentColor"><path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z" /></svg>;
  return <svg {...props} fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" /></svg>;
}
