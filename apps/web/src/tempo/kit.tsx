import { useEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { money } from './maths';

// The marketing surface's shared scale. Every section uses these, so the pages read as one hand.
export const WRAP = 'mx-auto w-full max-w-[1200px] px-5 md:px-8';
export const H1 = 'text-balance font-display font-bold tracking-[-0.035em] leading-[0.95] text-[44px] sm:text-[58px] lg:text-[76px]';
export const H2 = 'text-balance font-display font-bold tracking-[-0.03em] leading-[1.02] text-[32px] md:text-[46px]';
export const H3 = 'font-display font-semibold tracking-[-0.02em] leading-tight text-[21px] md:text-[25px]';
export const LEAD = 'text-[17px] md:text-[19px] leading-relaxed text-muted';
// The small mono label. Rationed: at most one for every three sections on a page.
export const LABEL = 'font-mono text-[12px] uppercase tracking-[0.14em] text-accent-text';
export const btnPrimary =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-ui bg-accent px-5 text-base font-semibold text-accent-ink ' +
  'transition-transform duration-150 ease-ledger hover:brightness-105 active:translate-y-px';
export const btnQuiet =
  'inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-ui border border-line-strong px-5 text-base font-semibold ' +
  'transition-colors duration-150 ease-ledger hover:bg-surface active:translate-y-px';
export const link = 'text-accent-text underline underline-offset-2 hover:no-underline';
export const EASE = [0.16, 1, 0.3, 1] as const;

export function Section({
  id,
  tone = 'plain',
  className = '',
  children,
}: {
  id?: string;
  tone?: 'plain' | 'sunken';
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 md:py-28 ${tone === 'sunken' ? 'bg-sunken' : ''} ${className}`}>
      <div className={WRAP}>{children}</div>
    </section>
  );
}

// Enters once when scrolled into view. Under reduced motion it is simply there.
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// A money figure that counts to its value when the value changes. Writes text directly, so React does not re-render per frame.
export function CountUp({ to, dp = 2, duration = 0.9, className = '' }: { to: bigint; dp?: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    const target = Number(to) / 1e6;
    if (!el) return;
    if (reduce) {
      el.textContent = money(to, dp);
      from.current = target;
      return;
    }
    const controls = animate(from.current, target, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = money(BigInt(Math.round(v * 1e6)), dp);
      },
      onComplete: () => {
        el.textContent = money(to, dp);
      },
    });
    from.current = target;
    return () => controls.stop();
  }, [to, dp, duration, reduce]);
  return (
    <span ref={ref} className={`font-mono tabular ${className}`}>
      {money(to, dp)}
    </span>
  );
}
