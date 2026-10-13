import { useState } from 'react';
import { EXPLORER, TOKEN, VAULT } from './config';

function Field({ label, value }: { label: string; value: string }) {
  const [ok, setOk] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    }, () => {});
  };
  return (
    <div className="py-3">
      <div className="text-[13px] text-muted">{label}</div>
      <div className="mt-1 flex items-start gap-2">
        <code className="min-w-0 flex-1 break-all font-mono text-sm tabular">{value}</code>
        <button
          onClick={copy}
          className="shrink-0 rounded-[--radius-ui] border border-line-strong px-2 py-1 text-[13px]"
        >
          {ok ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default function PayPage({ sbHash }: { sbHash: string }) {
  const valid = /^0x[0-9a-fA-F]{64}$/.test(sbHash);
  const amount = new URLSearchParams(window.location.search).get('amount');
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <header className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="font-display text-xl font-semibold tracking-tight">Hisab</span>
        </a>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <h1 className="font-display text-3xl font-bold tracking-tight">Pay invoice</h1>
        {!valid ? (
          <p className="mt-4 rounded-[--radius-ui] bg-danger-soft p-3 text-sm text-danger">
            Invalid shipping bill hash. Expected 0x followed by 64 hex characters.
          </p>
        ) : (
          <>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {amount ? <Field label="Amount" value={amount} /> : (
                <div className="py-3 text-sm"><span className="text-muted">Amount: </span>set by invoice</div>
              )}
              <Field label="Token" value={`${TOKEN.symbol} ${TOKEN.address}`} />
              {VAULT ? (
                <Field label="Vault address" value={VAULT} />
              ) : (
                <div className="py-3 text-sm text-accent-text">Vault address: not yet deployed (TODO)</div>
              )}
              <Field label="Memo (sbHash)" value={sbHash} />
            </div>
            <p className="mt-4 text-sm">
              Send with transferWithMemo(vault, amount, memo). Any other transfer won't be matched.
            </p>
            {VAULT && (
              <p className="mt-2 text-sm">
                <a className="break-all text-accent-text underline underline-offset-2" href={`${EXPLORER}/address/${VAULT}`}>
                  View vault on explorer
                </a>
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
