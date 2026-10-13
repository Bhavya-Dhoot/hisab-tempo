import { ArrowLeft, ArrowUpRight, CaretRight } from '@phosphor-icons/react';
import { Skeleton } from '../ui/Skeleton';
import { BillCard } from './BillCard';
import { type BillState, amount6, useBill } from './chain';
import { SiteFooter, SiteHeader } from './Chrome';
import { EXPLORER, RPC, TOKEN, VAULT } from './config';
import { H2, H3, LEAD, btnQuiet } from './kit';
import { UNIT, exact, settle } from './maths';
import { BillSkeleton, CopyBlock, Step, Steps, shortHash, useFeeBps } from './StartPage';

// What each on-chain state means for someone about to pay. The vault only settles a FINANCED bill.
const NOTE: Record<BillState, string> = {
  NONE: 'This bill is not registered in the vault. Check the link before paying.',
  OPEN: 'Registered, not financed yet. A payment sent now cannot be settled.',
  FINANCED: 'Ready. The vault is waiting for this payment.',
  REALISED: 'Already settled. Do not pay again: a transfer sent now cannot be settled, and the vault has no way to send it back.',
  PARTIAL: 'Settled with a short payment. Do not pay again: a transfer sent now cannot be settled, and the vault has no way to send it back.',
};

// "48.75" to 48750000n. Null for anything that is not a plain decimal with at most six places.
function unitsOf(s: string): bigint | null {
  if (!/^\d+(\.\d{1,6})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  return BigInt(whole) * UNIT + BigInt(frac.padEnd(6, '0'));
}

function PayBody({ sbHash, amount }: { sbHash: string; amount: string | null }) {
  const q = useBill(sbHash);
  const feeBps = useFeeBps();

  // The bill as the vault knows it, or null while loading, on error, or when the hash is not registered.
  const known = q.status === 'ok' && q.bill.state !== 'NONE' ? q.bill : null;
  const linkUnits = amount ? unitsOf(amount) : null;
  const units = amount ? linkUnits : known ? known.invoice : null;
  const mismatch = linkUnits !== null && known !== null && linkUnits !== known.invoice;
  const send =
    `cast send ${TOKEN.address} "transferWithMemo(address,uint256,bytes32)" ${VAULT} ` +
    `${units === null ? '<amount>' : units.toString()} ${sbHash} --rpc-url ${RPC} --private-key $KEY`;

  // A PARTIAL bill is left out: the vault does not store how much arrived, so its real split cannot be shown.
  const paid = known && (known.state === 'FINANCED' || known.state === 'REALISED') ? known : null;
  const split = paid ? settle({ ...paid, feeBps }) : null;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="min-w-0 lg:sticky lg:top-8 lg:col-span-5 lg:self-start">
        {q.status === 'loading' ? (
          <BillSkeleton />
        ) : q.status === 'error' ? (
          <p className="text-[15px] text-muted">Could not read the vault just now. The details on this page still apply.</p>
        ) : (
          <BillCard bill={{ ...q.bill, feeBps, sb: shortHash(sbHash) }} precise />
        )}
      </div>

      <div className="min-w-0 lg:col-span-7">
        <h2 className="sr-only">How to pay</h2>
        <Steps>
          <Step n={1} title="Check the bill">
            {q.status === 'loading' ? (
              <Skeleton className="h-5 w-72 max-w-full" />
            ) : q.status === 'error' ? (
              <p className="text-text">The bill state could not be read. Check the link with whoever sent it before paying.</p>
            ) : (
              <p className={q.bill.state === 'NONE' ? 'text-danger' : 'text-text'}>{NOTE[q.bill.state]}</p>
            )}
          </Step>

          <Step n={2} title="Copy the details">
            {amount ? (
              <CopyBlock label="Amount" value={amount} />
            ) : known ? (
              <CopyBlock label={`Amount (invoice, read from the vault, ${TOKEN.symbol})`} value={amount6(known.invoice)} />
            ) : q.status === 'loading' ? (
              <Skeleton className="h-[72px] w-full" />
            ) : (
              <p className="text-text">
                <span className="text-muted">Amount: </span>set by invoice
              </p>
            )}
            {mismatch && known && (
              <p className="text-danger">
                The link says {amount} but the vault holds an invoice of {amount6(known.invoice)}. Check with whoever sent it before paying.
              </p>
            )}
            <CopyBlock label="Token" value={`${TOKEN.symbol} ${TOKEN.address}`} />
            <CopyBlock label="Vault address" value={VAULT} />
            <CopyBlock label="Memo (sbHash)" value={sbHash} />
          </Step>

          <Step n={3} title="Send with the memo">
            <p>
              Send with <code className="font-mono text-[14px] text-text">transferWithMemo(vault, amount, memo)</code>. Any other transfer
              won't be matched.
            </p>
            <details className="group rounded-ui border border-line">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-[15px] font-medium text-text [&::-webkit-details-marker]:hidden">
                <CaretRight size={16} aria-hidden className="transition-transform duration-150 ease-ledger group-open:rotate-90" />
                From a terminal
              </summary>
              <div className="space-y-3 px-4 pb-4">
                <p>Put the private key of your test wallet in $KEY, then run this.</p>
                <CopyBlock label="Send command" value={send} />
              </div>
            </details>
          </Step>
        </Steps>

        {split && paid && (
          <section className="mt-12">
            <h2 className={H3}>What happens to the payment</h2>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted">
              When the bill is realised, the vault pays all three in one transaction. Amounts are for a full payment of the invoice.
            </p>
            <dl className="mt-4 divide-y divide-line border-t border-line">
              {[
                { name: 'Financier', note: 'Principal plus interest, paid first', value: split.toFinancier },
                { name: 'Platform', note: `Fee, ${(feeBps / 100).toFixed(2)}% of the invoice`, value: split.fee },
                { name: 'Exporter', note: 'The remainder', value: split.toExporter },
              ].map((l) => (
                <div key={l.name} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-3">
                  <dt className="min-w-0">
                    <div className="text-[15px] font-medium">{l.name}</div>
                    <div className="text-[13px] text-muted">{l.note}</div>
                  </dt>
                  <dd className="text-right font-mono text-[17px] tabular">
                    {exact(l.value)} <span className="text-[13px] text-muted">{TOKEN.symbol}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <a className={`${btnQuiet} mt-10 w-full sm:w-auto`} href={`${EXPLORER}/address/${VAULT}`}>
          View on explorer <ArrowUpRight size={16} aria-hidden />
        </a>
      </div>
    </div>
  );
}

export default function PayPage({ sbHash }: { sbHash: string }) {
  const valid = /^0x[0-9a-fA-F]{64}$/.test(sbHash);
  const amount = new URLSearchParams(window.location.search).get('amount');
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg font-sans text-text">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
          <h1 className={H2}>Pay invoice</h1>
          {valid ? (
            <>
              <p className={`${LEAD} mt-4 max-w-[60ch]`}>
                Send the invoice amount to the vault on Tempo testnet with the memo below. The listener matches the memo and settles the bill.
              </p>
              <PayBody sbHash={sbHash} amount={amount} />
            </>
          ) : (
            <>
              <p role="alert" className="mt-6 rounded-ui bg-danger-soft p-4 text-[15px] text-danger">
                Invalid shipping bill hash. Expected 0x followed by 64 hex characters.
              </p>
              <a href="/" className="mt-6 inline-flex items-center gap-1.5 text-[15px] text-muted underline underline-offset-2 hover:text-text">
                <ArrowLeft size={16} aria-hidden /> Back to Hisab
              </a>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
