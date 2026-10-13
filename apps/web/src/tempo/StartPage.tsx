import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Copy } from '@phosphor-icons/react';
import { Skeleton } from '../ui/Skeleton';
import { BillCard } from './BillCard';
import { amount6, readFeeBps, useBill } from './chain';
import { SiteFooter, SiteHeader } from './Chrome';
import { DEMO, RPC, TOKEN, VAULT } from './config';
import { EASE, H2, LABEL, LEAD, Reveal, Section, WRAP, btnQuiet } from './kit';
import { FEE_BPS, type Terms, money, settle, toUnits } from './maths';

// ---------------------------------------------------------------------------
// Shared with the pay page: a copyable block, the ledger-spine step list, the card-shaped skeleton.
// ---------------------------------------------------------------------------

const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
export const shortHash = (h: string) => `${h.slice(0, 10)}…${h.slice(-4)}`;

// A label, a mono value that wraps, and a Copy button that reads Copied for a moment.
export function CopyBlock({ label, value }: { label: string; value: string }) {
  const reduce = useReducedMotion();
  const [ok, setOk] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(
      () => {
        if (!live.current) return;
        setOk(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setOk(false), 1500);
      },
      () => {},
    );
  };
  return (
    <div className="min-w-0 rounded-ui border border-line bg-sunken">
      <div className="flex items-center justify-between gap-3 py-2 pl-3 pr-2">
        <span className="text-[13px] text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-ui border px-3 text-[13px] font-medium transition-colors duration-150 ease-ledger hover:bg-surface active:translate-y-px ${
            ok ? 'border-accent text-accent-text' : 'border-line-strong text-text'
          }`}
        >
          {ok ? (
            <motion.span
              key="check"
              className="inline-flex"
              initial={reduce ? false : { scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18, ease: EASE }}
            >
              <Check size={16} aria-hidden />
            </motion.span>
          ) : (
            <Copy size={16} aria-hidden />
          )}
          <span aria-live="polite">{ok ? 'Copied' : 'Copy'}</span>
          <span className="sr-only">{label}</span>
        </button>
      </div>
      <code className="block select-all break-all px-3 pb-3 font-mono text-[13px] leading-relaxed tabular text-text">{value}</code>
    </div>
  );
}

// A vertical list of steps: numerals sit on a turmeric rule that runs from one numeral to the next.
export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol role="list" className="m-0 list-none p-0">
      {children}
    </ol>
  );
}

const RULE =
  '[&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:bottom-0 [&:not(:last-child)]:before:left-[11px] ' +
  '[&:not(:last-child)]:before:top-6 [&:not(:last-child)]:before:w-0.5 [&:not(:last-child)]:before:bg-accent';

export function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className={`relative min-w-0 pb-10 pl-11 last:pb-0 ${RULE}`}>
      <span
        aria-hidden
        className="absolute left-0 top-0 grid h-6 w-6 place-items-center rounded-ui border border-accent bg-bg font-mono text-[13px] font-semibold tabular text-accent-text"
      >
        {n}
      </span>
      <h3 className="font-display text-[19px] font-semibold leading-6 tracking-[-0.02em]">{title}</h3>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </li>
  );
}

// The shape of a BillCard while its bill is being read from the chain.
export function BillSkeleton() {
  return (
    <div role="status" className="rounded-ui border border-line bg-raised p-5 shadow-lift md:p-6">
      <span className="sr-only">Reading the bill from the vault</span>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="mt-6 h-3.5 w-14" />
      <Skeleton className="mt-2 h-10 w-52 max-w-full" />
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        <Skeleton className="h-1.5" />
        <Skeleton className="h-1.5" />
        <Skeleton className="h-1.5" />
      </div>
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-40 max-w-[55%]" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-2 w-full" />
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    </div>
  );
}

// The platform fee the vault was deployed with, read from the chain. Starts at the known default, keeps it if the read fails.
export function useFeeBps(): number {
  const [bps, setBps] = useState(FEE_BPS);
  useEffect(() => {
    let live = true;
    readFeeBps().then(
      (n) => live && setBps(n),
      () => {},
    );
    return () => {
      live = false;
    };
  }, []);
  return bps;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

const ROLES = [
  { id: 'exporter', label: 'Exporter', blurb: 'You ship goods and want to be paid on shipment day instead of 60 to 90 days later.' },
  { id: 'financier', label: 'Financier', blurb: 'You advance cash against a registered bill and are repaid with interest when the buyer pays.' },
  { id: 'buyer', label: 'Buyer', blurb: 'You owe an invoice and want one transfer to settle it correctly.' },
] as const;
type Role = (typeof ROLES)[number]['id'];

const parseRole = (): Role | null => {
  const h = window.location.hash.replace('#', '').toLowerCase();
  return ROLES.find((r) => r.id === h)?.id ?? null;
};

// ---------------------------------------------------------------------------
// The form and the commands it builds
// ---------------------------------------------------------------------------

type Form = { bill: string; invoice: string; days: string; advance: string; rate: string; hash: string };
const DEFAULTS: Form = { bill: '6674321', invoice: '48750', days: '75', advance: '88', rate: '11.5', hash: DEMO.sbHash };

// A number from a text field, or null when it is empty, not a number, or outside 0..max.
const num = (s: string, max: number) => {
  const t = s.trim();
  const n = Number(t);
  return t !== '' && Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};

function buildPlan(f: Form, origin: string) {
  const inv = num(f.invoice, 1e12);
  const days = num(f.days, 1e6);
  const adv = num(f.advance, 100);
  const rate = num(f.rate, 655);
  const hash = f.hash.trim();
  const hashOk = HASH_RE.test(hash);
  const sb = hashOk ? hash : '<sbHash>';

  const invoice = inv === null ? null : toUnits(inv);
  const advance = invoice === null || adv === null ? null : (invoice * BigInt(Math.round(adv * 100))) / 10_000n;
  const tenor = days === null ? null : Math.round(days);
  const bps = rate === null ? null : Math.round(rate * 100);
  const terms: Terms | null =
    invoice !== null && advance !== null && tenor !== null && bps !== null
      ? { invoice, advance, rateBps: bps, tenorDays: tenor, feeBps: FEE_BPS }
      : null;

  const units = (v: bigint | null, hold: string) => (v === null ? hold : v.toString());
  const tail = `--rpc-url ${RPC} --private-key $KEY`;
  return {
    hashOk,
    invoice,
    advance,
    terms,
    split: terms ? settle(terms) : null,
    fund: `cast rpc tempo_fundAddress <your address> --rpc-url ${RPC}`,
    keccak: `cast keccak "SB-${f.bill.trim() || '<number>'}"`,
    register: `cast send ${VAULT} "register(bytes32,uint256,uint32)" ${sb} ${units(invoice, '<invoice>')} ${tenor ?? '<days>'} ${tail}`,
    approve: `cast send ${TOKEN.address} "approve(address,uint256)" ${VAULT} ${units(advance, '<advance>')} ${tail}`,
    finance: `cast send ${VAULT} "finance(bytes32,uint256,uint16)" ${sb} ${units(advance, '<advance>')} ${bps ?? '<bps>'} ${tail}`,
    send: `cast send ${TOKEN.address} "transferWithMemo(address,uint256,bytes32)" ${VAULT} ${units(invoice, '<invoice>')} ${sb} ${tail}`,
    link: `${origin}/pay/${sb}?amount=${invoice === null ? '<invoice>' : amount6(invoice)}`,
  };
}
type Plan = ReturnType<typeof buildPlan>;

function FormField({
  label,
  value,
  onChange,
  numeric = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={numeric ? 'number' : 'text'}
        inputMode={numeric ? 'decimal' : undefined}
        step={numeric ? 'any' : undefined}
        min={numeric ? 0 : undefined}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`h-11 w-full min-w-0 rounded-ui border bg-raised px-3 font-mono text-[16px] tabular text-text sm:text-[14px] ${
          error ? 'border-danger' : 'border-line-strong'
        }`}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const FUND_NOTE = 'Use a throwaway wallet and keep its private key in $KEY. The faucet sends it test funds.';

function DemoLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${btnQuiet} w-full sm:w-auto`}>
      Open pay page <ArrowUpRight size={16} aria-hidden />
    </a>
  );
}

