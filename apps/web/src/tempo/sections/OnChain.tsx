import { useEffect, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Skeleton } from '../../ui/Skeleton';
import { Stamp } from '../../ui/Stamp';
import { readFeeBps, useBill, useHead } from '../chain';
import { CHAIN, CHAIN_ID, DEMO, EXPLORER, VAULT } from '../config';
import { H2, LEAD, Reveal, Section, link } from '../kit';

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-4)}`;

// A ledger, read top to bottom: the vault, what it holds right now, the four transactions, the explorer's own view.
// The three readouts are fetched from the chain when the page loads; nothing in them is typed in.
export function OnChain() {
  const head = useHead();
  const demo = useBill(DEMO.sbHash);
  const [fee, setFee] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    readFeeBps().then((n) => live && setFee(n), () => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <Section id="proof" tone="sunken">
      <Reveal>
        <h2 className={H2}>Live on Tempo testnet.</h2>
        <p className={`${LEAD} mt-4 max-w-[60ch]`}>
          The vault is deployed and the demo bill has been through the whole flow. The state, the block and the fee below are read from the chain as this page loads.
        </p>
      </Reveal>

      <Reveal className="mt-12 border-y border-line py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="text-[13px] text-muted">SettlementVault, {CHAIN}, chain {CHAIN_ID}</div>
            <a className={`${link} mt-1 block break-all font-mono text-[17px] md:text-[22px] lg:text-[26px]`} href={`${EXPLORER}/address/${VAULT}`}>
              {VAULT}
            </a>
          </div>
          <a className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold hover:text-accent-text" href={`${EXPLORER}/address/${VAULT}`}>
            View on explorer <ArrowUpRight size={16} aria-hidden />
          </a>
        </div>
        <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4 text-[15px]">
          <div className="flex min-h-7 items-center gap-3">
            <dt className="text-muted">Demo bill</dt>
            <dd>
              {demo.status === 'loading' ? (
                <Skeleton className="h-6 w-24" />
              ) : demo.status === 'ok' ? (
                <Stamp state={demo.bill.state} />
              ) : (
                <span className="text-[13px] text-muted">RPC unreachable</span>
              )}
            </dd>
          </div>
          <div className="flex min-h-7 items-center gap-3">
            <dt className="text-muted">Latest block</dt>
            <dd className="font-mono text-[17px] tabular">{head === null ? <Skeleton className="h-6 w-28" /> : head.toLocaleString('en-US')}</dd>
          </div>
          <div className="flex min-h-7 items-center gap-3">
            <dt className="text-muted">Platform fee in the vault</dt>
            <dd className="font-mono text-[17px] tabular">{fee === null ? <Skeleton className="h-6 w-16" /> : `${(fee / 100).toFixed(2)}%`}</dd>
          </div>
        </dl>
      </Reveal>

      <Reveal delay={0.08}>
        <ul className="divide-y divide-line text-[15px] md:text-[17px]">
          {DEMO.txs.map((t) => (
            <li key={t.hash} className="grid gap-1 py-5 md:grid-cols-[14rem_1fr_auto] md:items-baseline md:gap-8">
              <span className="font-mono">{t.fn}</span>
              <span className="text-muted">{t.effect}</span>
              <a className={`${link} font-mono tabular`} href={`${EXPLORER}/tx/${t.hash}`}>
                {short(t.hash)}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-[80ch] border-t border-line pt-4 text-[13px] text-muted">
          The demo bill is the test vector scaled 1000x. A second finance() on it reverts with ALREADY_LOCKED, checked with eth_call.
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <figure className="mx-auto max-w-4xl">
          <img
            src="/media/explorer-vault.webp"
            alt="The Tempo explorer listing the vault's register, finance and realise transactions"
            width={1332}
            height={950}
            loading="lazy"
            className="w-full rounded-ui border border-line"
          />
          <figcaption className="mt-2 text-[13px] text-muted">The same transactions on the Tempo explorer, 13 October 2026.</figcaption>
        </figure>
      </Reveal>
    </Section>
  );
}
