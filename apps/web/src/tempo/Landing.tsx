import { CHAIN, EXPLORER, GITHUB, VAULT } from './config';

const STEPS = [
  'Exporter registers the shipping bill (sbHash on-chain, receivable recorded).',
  'Financier calls finance(): the vault pays the exporter the advance and the receivable is locked.',
  'A second financier on the same bill reverts with ALREADY_LOCKED.',
  'Buyer sends a TIP-20 transferWithMemo with the 32-byte sbHash as the memo.',
  'A listener sees the memo and calls realise(sbHash), or the buyer calls pay() directly (trustless production path).',
  'Vault pays the financier principal + interest, takes the platform fee, and sends the remainder to the exporter.',
];

const ROWS: [string, string][] = [
  ['Invoice', '48,750.00'],
  ['Advance to exporter (88%)', '42,900.00'],
  ['Interest 11.5% p.a. × 75 days', '1,013.73'],
  ['Platform fee 0.30%', '146.25'],
  ['Exporter remainder', '4,690.02'],
];

const DEMO = '/pay/0x' + 'ab12cd34'.repeat(8);
const link = 'text-accent-text underline underline-offset-2 break-all';

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <header className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <span className="font-display text-xl font-semibold tracking-tight">Hisab</span>
        <span className="font-deva text-lg text-muted">हिसाब</span>
      </header>
      <main className="mx-auto max-w-2xl space-y-10 px-4 pb-16">
        <section>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Hisab pays an SME exporter on shipment day and settles automatically when the buyer pays in stablecoin.
          </h1>
          <p className="mt-3 text-sm text-muted">{CHAIN}</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">How it works</h2>
          <ol className="mt-3 divide-y divide-line border-y border-line">
            {STEPS.map((s, i) => (
              <li key={i} className="flex gap-3 py-3 text-[15px]">
                <span className="font-mono tabular text-accent-text">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">Waterfall (test vector)</h2>
          <table className="mt-3 w-full border-y border-line text-sm">
            <tbody className="divide-y divide-line">
              {ROWS.map(([k, v]) => (
                <tr key={k}>
                  <td className="py-2 pr-3">{k}</td>
                  <td className="py-2 text-right font-mono tabular">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm text-muted">
            Legs sum to 48,750.00. Amounts in USD stablecoin (6 decimals).
          </p>
        </section>

        <section className="space-y-2 text-sm">
          <h2 className="font-display text-xl font-semibold">Links</h2>
          <p className="break-all font-mono">
            {VAULT ? (
              <>Vault: <a className={link} href={`${EXPLORER}/address/${VAULT}`}>{VAULT}</a></>
            ) : (
              'Vault: not yet deployed (TODO)'
            )}
          </p>
          <ul className="space-y-1">
            <li><a className={link} href={GITHUB}>GitHub</a></li>
            <li><a className={link} href={EXPLORER}>Tempo explorer</a></li>
            <li>Demo pay link: <a className={`${link} font-mono`} href={DEMO}>{DEMO}</a></li>
            <li><a className={link} href="/console">/console</a> (local console, needs API)</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
