import { useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Skeleton } from '../ui/Skeleton';
import { Stamp } from '../ui/Stamp';
import { useBill } from './chain';
import { CHAIN, DEMO, EXPLORER, VAULT } from './config';
import { SiteFooter, SiteHeader, linkCls, primaryBtn, quietBtn } from './Chrome';

const GROUPS = [
  {
    title: 'On shipment day',
    steps: [
      'Exporter registers the shipping bill (sbHash on-chain, receivable recorded).',
      'Financier calls finance(): the vault pays the exporter the advance and the receivable is locked.',
      'A second financier on the same bill reverts with ALREADY_LOCKED.',
    ],
  },
  {
    title: 'When the buyer pays',
    steps: [
      'Buyer sends a TIP-20 transferWithMemo with the 32-byte sbHash as the memo.',
      'A listener sees the memo and calls realise(sbHash), or the buyer calls pay() directly (trustless production path).',
      'Vault pays the financier principal + interest, takes the platform fee, and sends the remainder to the exporter.',
    ],
  },
];

// The four legs of the test vector. `share` is each leg's part of the 48,750.00 invoice, in percent.
const LEGS = [
  { label: 'Advance repaid to the financier (88%)', value: '42,900.00', share: 88, tone: 'bg-accent' },
  { label: 'Interest 11.5% p.a. × 75 days', value: '1,013.73', share: 2.0794, tone: 'bg-accent/55' },
  { label: 'Platform fee 0.30%', value: '146.25', share: 0.3, tone: 'bg-line-strong' },
  { label: 'Exporter remainder', value: '4,690.02', share: 9.6206, tone: 'bg-text' },
];

