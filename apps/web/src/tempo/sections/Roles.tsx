import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from '@phosphor-icons/react';
import { BillCard, DEMO_BILL, type Focus } from '../BillCard';
import type { BillState } from '../chain';
import { DEMO } from '../config';
import { EASE, H2, H3, Reveal, Section, btnPrimary } from '../kit';

function M({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.9em] tabular text-text">{children}</span>;
}

type RoleId = 'exporter' | 'financier' | 'buyer';
type Role = {
  id: RoleId;
  label: string;
  wants: string;
  steps: ReactNode[];
  cta: { label: string; href: string };
  // The bill as this role sees it: the state it is in and the row that matters to them.
  state: BillState;
  focus: Focus;
};

const ROLES: Role[] = [
  {
    id: 'exporter',
    label: 'Exporter',
    wants: 'cash on shipment day',
    steps: [
      'Hash the shipping bill and register it.',
      'A financier funds the bill, and the advance arrives the same day.',
      'Receive the remainder when the buyer pays.',
    ],
    cta: { label: 'Get started', href: '/start#exporter' },
    state: 'FINANCED',
    focus: 'finance',
  },
  {
    id: 'financier',
    label: 'Financier',
    wants: 'short-dated yield with no double pledge',
    steps: [
      'Approve pathUSD to the vault.',
      <>
        Call <M>finance()</M> to pay the advance and lock the receivable.
      </>,
      'Get principal and interest back first when the buyer pays.',
    ],
    cta: { label: 'Get started', href: '/start#financier' },
    state: 'REALISED',
    focus: 'settle',
  },
  {
    id: 'buyer',
    label: 'Buyer',
    wants: 'a simple way to pay',
    steps: [
      'Open the pay link.',
      'Copy the amount, vault address and memo.',
      'Send pathUSD with the memo from any wallet. No account needed.',
    ],
    cta: { label: 'Demo pay page', href: `/pay/${DEMO.sbHash}` },
    state: 'REALISED',
    focus: 'pay',
  },
];

export function Roles() {
  const reduce = !!useReducedMotion();
  const uid = useId();
  const [id, setId] = useState<RoleId>('exporter');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const role = ROLES.find((r) => r.id === id) ?? ROLES[0];

  // Arrow keys, Home and End move between tabs and select as they go (the tablist pattern).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = ROLES.findIndex((r) => r.id === id);
    const to =
      e.key === 'ArrowRight' ? (at + 1) % ROLES.length : e.key === 'ArrowLeft' ? (at + ROLES.length - 1) % ROLES.length : e.key === 'Home' ? 0 : e.key === 'End' ? ROLES.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setId(ROLES[to].id);
    tabs.current[to]?.focus();
  };

  // Reduced motion: every transition below has zero duration, so the panel swaps and the underline jumps.
  const swap = reduce ? { duration: 0 } : { duration: 0.2, ease: EASE };

  // Layout contract. md and up: the role's list on the left, its bill on the right. Below md (768px): one column,
  // the list first and the bill under it. The three tabs always sit in one row above both.
  return (
    <Section id="who" tone="sunken">
      <Reveal>
        <h2 className={`${H2} max-w-[24ch] text-balance`}>Three parties. Only two need an account.</h2>
      </Reveal>

      <Reveal delay={0.08} className="mt-10 md:mt-14">
        <div
          role="tablist"
          aria-label="Choose a role"
          onKeyDown={onKeyDown}
          className="flex gap-7 border-b border-line md:gap-12"
        >
          {ROLES.map((r, i) => {
            const on = r.id === id;
            return (
              <button
                key={r.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${r.id}`}
                aria-selected={on}
                aria-controls={`${uid}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => setId(r.id)}
                className={`relative -mb-px px-0.5 py-4 font-display text-[20px] font-semibold tracking-[-0.01em] transition-colors duration-150 ease-ledger active:translate-y-px ${
                  on ? 'text-text' : 'text-muted hover:text-text'
                }`}
              >
                {r.label}
                {on && (
                  <motion.span
                    layoutId="roles-underline"
                    className="absolute inset-x-0 bottom-0 h-[3px] bg-accent"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-12 md:grid-cols-2 md:items-start md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-20">
          <div>
            {/* The words cross-fade with a few pixels of travel, so the eye reads the swap as a new role, not a glitch. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={role.id}
                role="tabpanel"
                id={`${uid}-panel`}
                aria-labelledby={`${uid}-tab-${role.id}`}
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -6, transition: reduce ? { duration: 0 } : { duration: 0.12, ease: EASE } }}
                transition={swap}
              >
                <p className={H3}>
                  <span className="text-muted">Wants:</span> {role.wants}
                </p>
                <ol className="mt-8 divide-y divide-line border-y border-line">
                  {role.steps.map((s, i) => (
                    <li key={i} className="grid grid-cols-[1.75rem_1fr] items-baseline gap-x-3 py-4 text-[17px] leading-snug md:text-[18px]">
                      <span className="font-mono text-[13px] tabular text-accent-text">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                <a className={`${btnPrimary} mt-8`} href={role.cta.href}>
                  {role.cta.label}
                  <ArrowRight size={16} aria-hidden />
                </a>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* One card for all three roles, so a tab change shows the same bill moving to the state this role cares about. */}
          <div>
            <BillCard bill={{ ...DEMO_BILL, state: role.state }} focus={role.focus} />
            <p className="mt-4 text-[13px] text-muted">The same bill, as the {role.label.toLowerCase()} sees it.</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
