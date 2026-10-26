import Link from "next/link";
import { companyInfo, companyInfoLabels, type CompanyInfo } from "@/content/company";
import { ArrowUpRight } from "@/components/ui/icons";

type Row = { key: string; primary: string; secondary?: string; meta?: string; href?: string };

/** Normalise each kind of company information into simple editorial rows. */
const rowsFor: { [K in keyof CompanyInfo]: (items: CompanyInfo[K]) => Row[] } = {
  history: (items) => items.map((h) => ({ key: h.year + h.title, meta: h.year, primary: h.title, secondary: h.body })),
  leadership: (items) => items.map((p) => ({ key: p.name, primary: p.name, meta: p.role, secondary: p.bio })),
  divisions: (items) => items.map((d) => ({ key: d.name, primary: d.name, secondary: d.description, href: d.href })),
  offices: (items) => items.map((o) => ({ key: o.city + o.country, primary: o.city, meta: o.country, secondary: o.address })),
  partnerships: (items) => items.map((p) => ({ key: p.name, primary: p.name, secondary: p.description, href: p.href })),
  announcements: (items) => items.map((a) => ({ key: a.date + a.title, meta: a.date, primary: a.title, href: a.href })),
};

/**
 * History, leadership, divisions, offices, partnerships and announcements —
 * each rendered only when it has verified entries in content/company.ts.
 * With every list empty (as now), this renders nothing at all.
 */
export function CompanyInfoBlocks() {
  const blocks = (Object.keys(companyInfo) as (keyof CompanyInfo)[])
    .map((key) => ({ key, label: companyInfoLabels[key], rows: rowsFor[key](companyInfo[key] as never) }))
    .filter((b) => b.rows.length > 0);
  if (blocks.length === 0) return null;

  return (
    <div className="mt-24 grid gap-16 md:mt-32 md:grid-cols-2 md:gap-x-[4vw]">
      {blocks.map((block) => (
        <section key={block.key} aria-label={block.label}>
          <p className="eyebrow">{block.label}</p>
          <ul className="mt-5 border-t border-[#141312]/15">
            {block.rows.map((row) => {
              const body = (
                <>
                  {row.meta && <span className="w-28 shrink-0 text-[13px] tabular-nums text-[#141312]/55">{row.meta}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] tracking-[-0.01em] text-[#141312]">{row.primary}</span>
                    {row.secondary && <span className="mt-1 block text-[14px] leading-[1.5] text-[#141312]/65">{row.secondary}</span>}
                  </span>
                  {row.href && <ArrowUpRight className="h-4 w-4 shrink-0 text-[#141312]/60" />}
                </>
              );
              return (
                <li key={row.key} className="border-b border-[#141312]/15">
                  {row.href ? (
                    <Link href={row.href} className="flex items-start gap-4 py-5 transition-opacity hover:opacity-70">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-4 py-5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