const VIDEOS = [
  { id: 'pitch', label: 'Pitch', length: '2:00', caption: "The founders' pitch, in two voices." },
  { id: 'demo', label: 'Demo', length: '2:50', caption: 'One invoice, start to finish.' },
];

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-4)}`;
const h2 = 'font-display text-[28px] font-semibold leading-tight';

function Videos() {
  const [id, setId] = useState(VIDEOS[0].id);
  const v = VIDEOS.find((x) => x.id === id)!;
  return (
    <figure>
      <div className="mb-3 flex gap-2" role="group" aria-label="Choose a video">
        {VIDEOS.map((x) => (
          <button
            key={x.id}
            onClick={() => setId(x.id)}
            aria-pressed={x.id === id}
            className={
              'h-9 rounded-ui border px-3 text-sm font-medium transition-colors duration-150 ease-ledger active:translate-y-px ' +
              (x.id === id ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong text-muted hover:text-text')
            }
          >
            {x.label} <span className="font-mono tabular">{x.length}</span>
          </button>
        ))}
      </div>
      {/* key remounts the player so the poster and source switch together */}
      <video
        key={v.id}
        controls
        preload="none"
        playsInline
        poster={`/media/${v.id}.jpg`}
        className="aspect-video w-full rounded-ui border border-line bg-sunken"
      >
        <source src={`/media/${v.id}.mp4`} type="video/mp4" />
        <a href={`/media/${v.id}.mp4`}>Download the video</a>
      </video>
      <figcaption className="mt-2 text-[13px] text-muted">{v.caption} Captions are burned in.</figcaption>
    </figure>
  );
}

export default function Landing() {
  const demo = useBill(DEMO.sbHash);
  return (
    <div className="min-h-[100dvh] bg-bg font-sans text-text">
      <SiteHeader sections />
      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-10 py-12 lg:grid-cols-[5fr_6fr] lg:py-20">
          <div>
            <p className="text-[13px] text-muted">{CHAIN}</p>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-[1.1] md:text-[40px]">
              Paid on shipment day. Settled by a memo.
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted">
              Hisab pays an SME exporter on shipment day and settles automatically when the buyer pays in stablecoin.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className={primaryBtn} href={`${EXPLORER}/address/${VAULT}`}>
                View on explorer <ArrowUpRight size={16} aria-hidden />
              </a>
              <a className={quietBtn} href={`/pay/${DEMO.sbHash}`}>Demo pay page</a>
            </div>
          </div>
          <Videos />
        </section>

        <section id="how" className="scroll-mt-8 border-t border-line py-16">
          <h2 className={h2}>How it works</h2>
          <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {GROUPS.map((g, gi) => (
              <div key={g.title}>
                <h3 className="font-display text-xl font-semibold">{g.title}</h3>
                <ol className="mt-3 divide-y divide-line">
                  {g.steps.map((s, i) => (
                    <li key={s} className="flex gap-4 py-3 text-[15px] leading-relaxed">
                      <span className="font-mono tabular text-accent-text">{gi * 3 + i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-line py-16">
          <h2 className={h2}>Waterfall (test vector)</h2>
          <p className="mt-6 font-mono text-[40px] leading-none tabular">48,750.00</p>
          <p className="mt-2 text-sm text-muted">Invoice, paid by the buyer in one transfer.</p>
          <div
            className="mt-6 flex h-4 gap-px"
            role="img"
            aria-label="Split of the invoice: 88% advance repaid to the financier, 2.08% interest, 0.30% platform fee, 9.62% to the exporter"
          >
            {LEGS.map((l) => (
              <div key={l.label} className={`${l.tone} min-w-[3px]`} style={{ flex: `${l.share} 0 0` }} />
            ))}
          </div>
          <dl className="mt-6 max-w-2xl divide-y divide-line text-sm">
            {LEGS.map((l) => (
              <div key={l.label} className="flex items-baseline justify-between gap-4 py-2">
                <dt className="flex items-baseline gap-3">
                  <span className={`${l.tone} inline-block h-2.5 w-2.5 shrink-0`} aria-hidden />
                  {l.label}
                </dt>
                <dd className="font-mono tabular">{l.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Legs sum to 48,750.00. Amounts in USD stablecoin (6 decimals). The exporter already received the 42,900.00 advance on shipment day.
          </p>
        </section>

        <section id="proof" className="scroll-mt-8 border-t border-line py-16">
          <h2 className={h2}>Live on Tempo testnet</h2>
          <p className="mt-4 text-sm text-muted">SettlementVault</p>
          <a className={`${linkCls} mt-1 block break-all font-mono text-base md:text-xl`} href={`${EXPLORER}/address/${VAULT}`}>
            {VAULT}
          </a>
          <p className="mt-4 flex min-h-7 flex-wrap items-center gap-3 text-sm text-muted">
            Demo bill, read from the vault just now:
            {demo.status === 'loading' ? (
              <Skeleton className="h-5 w-24" />
            ) : demo.status === 'ok' ? (
              <Stamp state={demo.bill.state} />
            ) : (
              <span>could not reach the RPC</span>
            )}
          </p>
          <ul className="mt-8 divide-y divide-line border-t border-line text-[15px]">
            {DEMO.txs.map((t) => (
              <li key={t.hash} className="grid gap-1 py-3 md:grid-cols-[13rem_1fr_auto] md:items-baseline md:gap-6">
                <span className="font-mono">{t.fn}</span>
                <span className="text-muted">{t.effect}</span>
                <a className={`${linkCls} font-mono tabular`} href={`${EXPLORER}/tx/${t.hash}`}>{short(t.hash)}</a>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-[70ch] text-sm text-muted">
            The demo bill is the test vector scaled 1000x. A second finance() on it reverts with ALREADY_LOCKED, checked with eth_call.
          </p>
          <figure className="mt-10 max-w-3xl">
            <img
              src="/media/explorer-vault.webp"
              alt="The Tempo explorer listing the vault's register, finance and realise transactions"
              width={1332}
              height={950}
              loading="lazy"
              className="w-full rounded-ui border border-line"
            />
            <figcaption className="mt-2 text-[13px] text-muted">The vault on the Tempo explorer, 13 October 2026.</figcaption>
          </figure>
        </section>

        <section className="border-t border-line py-16">
          <h2 className={h2}>Trust model</h2>
          <dl className="mt-6 divide-y divide-line text-[15px] leading-relaxed">
            <div className="grid gap-1 py-4 md:grid-cols-[13rem_1fr] md:gap-6">
              <dt className="font-mono">realise()</dt>
              <dd className="max-w-[65ch]">
                Keeper-trusted. The listener asserts the amount received, so this path is not trustless. It is the demo path because the buyer needs no app.
              </dd>
            </div>
            <div className="grid gap-1 py-4 md:grid-cols-[13rem_1fr] md:gap-6">
              <dt className="font-mono">pay(sbHash, amount)</dt>
              <dd className="max-w-[65ch]">
                The production path. The buyer approves the vault, and the vault pulls the funds and settles atomically. No keeper.
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