function RoleSteps({ role, c, f }: { role: Role; c: Plan; f: Form }) {
  if (role === 'exporter') {
    return (
      <Steps>
        <Step n={1} title="Fund a test wallet">
          <p>{FUND_NOTE}</p>
          <CopyBlock label="Faucet command" value={c.fund} />
        </Step>
        <Step n={2} title="Hash the bill">
          <p>
            The bill number becomes a 32-byte hash. Paste it into the sbHash field in the form. That field starts as the settled demo
            bill, so a bill of your own needs a hash of its own.
          </p>
          <CopyBlock label="Hash command" value={c.keccak} />
        </Step>
        <Step n={3} title="Register the bill">
          <p>This records the hash, the invoice amount and the days until the buyer pays in the vault.</p>
          <CopyBlock label="Register command" value={c.register} />
        </Step>
        <Step n={4} title="Send the buyer a pay link">
          <p>The link opens a page that shows the bill and the exact details the buyer needs to pay it.</p>
          <CopyBlock label="Pay link" value={c.link} />
          <DemoLink href={c.link} />
        </Step>
      </Steps>
    );
  }
  if (role === 'financier') {
    return (
      <Steps>
        <Step n={1} title="Fund a test wallet">
          <p>{FUND_NOTE}</p>
          <CopyBlock label="Faucet command" value={c.fund} />
        </Step>
        <Step n={2} title="Approve the vault">
          <p>
            Allow the vault to pull the advance
            {c.advance === null ? '' : ` of ${money(c.advance)} ${TOKEN.symbol}`} from your wallet.
          </p>
          <CopyBlock label="Approve command" value={c.approve} />
        </Step>
        <Step n={3} title="Finance the bill">
          <p>
            The advance goes straight to the exporter and the receivable is locked. A second financier on the same bill gets{' '}
            <span className="font-mono text-[14px] text-danger">ALREADY_LOCKED</span>.
          </p>
          <CopyBlock label="Finance command" value={c.finance} />
        </Step>
        <Step n={4} title="Get repaid">
          <p>When the buyer pays, the vault repays you first, principal plus interest, before the platform fee and the exporter.</p>
          {c.split && c.terms ? (
            <dl className="divide-y divide-line border-t border-line text-[15px] text-text">
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-muted">Principal back</dt>
                <dd className="font-mono tabular">{money(c.terms.advance)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-muted">
                  Interest, {f.rate.trim()}% a year for {c.terms.tenorDays} days
                </dt>
                <dd className="font-mono tabular">{money(c.split.interest)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 font-semibold">
                <dt>You receive</dt>
                <dd className="font-mono tabular">
                  {money(c.split.toFinancier)} <span className="text-[13px] font-normal text-muted">{TOKEN.symbol}</span>
                </dd>
              </div>
            </dl>
          ) : (
            <p>Enter valid amounts in the form to see the repayment.</p>
          )}
        </Step>
      </Steps>
    );
  }
  return (
    <Steps>
      <Step n={1} title="Open the pay link">
        <p>Open the link your exporter sent you. The page shows the bill and the exact details to copy.</p>
        <DemoLink href={c.link} />
      </Step>
      <Step n={2} title="Or send from a terminal">
        <p>
          Prefer the command line? Send the invoice amount to the vault with the bill hash as the memo. Any other transfer won't be
          matched. Your wallet needs test funds first.
        </p>
        <CopyBlock label="Faucet command" value={c.fund} />
        <CopyBlock label="Send command" value={c.send} />
      </Step>
      <Step n={3} title="Let the listener settle it">
        <p>A listener sees the memo and settles the bill. Nothing else is needed, and no account is required.</p>
      </Step>
    </Steps>
  );
}

// ---------------------------------------------------------------------------
// Check a bill on-chain
// ---------------------------------------------------------------------------

function BillCheck({ hash, feeBps }: { hash: string; feeBps: number }) {
  const q = useBill(hash);
  if (q.status === 'loading') return <BillSkeleton />;
  if (q.status === 'error') {
    return <p className="text-[15px] text-muted">The Tempo RPC could not be reached, so this bill cannot be read right now.</p>;
  }
  return (
    <div>
      <BillCard bill={{ ...q.bill, feeBps, sb: shortHash(hash) }} precise />
      {q.bill.state === 'NONE' && <p className="mt-4 text-[15px] text-muted">This hash is not registered in the vault.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

const PANEL = 'start-panel';

export default function StartPage() {
  const reduce = useReducedMotion();
  const [role, setRole] = useState<Role>(() => parseRole() ?? 'exporter');
  const [f, setF] = useState<Form>(DEFAULTS);
  const feeBps = useFeeBps();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const onHash = () => {
      const r = parseRole();
      if (r) setRole(r);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const pick = (r: Role) => {
    setRole(r);
    window.history.replaceState(null, '', `#${r}`);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ROLES.findIndex((r) => r.id === role);
    const n = ROLES.length;
    const next = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    pick(ROLES[next].id);
    tabs.current[next]?.focus();
  };
  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const c = buildPlan(f, window.location.origin);
  const current = ROLES.find((r) => r.id === role) ?? ROLES[0];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg font-sans text-text">
      <SiteHeader hideStart />
      <main className="flex-1">
        <div className={`${WRAP} pb-16 pt-12 md:pb-24 md:pt-16`}>
          <p className={LABEL}>Get started</p>
          <h1 className={`${H2} mt-4 max-w-[16ch]`}>Pick your side of the invoice.</h1>
          <p className={`${LEAD} mt-5 max-w-[60ch]`}>Everything here runs on Tempo testnet with test funds, so no real money moves.</p>

          <div role="tablist" aria-label="Choose your role" onKeyDown={onKeyDown} className="mt-10 flex border-b border-line md:mt-12">
            {ROLES.map((r, i) => {
              const on = r.id === role;
              return (
                <button
                  key={r.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${r.id}`}
                  aria-selected={on}
                  aria-controls={PANEL}
                  tabIndex={on ? 0 : -1}
                  onClick={() => pick(r.id)}
                  className={`relative flex-1 whitespace-nowrap px-3 py-3 font-display text-[19px] font-semibold tracking-[-0.02em] transition-colors duration-150 ease-ledger active:translate-y-px sm:flex-none sm:px-6 md:text-[22px] ${
                    on ? 'text-text' : 'text-muted hover:text-text'
                  }`}
                >
                  {r.label}
                  {on && (
                    <motion.span
                      layoutId="start-role-underline"
                      className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" id={PANEL} aria-labelledby={`tab-${role}`}>
            <p className="mt-6 max-w-[60ch] text-[17px] leading-relaxed">{current.blurb}</p>

            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
              <aside className="min-w-0 lg:sticky lg:top-8 lg:col-span-4 lg:self-start">
                <form onSubmit={(e) => e.preventDefault()} className="rounded-ui border border-line bg-surface p-5">
                  <h2 className="font-display text-[19px] font-semibold tracking-[-0.02em]">Your bill</h2>
                  <p className="mt-1 text-[14px] text-muted">The commands on this page update as you type.</p>
                  <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
                    <div className="col-span-2">
                      <FormField label="Shipping bill number" value={f.bill} onChange={set('bill')} />
                    </div>
                    <FormField label="Invoice in USD" value={f.invoice} onChange={set('invoice')} numeric />
                    <FormField label="Days until the buyer pays" value={f.days} onChange={set('days')} numeric />
                    <FormField label="Advance percent" value={f.advance} onChange={set('advance')} numeric />
                    <FormField label="Annual rate percent" value={f.rate} onChange={set('rate')} numeric />
                    <div className="col-span-2">
                      <FormField
                        label="sbHash"
                        value={f.hash}
                        onChange={set('hash')}
                        error={c.hashOk ? undefined : 'Expected 0x followed by 64 hex characters.'}
                      />
                    </div>
                  </div>
                </form>
              </aside>

              <motion.div
                key={role}
                className="min-w-0 lg:col-span-8"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <h2 className="sr-only">{current.label} steps</h2>
                <RoleSteps role={role} c={c} f={f} />
              </motion.div>
            </div>
          </div>
        </div>

        <Section tone="sunken" id="check">
          <Reveal>
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-16">
              <div className="min-w-0 lg:col-span-5">
                <h2 className={H2}>Check a bill on-chain</h2>
                <p className={`${LEAD} mt-5 max-w-[48ch]`}>
                  This reads the sbHash from the form straight from the vault. No wallet is needed.
                </p>
              </div>
              <div className="min-w-0 lg:col-span-7">
                {c.hashOk ? (
                  <BillCheck key={f.hash.trim()} hash={f.hash.trim()} feeBps={feeBps} />
                ) : (
                  <p className="text-[15px] text-muted">Enter a valid sbHash in the form to read its bill.</p>
                )}
              </div>
            </div>
          </Reveal>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
