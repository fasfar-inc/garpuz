import { featuredVentures } from "@/content/ventures";
import { hero } from "@/content/site";
import { PillLink } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/icons";

/** Facts derived from the venture registry — never hard-coded figures. */
function registryFacts() {
  const sectors = new Set(featuredVentures.map((v) => v.sector));
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    { value: pad(featuredVentures.length), label: "Ventures" },
    { value: pad(sectors.size), label: "Industries" },
    { value: "One", label: "Shared vision" },
  ];
}

/**
 * Scene 1 copy layer. Elements tagged `data-hero` leave on scroll; the
 * `data-intro` tags drive the entrance animation.
 */
export function HeroScene() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div data-hero className="absolute left-5 top-[96px] md:left-[4.2vw] md:top-[16%]">
        <span data-intro="rise" className="block h-px w-9 bg-(--ink)/60" />
        <p data-intro="rise" className="eyebrow mt-4 pl-0 md:pl-6">
          {hero.eyebrow[0]}
          <br />
          {hero.eyebrow[1]}
        </p>
      </div>

      <div className="absolute inset-x-5 bottom-[110px] md:bottom-[15%] md:left-[4.2vw] md:right-auto md:w-[min(40vw,520px)] tall:bottom-[20.5%]">
        <h1 data-hero className="text-[clamp(2.4rem,9.6vw,3.2rem)] font-light leading-[1.02] tracking-[-0.045em] text-(--ink) md:text-[clamp(2.4rem,min(4.1vw,7.4vh),4.1rem)]">
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-intro="line" className="block">
              {hero.headline[0]}
            </span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <span data-intro="line" className="block font-medium">
              {hero.headline[1]}
            </span>
          </span>
        </h1>
        <div data-hero>
          <p data-intro="rise" className="mt-4 max-w-[40ch] text-[15px] leading-[1.5] text-(--ink-muted) md:mt-5 md:text-[clamp(15px,1.25vw,18px)] tall:mt-7">
            {hero.body}
          </p>
        </div>
        <div data-hero className="pointer-events-auto mt-6 tall:mt-10">
          <div data-intro="rise">
            <PillLink href={hero.primaryCta.href} icon={<ArrowRight className="h-[18px] w-[18px]" />}>
              {hero.primaryCta.label}
            </PillLink>
          </div>
        </div>
      </div>

      <dl data-hero className="absolute right-[4.2vw] top-[57%] hidden border-l border-(--hairline-strong) pl-6 tall:block">
        {registryFacts().map((fact) => (
          <div key={fact.label} data-intro="rise" className="mb-7 last:mb-0">
            <dt className="sr-only">{fact.label}</dt>
            <dd>
              <span className="block text-[22px] tracking-[-0.02em] text-(--ink)">{fact.value}</span>
              <span className="block text-[14px] text-(--ink-muted)">{fact.label}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
