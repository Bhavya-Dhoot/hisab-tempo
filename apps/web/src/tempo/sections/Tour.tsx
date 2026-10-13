import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView, useReducedMotion } from 'motion/react';
import { BillCard, DEMO_BILL, type Focus } from '../BillCard';
import type { BillState } from '../chain';
import { H2, H3, LABEL, LEAD, Reveal, Section } from '../kit';
import { VECTOR, money, settle } from '../maths';

// Every figure below is read from the README test vector through maths.ts, so the copy cannot drift from the card.
const V = settle(VECTOR);
const INVOICE = money(VECTOR.invoice);
const ADVANCE = money(VECTOR.advance);
const TO_FINANCIER = money(V.toFinancier);
const FEE = money(V.fee);
const TO_EXPORTER = money(V.toExporter);

// A figure or identifier set in the mono face, so numbers and calls read as data inside a sentence.
function M({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[0.9em] tabular text-text">{children}</span>;
}

type StepDef = { title: string; state: BillState; focus: Focus; body: ReactNode; code: string; refusal?: boolean };

const STEPS: StepDef[] = [
  {
    title: 'Register the shipping bill',
    state: 'OPEN',
    focus: 'register',
    body: (
      <>
        The exporter registers the shipping bill. Its hash goes on-chain with the invoice amount of <M>{INVOICE}</M> and a
        tenor of <M>{VECTOR.tenorDays}</M> days.
      </>
    ),
    code: 'register(sbHash, invoice, tenorDays)',
  },
  {
    title: 'A financier pays the advance',
    state: 'FINANCED',
    focus: 'finance',
    body: (
      <>
        <M>88%</M> of <M>{INVOICE}</M> is <M>{ADVANCE}</M>, and it is in the exporter&rsquo;s wallet on shipment day. The vault pays
        it when a financier calls <M>finance()</M>, and locks the receivable.
      </>
    ),
    code: 'finance(sbHash, advance, rateBps)',
  },
  {
    title: 'A second financier is refused',
    state: 'FINANCED',
    focus: 'lock',
    body: (
      <>
        A second financier who calls <M>finance()</M> on the same bill reverts. The receivable is already locked, so it cannot be
        pledged twice.
      </>
    ),
    code: 'revert ALREADY_LOCKED()',
    refusal: true,
  },
  {
    title: 'The buyer pays from any wallet',
    state: 'REALISED',
    focus: 'pay',
    body: (
      <>
        The buyer sends pathUSD to the vault with the bill&rsquo;s hash as a 32-byte memo. Any wallet will do, and Tempo settles the
        transfer in about half a second.
      </>
    ),
    code: 'transferWithMemo(vault, amount, sbHash)',
  },
  {
    title: 'The memo is the match',
    state: 'REALISED',
    focus: 'pay',
    body: (
      <>
        The 32-byte memo is matched exactly, so nothing is reconciled by hand. A listener sees it and calls <M>realise()</M>, or
        the buyer calls <M>pay()</M> directly.
      </>
    ),
    code: 'realise(sbHash, received, payTx)',
  },
  {
    title: 'One contract pays everyone',
    state: 'REALISED',
    focus: 'settle',
    body: (
      <>
        The vault pays the financier <M>{TO_FINANCIER}</M> first, principal plus interest. The platform takes <M>{FEE}</M> and the
        exporter receives the remaining <M>{TO_EXPORTER}</M>.
      </>
    ),
    code: 'emit Realised(sbHash, received, toFinancier, fee, toExporter, payTx)',
  },
];

// The function name reads in full ink, its arguments recede. A refusal is the one red line on the page.
function Code({ code, refusal }: { code: string; refusal?: boolean }) {
  const open = code.indexOf('(');
  return (
    <code
      className={`mt-5 block w-fit max-w-full whitespace-normal rounded-ui border px-3.5 py-2.5 font-mono text-[13px] tabular md:text-[14px] ${
        refusal ? 'border-danger bg-danger-soft text-danger' : 'border-line bg-surface text-muted'
      }`}
    >
      {refusal ? (
        code
      ) : (
        <>
          <span className="text-text">{code.slice(0, open)}</span>
          {code.slice(open)}
        </>
      )}
    </code>
  );
}

// The ledger spine is drawn per step from that step's numeral, so it stays joined whatever height a step grows to.
// Numeral box is 28px (centre 14px). On lg the numeral centre sits at 31dvh, the middle of a 62dvh block.
const SPINE = 'absolute left-[13px] w-0.5 bg-accent';

function Step({
  index,
  step,
  active,
  reduce,
  onActive,
}: {
  index: number;
  step: StepDef;
  active: boolean;
  reduce: boolean;
  onActive: (i: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  // A thin band across the middle of the viewport: the step that crosses it is the one being read.
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  const first = index === 0;
  const last = index === STEPS.length - 1;
  const spine = first
    ? `${SPINE} top-[14px] bottom-0 lg:top-[31dvh]`
    : last
      ? `${SPINE} top-0 h-[14px] lg:h-[31dvh]`
      : `${SPINE} inset-y-0`;
  // Quieter inactive steps apply from lg only, where one step is read at a time. Below lg every step is at full strength.
  const fade = reduce ? '' : 'transition-[opacity,scale] duration-300 ease-ledger';

  return (
    <li
      ref={ref}
      className={`relative lg:min-h-[62dvh] lg:pt-[calc(31dvh_-_14px)] ${last ? 'lg:pb-[16dvh]' : 'pb-9 lg:pb-0'}`}
    >
      <span className={spine} aria-hidden />
      <div className="relative pl-12">
        <span
          className={`absolute left-0 top-0 grid h-7 w-7 place-items-center rounded-ui bg-accent font-mono text-[13px] font-medium tabular text-accent-ink ${fade} ${
            active ? '' : 'lg:scale-75'
          }`}
        >
          {index + 1}
        </span>
        <div className={`${fade} ${active ? '' : 'lg:opacity-50'}`}>
          <h3 className={H3}>{step.title}</h3>
          <p className={`${LEAD} mt-3 max-w-[44ch]`}>{step.body}</p>
          <Code code={step.code} refusal={step.refusal} />
        </div>
      </div>
    </li>
  );
}

export function Tour() {
  const reduce = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const current = STEPS[active];

  // Layout contract. lg and up: two columns, the six steps scroll on the left, the bill stays pinned on the right and
  // follows the step crossing the middle of the viewport. Below lg (under 1024px, so also under 768px): one column.
  // Heading, one settled card (not sticky, not tracking anything), then the six steps as a compact list with their code.
  return (
    <Section id="how">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] lg:gap-x-16 xl:gap-x-24">
        <div>
          <Reveal>
            <p className={LABEL}>How it works</p>
            <h2 className={`${H2} mt-4 max-w-[16ch] text-balance`}>One invoice, start to finish.</h2>
          </Reveal>

          {/* Below lg fallback: the finished bill, once. */}
          <div className="mt-10 lg:hidden">
            <BillCard bill={{ ...DEMO_BILL, state: 'REALISED' }} focus="settle" />
          </div>

          <ol className="mt-12 lg:mt-0">
            {STEPS.map((s, i) => (
              <Step key={s.title} index={i} step={s} active={i === active} reduce={reduce} onActive={setActive} />
            ))}
          </ol>
        </div>

        {/* lg and up: the pinned bill. Hidden below lg, where the settled card above stands in. */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <BillCard bill={{ ...DEMO_BILL, state: current.state }} focus={current.focus} />
          </div>
        </div>
      </div>
    </Section>
  );
}
