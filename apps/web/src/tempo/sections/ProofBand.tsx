import { useEffect, useState, type ReactNode } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Skeleton } from '../../ui/Skeleton';
import { useHead } from '../chain';
import { DEMO, EXPLORER, GITHUB, VAULT } from '../config';
import { WRAP } from '../kit';

// Figure sizes step down at md because four ten-character numerals do not fit a 768px row at 40px.
const NUM =
  'flex h-[1em] items-center whitespace-nowrap font-mono text-[24px] font-medium leading-none tracking-[-0.02em] tabular sm:text-[30px] md:text-[24px] lg:text-[34px] xl:text-[40px]';
const LAB = 'mt-3 block text-[13px] leading-snug text-muted';

// Hairlines: a 2x2 grid below md (one rule under the first row, one between the columns),
// one row of four from md (a rule before every figure but the first).
const CELL = [
  'border-b pr-4 md:border-b-0 md:pr-6 xl:pr-8',
  'border-b border-l pl-5 md:border-b-0 md:px-6 xl:px-8',
  'pr-4 md:border-l md:px-6 xl:px-8',
  'border-l pl-5 md:px-6 xl:px-8',
];

function Figure({ i, href, value, label, tone = '' }: { i: number; href?: string; value: ReactNode; label: string; tone?: string }) {
  const body = (
    <>
      <div className={`${NUM} ${tone} ${href ? 'transition-colors duration-150 ease-ledger group-hover:text-accent-text' : ''}`}>{value}</div>
      <span className={`${LAB} ${href ? 'group-hover:text-text' : ''}`}>
        {label}
        {href && <ArrowUpRight size={16} aria-hidden className="ml-1 inline align-text-bottom" />}
      </span>
    </>
  );
  return (
    <li className={`min-w-0 border-line py-6 md:py-9 ${CELL[i]}`}>
      {href ? (
        <a href={href} className="group block">
          {body}
        </a>
      ) : (
        body
      )}
    </li>
  );
}

export function ProofBand() {
  const head = useHead();
  // If the RPC never answers, stop pulsing after a while and say so, so the cell does not look stuck.
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    if (head !== null) return;
    const id = setTimeout(() => setGaveUp(true), 8000);
    return () => clearTimeout(id);
  }, [head]);

  const noReply = head === null && gaveUp;
  const block =
    head !== null ? (
      head.toLocaleString('en-US')
    ) : noReply ? (
      <span className="text-muted">no reply</span>
    ) : (
      <Skeleton className="h-[0.78em] w-[10ch]" />
    );

  return (
    <section aria-label="Evidence" className="border-y border-line bg-surface">
      <div className={WRAP}>
        <ul className="grid grid-cols-2 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.25fr)]">
          <Figure
            i={0}
            value={block}
            tone={head !== null ? 'text-accent-text' : ''}
            label={noReply ? 'Tempo testnet RPC, not answering' : 'Tempo testnet block, live'}
          />
          <Figure i={1} href={`${EXPLORER}/address/${VAULT}`} value={String(DEMO.txs.length)} label="demo transactions on the explorer" />
          <Figure i={2} value="20" label="contract tests passing" />
          <Figure
            i={3}
            href={`${GITHUB}/blob/main/contracts/contracts/tempo/SettlementVault.sol`}
            value="108"
            label="lines in the vault contract"
          />
        </ul>
      </div>
    </section>
  );
}
