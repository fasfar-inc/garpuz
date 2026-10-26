import { showcase } from "@/content/site";
import { ventures } from "@/content/ventures";

/** The ventures' primaries, swept through "DIFFERENT WORLDS." — one colour per world. */
const spectrum = ventures.map((v) => v.colors.primary).join(", ");

/**
 * Scene 4 opener: BIG IDEAS. / DIFFERENT WORLDS. Words rise through masks
 * with a little perspective (as in Scene 3), then the second line's ink
 * sweeps into the ventures' brand colours. The showcase drives it.
 */
export function ShowcaseIntro() {
  const [first, second] = showcase.headline;
  return (
    <div data-sv-intro className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-[#f1ede6] px-5 py-28 text-[#141312] md:px-[4.2vw]">
      <p data-intro-copy className="eyebrow flex items-center gap-3">
        <span className="tabular-nums">04</span>
        <span className="h-px w-5 bg-current opacity-60" />
        {showcase.eyebrow}
      </p>
      <h2 aria-label={showcase.headline.join(" ")} className="mt-8 text-[15vw] font-medium leading-[0.9] tracking-[-0.05em] md:mt-10 md:text-[min(9.2vw,17vh)]">
        <Line words={first.split(" ")} />
        <Line words={second.split(" ")} gradient className="md:text-right" />
      </h2>
      <p data-intro-copy className="mt-10 max-w-[22ch] text-[clamp(1.35rem,5.6vw,1.6rem)] font-light leading-[1.2] tracking-[-0.03em] md:ml-auto md:mt-14 md:max-w-[26ch] md:text-right md:text-[clamp(1.5rem,2.2vw,2.3rem)]">
        {showcase.body}
      </p>
    </div>
  );
}

function Line({ words, gradient, className }: { words: string[]; gradient?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`block ${className ?? ""}`}>
      {words.map((word) => (
        <span key={word} className="inline-block overflow-hidden pb-[0.06em] align-top [perspective:900px] [&:not(:last-child)]:mr-[0.22em]">
          <span
            data-intro-word
            data-intro-gradient={gradient ? "" : undefined}
            className={gradient ? "inline-block origin-bottom bg-clip-text text-transparent [background-size:220%_100%]" : "inline-block origin-bottom"}
            style={gradient ? { backgroundImage: `linear-gradient(90deg, #141312 0%, #141312 46%, ${spectrum})`, backgroundPosition: "0% 0%" } : undefined}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}
