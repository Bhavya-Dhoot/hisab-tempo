import { Reveal, WRAP } from '../kit';

// Same height, radius and type as btnPrimary, re-coloured for the accent band: ink on turmeric reads at about 9:1 either way round.
// The base focus ring is turmeric, which vanishes on a turmeric band, so it is switched to ink here.
const BTN =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-ui px-5 text-base font-semibold ' +
  'transition-[transform,color,background-color,opacity] duration-150 ease-ledger active:translate-y-px focus-visible:outline-accent-ink';
const BTN_SOLID = `${BTN} bg-accent-ink text-accent hover:opacity-90`;
const BTN_OUTLINE = `${BTN} border-2 border-accent-ink text-accent-ink hover:bg-accent-ink hover:text-accent`;

export function FinalCta() {
  return (
    <section className="bg-accent py-24 text-accent-ink selection:bg-accent-ink selection:text-accent md:py-32">
      <div className={WRAP}>
        <Reveal>
          <h2 className="font-display text-[length:clamp(2rem,9.5vw,7.5rem)] font-bold leading-[0.95] tracking-[-0.035em]">
            <span className="block">Paid on day zero.</span>
            <span className="block">Settled by a memo.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12} className="mt-10 flex flex-wrap gap-3 md:mt-14">
          <a href="#calculator" className={BTN_SOLID}>
            Run your invoice
          </a>
          <a href="/start" className={BTN_OUTLINE}>
            Get started
          </a>
        </Reveal>
      </div>
    </section>
  );
}
