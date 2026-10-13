import type { ReactNode } from 'react';
import { H2, H3, LABEL, Reveal, Section } from '../kit';

function M({ children }: { children: ReactNode }) {
  return <span className="font-mono tabular text-[0.92em] text-text">{children}</span>;
}

type Item = { title: string; body: ReactNode };
type Group = { id: string; title: string; built: boolean; items: Item[] };

const GROUPS: Group[] = [
  {
    id: 'now',
    title: 'Now, on testnet',
    built: true,
    items: [
      { title: 'The vault contract', body: 'Register, finance, realise and pay, in 108 lines of Solidity.' },
      {
        title: 'The memo listener',
        body: (
          <>
            It sees the memo on a transfer and calls <M>realise()</M>.
          </>
        ),
      },
      {
        title: 'The buyer pay page',
        body: (
          <>
            A page for each bill, at <M>/pay/[sbHash]</M>.
          </>
        ),
      },
      { title: '20 contract tests', body: 'All pass, 7 of them for the vault.' },
    ],
  },
  {
    id: 'next',
    title: 'Next',
    built: false,
    items: [
      { title: 'Settle in another stablecoin', body: "Through Tempo's built-in exchange." },
      { title: 'Transfer policies', body: 'They restrict the flow to verified parties.' },
      { title: 'SWIFT message matcher', body: 'For legacy wire legs, which arrive with wrong or missing references.' },
      { title: 'Fiat on-ramp and off-ramp', body: 'Move between fiat and stablecoin at either end of a trade.' },
    ],
  },
];

const START: { term: string; detail: ReactNode }[] = [
  { term: 'The wedge', detail: 'Dubai re-export traders, on the UAE to India corridor.' },
  { term: 'The first target', detail: 'Ten exporters and one launch financier.' },
  {
    term: 'Revenue',
    detail: (
      <>
        A platform fee on each settled invoice, <span className="font-mono tabular">0.30%</span> in the demo.
      </>
    ),
  },
];

// One list item on the spine. Below md the spine runs down the left edge; from md it runs along the top, one column per item.
// Each item draws the spine segment that reaches the next item's node, and the last item draws none.
const ITEM =
  'relative pl-9 md:pl-0 md:pt-10 ' +
  'before:absolute before:left-[5px] before:top-3 before:-bottom-[60px] before:w-0.5 last:before:hidden ' +
  'md:before:left-0 md:before:top-[5px] md:before:bottom-auto md:before:-right-6 md:before:h-0.5 md:before:w-auto';

export function Roadmap() {
  return (
    <Section id="roadmap">
      <Reveal>
        <p className={LABEL}>Roadmap</p>
        <h2 className={`${H2} mt-4`}>
          <span className="block">Built and on testnet.</span>
          <span className="block">Next on the list.</span>
        </h2>
      </Reveal>

      <div className="mt-14 space-y-16 md:mt-16 md:space-y-20">
        {GROUPS.map((g, gi) => (
          // From lg: the group title sits left, the timeline right. Below lg the title stacks above it. Below md the timeline is vertical.
          <Reveal key={g.id} delay={gi * 0.08} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:gap-x-10">
            <h3 className={H3}>{g.title}</h3>
            <ol className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-x-6">
              {g.items.map((item) => (
                <li key={item.title} className={`${ITEM} ${g.built ? 'before:bg-accent' : 'before:bg-line-strong'}`}>
                  <span
                    aria-hidden
                    className={`absolute left-0 top-1.5 size-3 md:top-0 ${g.built ? 'bg-accent' : 'border-2 border-line-strong bg-bg'}`}
                  />
                  <h4 className="font-display text-[18px] font-semibold leading-snug tracking-[-0.01em] md:text-[19px]">{item.title}</h4>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        ))}
      </div>

      {/* From lg: title left, facts right. Below lg: one column. Below md each fact stacks its term over its detail. */}
      <Reveal className="mt-20 grid grid-cols-1 gap-6 md:mt-24 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] lg:gap-x-10">
        <h3 className={H3}>Where we start</h3>
        <div>
          <dl className="divide-y divide-line border-t border-line-strong">
            {START.map((row) => (
              <div key={row.term} className="grid grid-cols-1 gap-1 py-5 md:grid-cols-[11rem_1fr] md:gap-8">
                <dt className="text-[15px] text-muted">{row.term}</dt>
                <dd className="text-[17px] leading-snug md:text-[19px]">{row.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[15px] text-muted">Not goals: holding fiat, credit underwriting and India-regulated export flows.</p>
        </div>
      </Reveal>
    </Section>
  );
}
