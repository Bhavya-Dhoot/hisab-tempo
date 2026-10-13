import type { ReactNode } from 'react';
import { Plus } from '@phosphor-icons/react';
import { H2, Section } from '../kit';

// Inline code: contract names, states and amounts that must be read exactly.
function M({ children }: { children: ReactNode }) {
  return <span className="font-mono tabular text-[0.92em] text-text">{children}</span>;
}

const QA: { q: string; a: ReactNode }[] = [
  {
    q: 'Does the buyer need an account or an app?',
    a: (
      <>
        No. The buyer sends an ordinary stablecoin transfer and writes the bill&apos;s 32-byte hash in its memo. A listener sees that memo and
        settles the bill. There is also a pay page for each bill.
      </>
    ),
  },
  {
    q: 'What if the buyer pays less than the invoice?',
    a: (
      <>
        The bill becomes <M>PARTIAL</M>. The financier is paid first, and nothing is paid beyond what arrived.
      </>
    ),
  },
  {
    q: 'Can the same receivable be financed twice?',
    a: (
      <>
        No. Once a financier calls <M>finance()</M>, the vault locks the receivable. A second financier on the same bill reverts with{' '}
        <M>ALREADY_LOCKED</M>.
      </>
    ),
  },
  {
    q: 'Who do I have to trust?',
    a: (
      <>
        It depends on the path. <M>realise()</M> is keeper-trusted, because the listener reports the amount received. <M>pay(sbHash, amount)</M>{' '}
        is the production path: the buyer approves the vault, the vault pulls the funds and settles atomically, and there is no keeper.
      </>
    ),
  },
  {
    q: 'Which token is used, and what are the fees?',
    a: (
      <>
        The testnet build uses <M>pathUSD</M>, a stablecoin with 6 decimals. Tempo has no native gas token, so network fees are paid in
        stablecoin. Hisab&apos;s own fee is a platform fee on each settled invoice, <M>0.30%</M> in the demo.
      </>
    ),
  },
  {
    q: 'Is real money moving?',
    a: (
      <>
        No. This is a testnet build for the Colosseum Crypto World&apos;s Fair, Tempo track. The starting market is Dubai re-export traders on
        the UAE to India corridor, and India-regulated flows come later, through bank partners.
      </>
    ),
  },
];

export function Faq() {
  return (
    <Section id="faq" tone="sunken">
      {/* From lg: the question title sits left, the list right. Below lg: one column, title first. */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-16">
        <h2 className={`${H2} lg:col-span-4`}>What people ask first.</h2>

        <div className="border-t border-line-strong lg:col-span-8">
          {QA.map((item, i) => (
            <details key={item.q} name="faq" open={i === 0} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-[19px] font-semibold leading-snug tracking-[-0.01em] transition-colors duration-150 hover:text-accent-text md:text-[22px] [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <Plus size={20} aria-hidden className="shrink-0 text-muted transition-transform duration-200 ease-ledger group-open:rotate-45" />
              </summary>
              <p className="max-w-[70ch] pb-7 pr-10 text-[16px] leading-relaxed text-muted md:text-[17px]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
