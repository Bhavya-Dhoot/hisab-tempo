import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Stamp } from '../ui/Stamp';
import type { BillState } from './chain';
import { CountUp, EASE } from './kit';
import { type Terms, VECTOR, exact, settle } from './maths';

// One shipping bill as a ledger page that fills in as the bill moves: registered, financed, settled.
// The same component is the hero object, the tour's subject, and the real bill on the pay page.
export type BillView = Terms & { sb: string; state: BillState; received?: bigint };
export type Focus = 'register' | 'finance' | 'lock' | 'pay' | 'settle';

export const DEMO_BILL: BillView = { ...VECTOR, sb: 'SB 6674321', state: 'OPEN' };

const STEP: Record<BillState, number> = { NONE: 0, OPEN: 1, FINANCED: 2, REALISED: 3, PARTIAL: 3 };
const LADDER = ['Registered', 'Financed', 'Settled'];

function Row({ on, lit, label, note, children }: { on: boolean; lit: boolean; label: string; note: string; children: ReactNode }) {
  return (
    <div
      className={`grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-l-2 py-3 pl-4 pr-1 transition-[opacity,border-color,background-color] duration-300 ease-ledger ${
        lit ? 'border-accent bg-accent-soft/40' : 'border-transparent'
      } ${on ? 'opacity-100' : 'opacity-35'}`}
    >
      <div className="min-w-0">
        <div className="text-[15px] font-medium">{label}</div>
        <div className="text-[13px] text-muted">{note}</div>
      </div>
      <div className="text-right text-[17px]">{on ? children : <span className="font-mono text-[13px] text-muted">pending</span>}</div>
    </div>
  );
}

// One figure on the card. Declared at module level so a figure keeps its place between renders and only counts when its value changes.
function Amount({ v, precise, className = '' }: { v: bigint; precise: boolean; className?: string }) {
  return precise ? <span className={`font-mono tabular ${className}`}>{exact(v)}</span> : <CountUp to={v} className={className} />;
}

// `precise` is for a real bill read from the chain: every amount is shown to its last unit and nothing counts up.
export function BillCard({
  bill,
  focus,
  precise = false,
  className = '',
}: {
  bill: BillView;
  focus?: Focus;
  precise?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const step = STEP[bill.state];
  const settled = step === 3;
  const received = bill.received ?? bill.invoice;
  // The vault does not store how much a short payment was. For a PARTIAL bill read from the chain, say so; never show a full split.
  const unknown = bill.state === 'PARTIAL' && bill.received === undefined;
  const blank = (text: string) => <span className="font-mono text-[13px] text-muted">{text}</span>;
  const split = settle(bill, received);
  const legs = [
    { name: 'Financier', value: split.toFinancier, tone: 'bg-accent' },
    { name: 'Platform', value: split.fee, tone: 'bg-line-strong' },
    { name: 'Exporter', value: split.toExporter, tone: 'bg-text' },
  ];
  return (
    <div className={`rounded-ui border border-line bg-raised shadow-lift ${className}`}>
      <div className={`flex items-start justify-between gap-4 border-l-2 p-5 pb-4 md:p-6 md:pb-4 ${focus === 'register' ? 'border-accent' : 'border-transparent'}`}>
        <div className="min-w-0">
          <div className="text-[13px] text-muted">Shipping bill</div>
          <div className={`truncate font-mono tabular ${bill.sb.length > 12 ? 'text-[17px]' : 'text-[22px]'}`}>{bill.sb}</div>
        </div>
        {bill.state === 'NONE' ? <Stamp tone="danger" label="Not found" size="lg" /> : <Stamp state={bill.state} size="lg" />}
      </div>

      <div className="px-5 md:px-6">
        <div className="text-[13px] text-muted">Invoice</div>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <Amount v={bill.invoice} precise={precise} className="text-[34px] leading-tight md:text-[40px]" />
          <span className="font-mono text-[13px] text-muted">pathUSD</span>
        </div>
        {/* The ladder: turmeric fills one rung per state, the way the design system reads a receivable. */}
        <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden>
          {LADDER.map((name, i) => (
            <div key={name}>
              <div className="h-1.5 overflow-hidden bg-line">
                <motion.div
                  className="h-full origin-left bg-accent"
                  initial={false}
                  animate={{ scaleX: step > i ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.5, ease: EASE }}
                />
              </div>
              <div className={`mt-1.5 text-[12px] ${step > i ? 'text-text' : 'text-muted'}`}>{name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 divide-y divide-line border-t border-line">
        <Row on={step >= 2} lit={focus === 'finance'} label="Advance to the exporter" note="Day 0, paid by the financier">
          <Amount v={bill.advance} precise={precise} />
        </Row>
        <Row on={step >= 2} lit={focus === 'lock'} label="Receivable locked" note="A second finance() reverts">
          <span className="font-mono text-[13px] text-accent-text">ALREADY_LOCKED</span>
        </Row>
        <Row on={settled} lit={focus === 'pay'} label="Buyer pays, memo is the bill hash" note={`Day ${bill.tenorDays}, from any wallet`}>
          {unknown ? blank('paid short') : <Amount v={received} precise={precise} />}
        </Row>
        <div className={`border-l-2 p-5 pt-4 transition-opacity duration-300 ease-ledger md:p-6 md:pt-4 ${focus === 'settle' ? 'border-accent bg-accent-soft/40' : 'border-transparent'} ${settled ? 'opacity-100' : 'opacity-35'}`}>
          <div className="flex h-2 gap-px" aria-hidden>
            {legs.map((l) => (
              <div key={l.name} className={`${l.tone} min-w-[3px]`} style={{ flex: `${settled && !unknown ? Number(l.value) : 1} 0 0` }} />
            ))}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {legs.map((l) => (
              <div key={l.name} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[12px] text-muted">
                  <span className={`${l.tone} inline-block h-2 w-2 shrink-0`} aria-hidden />
                  {l.name}
                </dt>
                <dd className="truncate text-[15px] md:text-[17px]">
                  {unknown ? blank('see explorer') : settled ? <Amount v={l.value} precise={precise} /> : blank('pending')}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

// Plays the bill's life on a loop for the hero: registered, financed, settled, then again.
// Holds on the settled page under reduced motion, or while `play` is false.
export function useBillStory(play: boolean): BillState {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const order: BillState[] = ['OPEN', 'FINANCED', 'REALISED'];
  const hold = [1700, 2400, 4200];
  useEffect(() => {
    if (reduce || !play) return;
    const id = setTimeout(() => setI((n) => (n + 1) % order.length), hold[i]);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, play, reduce]);
  return reduce ? 'REALISED' : order[i];
}
