import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { BillCard, DEMO_BILL, useBillStory } from '../BillCard';
import { EASE, H1, LABEL, LEAD, WRAP, btnPrimary, btnQuiet } from '../kit';

export function Hero() {
  const reduce = useReducedMotion();
  // The loop only runs while the card is on screen, so it never burns timers behind the fold.
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { amount: 0.2 });
  const state = useBillStory(inView);

  // One short stagger on mount, once. Under reduced motion everything is simply present.
  // The text only rises; it never starts invisible, so the headline is on screen at the first paint. The card also fades.
  const rise = (i: number, fade = false) => ({
    initial: reduce ? (false as const) : fade ? { opacity: 0, y: 18 } : { y: 18 },
    animate: fade ? { opacity: 1, y: 0 } : { y: 0 },
    transition: { duration: 0.55, delay: 0.07 * i, ease: EASE },
  });

  return (
    <section className="pt-12 pb-14 md:pt-16 lg:pt-24 lg:pb-16">
      {/* Below lg the grid is one column: text first, the bill card after it. From lg the text track is fixed
          so that "Get paid today." (about 520px at 76px) always stays on one line. */}
      <div className={`${WRAP} grid items-center gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,548px)_minmax(0,1fr)] xl:gap-x-16`}>
        <div>
          <motion.p className={LABEL} {...rise(0)}>
            On Tempo testnet
          </motion.p>
          <motion.h1 className={`${H1} mt-5`} {...rise(1)}>
            <span className="block">Ship today.</span> <span className="block lg:whitespace-nowrap">Get paid today.</span>
          </motion.h1>
          <motion.p className={`${LEAD} mt-6 max-w-[50ch]`} {...rise(2)}>
            Hisab advances most of an export invoice on shipment day, then settles the rest when the buyer pays in stablecoin.
          </motion.p>
          <motion.div className="mt-9 flex flex-wrap gap-3" {...rise(3)}>
            <a className={btnPrimary} href="#calculator">
              Run your invoice
            </a>
            <a className={btnQuiet} href="#pitch">
              Watch the pitch
            </a>
          </motion.div>
        </div>

        <div ref={cardRef} className="relative w-full max-w-[560px] pt-[50px] lg:pt-16 xl:pt-[88px]">
          {/* Day 0 is the claim: the exporter is paid on shipment day. The card covers the lower part of the numeral. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 w-full select-none overflow-hidden whitespace-nowrap font-mono text-[88px] font-semibold leading-none tracking-[-0.06em] text-line tabular before:content-['DAY_0'] lg:text-[112px] xl:text-[152px]"
          />
          {/* Only the card and its caption take part in the entrance; the numeral behind them is there from the first paint. */}
          <motion.div className="relative" {...rise(4, true)}>
            <BillCard bill={{ ...DEMO_BILL, state }} />
            <p className="mt-4 text-[13px] text-muted">An example bill, playing on a loop.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
