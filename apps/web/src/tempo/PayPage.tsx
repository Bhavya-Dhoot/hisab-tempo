import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from '@phosphor-icons/react';
import { EXPLORER, TOKEN, VAULT } from './config';
import { SiteFooter, SiteHeader, quietBtn } from './Chrome';

function Field({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    }, () => {});
  };
  return (
    <div className="py-4">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-1 flex items-start gap-3">
        <code className="min-w-0 flex-1 break-all font-mono text-sm leading-relaxed tabular">{value}</code>
        <button
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-ui border border-line-strong px-2.5 text-[13px] font-medium transition-colors duration-150 ease-ledger hover:bg-surface active:translate-y-px"
        >
          {ok ? <Check size={14} weight="bold" aria-hidden /> : <Copy size={14} aria-hidden />}
          <span aria-live="polite">{ok ? 'Copied' : 'Copy'}</span>
        </button>
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
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:py-14">
        <h1 className="font-display text-[28px] font-bold leading-[1.1] md:text-[40px]">Pay invoice</h1>
        {!valid ? (
          <p className="mt-6 rounded-ui bg-danger-soft p-3 text-sm text-danger">
            Invalid shipping bill hash. Expected 0x followed by 64 hex characters.
          </p>
        ) : (
          <>
            <div className="mt-6 divide-y divide-line border-t border-line">
              {amount ? <Field label="Amount" value={amount} /> : (
                <div className="py-4 text-sm"><span className="text-muted">Amount: </span>set by invoice</div>
              )}
              <Field label="Token" value={`${TOKEN.symbol} ${TOKEN.address}`} />
              <Field label="Vault address" value={VAULT} />
              <Field label="Memo (sbHash)" value={sbHash} />
            </div>
            <p className="mt-6 max-w-[65ch] text-[15px] leading-relaxed">
              Send with <code className="font-mono text-sm">transferWithMemo(vault, amount, memo)</code>. Any other transfer won't be matched.
            </p>
            <a className={`${quietBtn} mt-6`} href={`${EXPLORER}/address/${VAULT}`}>
              View vault on explorer <ArrowUpRight size={16} weight="bold" aria-hidden />
            </a>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
