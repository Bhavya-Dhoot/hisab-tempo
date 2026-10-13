import { useEffect, useRef } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { EASE, H2, H3, Reveal, Section } from '../kit';

const TILE = 'flex min-w-0 flex-1 flex-col rounded-ui border border-line p-6 lg:p-8';
const BODY = 'text-base leading-relaxed text-muted md:text-[17px]';

// The wrong characters in a mismatched reference. Colour plus a tinted ground, so it does not rely on colour alone.
function Bad({ children }: { children: string }) {
  return <span className="bg-danger-soft text-danger">{children}</span>;
}

// Counts the wait from 0 to 90 days once, when the tile scrolls into view. The number and the bar are written
// straight to the DOM from the animation, so React does not re-render per frame.
function CashGap() {
  const reduce = useReducedMotion();
  const tile = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const seen = useInView(tile, { once: true, amount: 0.5 });

  useEffect(() => {
    const n = num.current;
    const b = bar.current;
    if (!seen || reduce || !n || !b) return;
    const run = animate(0, 90, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => {
        n.textContent = String(Math.round(v));
        b.style.transform = `scaleX(${v / 90})`;
      },
      onComplete: () => {
        n.textContent = '90';
        b.style.transform = 'scaleX(1)';
      },
    });
    return () => run.stop();
  }, [seen, reduce]);

  return (
    <div ref={tile} className={`${TILE} bg-sunken`}>
      <div className="flex items-baseline gap-3 md:gap-4" aria-hidden>
        <span
          ref={num}
          className="inline-block w-[2ch] text-right font-mono text-[104px] font-medium leading-[0.85] tracking-[-0.04em] tabular md:text-[152px] xl:text-[184px]"
        >
          {reduce ? '90' : '0'}
        </span>
        <span className="text-[20px] text-muted md:text-[24px]">days</span>
      </div>
      <p className="sr-only">Payment arrives 60 to 90 days after shipment.</p>

      {/* A hairline track with a thicker fill, no filled background track. */}
      <div className="mt-8" aria-hidden>
        <div className="relative h-1.5">
          <div className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
          <div ref={bar} className="absolute inset-0 origin-left bg-accent" style={{ transform: reduce ? 'scaleX(1)' : 'scaleX(0)' }} />
        </div>
        <div className="mt-2.5 flex justify-between gap-4 text-[13px] text-muted">
          <span>Shipment day</span>
          <span>Buyer pays, 60 to 90 days later</span>
        </div>
      </div>

      <p className={`${H3} mb-10 mt-8 max-w-[34ch] text-balance`}>Working capital is locked in every shipment until the buyer pays.</p>

      <div className="mt-auto border-t border-line-strong pt-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-[26px] font-medium tracking-[-0.02em] tabular md:text-[32px]">USD 2.5 trillion</span>{' '}
          <span className="text-base text-muted md:text-[17px]">global trade finance gap</span>
        </div>
        <p className="mt-1 text-[13px] text-muted">Asian Development Bank, 2025 survey</p>
      </div>
    </div>
  );
}

export function Problem() {
  return (
    <Section id="problem">
      <h2 className={`${H2} max-w-4xl text-balance`}>Exporters wait 60 to 90 days for money they have already earned.</h2>

      {/* One column below md. From md: one tile across 7 of 12 columns, two stacked tiles across the other 5. */}
      <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-12">
        <Reveal className="flex md:col-span-7 md:col-start-1 md:row-span-2 md:row-start-1">
          <CashGap />
        </Reveal>

        <Reveal delay={0.08} className="flex md:col-span-5 md:col-start-8 md:row-start-1">
          <div className={`${TILE} bg-accent-soft`}>
            <h3 className={H3}>Wires that do not match</h3>
            <div
              className="mt-6 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-ui border border-line bg-raised px-4 py-3 font-mono text-[14px] leading-snug tabular md:text-[13px] lg:gap-x-4 lg:text-[16px]"
              role="group"
              aria-label="The wire reference reads INV 2, letter O, 24-25 slash, letter O, letter O, 91. The invoice reads INV 2024-25/0091."
            >
              <span className="text-muted">wire</span>
              <span className="whitespace-nowrap">
                INV 2<Bad>O</Bad>24-25/<Bad>OO</Bad>91
              </span>
              <span className="text-muted">invoice</span>
              <span className="whitespace-nowrap">INV 2024-25/0091</span>
            </div>
            <p className={`${BODY} mt-5`}>Wires arrive with wrong or missing references, so someone matches them by hand.</p>
          </div>
        </Reveal>

        <Reveal delay={0.16} className="flex md:col-span-5 md:col-start-8 md:row-start-2">
          <div className={`${TILE} bg-surface`}>
            <h3 className={H3}>One receivable, pledged twice</h3>
            <div
              className="mt-6 grid grid-cols-[auto_auto_1fr] grid-rows-2 items-center gap-x-3 gap-y-2"
              role="img"
              aria-label="Financier A and Financier B both point at the same single receivable."
            >
              <span className="inline-flex h-10 items-center whitespace-nowrap rounded-ui border border-line-strong px-3 text-[14px] font-medium">
                Financier A
              </span>
              <ArrowRight size={16} aria-hidden className="text-muted" />
              <div className="col-start-3 row-span-2 row-start-1 flex flex-col items-center justify-center self-stretch rounded-ui border border-text bg-raised px-3 text-center">
                <span className="font-mono text-[28px] leading-none tabular">1</span>{' '}
                <span className="mt-1.5 text-[13px] text-muted">receivable</span>
              </div>
              <span className="inline-flex h-10 items-center whitespace-nowrap rounded-ui border border-line-strong px-3 text-[14px] font-medium">
                Financier B
              </span>
              <ArrowRight size={16} aria-hidden className="text-muted" />
            </div>
            <p className={`${BODY} mt-5`}>A financier cannot see whether a receivable is already pledged elsewhere.</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
