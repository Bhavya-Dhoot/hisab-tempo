import { useId, useState, type ReactNode } from 'react';
import { Warning } from '@phosphor-icons/react';
import { CountUp, H2, LABEL, LEAD, Section, btnQuiet } from '../kit';
import { FEE_BPS, UNIT, VECTOR, money, settle, toUnits, type Terms } from '../maths';

const MIN_INVOICE = 1_000;
const MAX_INVOICE = 500_000;
const COUNT_S = 0.6;
const SCALE = 1_000_000n;
const FEE_PCT = `${(FEE_BPS / 100).toFixed(2)}%`;

// The opening values are read from the README test vector, so the first paint and "Reset" cannot drift from it.
const START = {
  invoice: Number(VECTOR.invoice / UNIT),
  advance: Number((VECTOR.advance * 100n) / VECTOR.invoice),
  rate: VECTOR.rateBps / 100,
  days: VECTOR.tenorDays,
};
type Inputs = typeof START;

type Leg = { key: string; name: string; note: string; value: bigint; tone: string };

const clampInvoice = (n: number) => Math.min(MAX_INVOICE, Math.max(MIN_INVOICE, Math.round(n)));

// Part of a whole as a percent to two places, rounded half up, in integer maths.
const pct = (part: bigint, whole: bigint) => {
  const hundredths = (part * 20_000n + whole) / (2n * whole);
  return `${hundredths / 100n}.${(hundredths % 100n).toString().padStart(2, '0')}%`;
};

// Native range inputs with a square, flat track and a square thumb, in the project's tokens.
const RANGE =
  'block h-8 w-full cursor-pointer appearance-none bg-transparent accent-accent ' +
  '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-line-strong ' +
  '[&::-webkit-slider-thumb]:-mt-[11px] [&::-webkit-slider-thumb]:box-border [&::-webkit-slider-thumb]:h-[26px] [&::-webkit-slider-thumb]:w-3 ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-solid ' +
  '[&::-webkit-slider-thumb]:border-accent-ink [&::-webkit-slider-thumb]:bg-accent ' +
  '[&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-line-strong ' +
  '[&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:h-[26px] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-none ' +
  '[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-accent-ink [&::-moz-range-thumb]:bg-accent';

const NUMBER_FIELD =
  'h-12 w-full rounded-ui border border-line-strong bg-raised px-3 font-mono tabular text-[18px] text-text ' +
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

function Field({ controls, label, value, children }: { controls: string; label: string; value: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={controls.split(' ')[0]} className="text-[15px] font-medium">
          {label}
        </label>
        <output htmlFor={controls} className="font-mono tabular text-[15px]">
          {value}
        </output>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Range({
  id,
  value,
  min,
  max,
  step,
  text,
  onChange,
  label,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  text: string;
  label?: string;
  onChange: (n: number) => void;
}) {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-valuetext={text}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      className={RANGE}
    />
  );
}

// Four legs of the invoice, sized by value, with no track behind them. Each leg runs from its start to the end of the bar and
// the next leg paints over its tail, so there are no seams. Only transform changes, so a drag stays cheap.
function SplitBar({ legs, whole }: { legs: Leg[]; whole: bigint }) {
  let before = 0n;
  const label = `Split of the invoice: ${legs.map((l) => `${l.name} ${pct(l.value, whole)}`).join(', ')}`;
  return (
    <div role="img" aria-label={label} className="relative h-5 overflow-hidden">
      {legs.map((l) => {
        const start = Number((before * SCALE) / whole) / Number(SCALE);
        before += l.value;
        return (
          <div
            key={l.key}
            className={`absolute inset-0 origin-left transition-transform duration-500 ease-ledger ${l.tone}`}
            style={{ transform: `translateX(${start * 100}%) scaleX(${1 - start})` }}
          />
        );
      })}
    </div>
  );
}

export function Calculator() {
  const uid = useId();
  const [v, setV] = useState<Inputs>(START);
  const [draft, setDraft] = useState<string | null>(null);
  const set = (patch: Partial<Inputs>) => setV((s) => ({ ...s, ...patch }));

  const id = { invoiceNum: `${uid}-invoice`, invoiceRange: `${uid}-invoice-range`, advance: `${uid}-advance`, rate: `${uid}-rate`, days: `${uid}-days` };

  const invoice = toUnits(v.invoice);
  const terms: Terms = {
    invoice,
    advance: (invoice * BigInt(Math.round(v.advance))) / 100n,
    rateBps: Math.round(v.rate * 100),
    tenorDays: v.days,
    feeBps: FEE_BPS,
  };
  const split = settle(terms);
  // settle() pays the financier first and caps every payout at what arrived, so split the financier's share into advance and interest.
  const repaid = split.toFinancier < terms.advance ? split.toFinancier : terms.advance;
  const interest = split.toFinancier - repaid;
  const cost = interest + split.fee;

  const legs: Leg[] = [
    { key: 'advance', name: 'Advance repaid to the financier', note: `${v.advance}% of the invoice`, value: repaid, tone: 'bg-accent' },
    { key: 'interest', name: 'Interest', note: `${v.rate.toFixed(1)}% a year for ${v.days} days`, value: interest, tone: 'bg-muted' },
    { key: 'fee', name: 'Platform fee', note: `${FEE_PCT} of the invoice`, value: split.fee, tone: 'bg-line-strong' },
    { key: 'exporter', name: 'Exporter remainder', note: 'Paid when the buyer pays', value: split.toExporter, tone: 'bg-text' },
  ];
  const legsSum = legs.reduce((sum, l) => sum + l.value, 0n);
  const atStart = v.invoice === START.invoice && v.advance === START.advance && v.rate === START.rate && v.days === START.days;

  return (
    <Section id="calculator">
      <p className={LABEL}>Calculator</p>
      <h2 className={`${H2} mt-4`}>Run your own invoice.</h2>
      <p className={`${LEAD} mt-5 max-w-[54ch]`}>Every figure comes from the same arithmetic the vault runs.</p>

      {/* From lg: inputs take 5 of 12 columns, results 7. Below lg: one column, inputs first, then the results. */}
      <div className="mt-12 grid grid-cols-1 gap-12 md:mt-16 lg:grid-cols-12 lg:gap-x-14">
        <div className="flex flex-col gap-9 lg:col-span-5">
          <Field controls={`${id.invoiceNum} ${id.invoiceRange}`} label="Invoice amount in USD" value={money(invoice, 0)}>
            <input
              id={id.invoiceNum}
              type="number"
              inputMode="numeric"
              autoComplete="off"
              min={MIN_INVOICE}
              max={MAX_INVOICE}
              step={250}
              value={draft ?? String(v.invoice)}
              onChange={(e) => {
                setDraft(e.target.value);
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n)) set({ invoice: clampInvoice(n) });
              }}
              onBlur={() => setDraft(null)}
              className={NUMBER_FIELD}
            />
            <div className="mt-3">
              <Range
                id={id.invoiceRange}
                label="Invoice amount in USD, slider"
                value={v.invoice}
                min={MIN_INVOICE}
                max={MAX_INVOICE}
                step={250}
                text={`${money(invoice, 0)} US dollars`}
                onChange={(n) => {
                  setDraft(null);
                  set({ invoice: n });
                }}
              />
            </div>
          </Field>

          <Field controls={id.advance} label="Advance" value={`${v.advance}%`}>
            <Range id={id.advance} value={v.advance} min={50} max={95} step={1} text={`${v.advance} percent of the invoice`} onChange={(n) => set({ advance: n })} />
          </Field>

          <Field controls={id.rate} label="Annual rate" value={`${v.rate.toFixed(1)}%`}>
            <Range id={id.rate} value={v.rate} min={6} max={24} step={0.5} text={`${v.rate.toFixed(1)} percent a year`} onChange={(n) => set({ rate: n })} />
          </Field>

          <Field controls={id.days} label="Days until the buyer pays" value={`${v.days} days`}>
            <Range id={id.days} value={v.days} min={15} max={180} step={1} text={`${v.days} days`} onChange={(n) => set({ days: n })} />
          </Field>

          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-6">
            <div>
              <div className="text-[15px] font-medium">Platform fee</div>
              <div className="mt-0.5 text-[13px] text-muted">The demo rate, fixed in the deployed vault</div>
            </div>
            <span className="font-mono tabular text-[15px]">{FEE_PCT}</span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setV(START);
                setDraft(null);
              }}
              disabled={atStart}
              aria-label="Reset to the test vector"
              className={`${btnQuiet} disabled:pointer-events-none disabled:opacity-40`}
            >
              Reset values
            </button>
          </div>
        </div>

        <div role="group" aria-label="Results for this invoice" className="rounded-ui border border-line bg-raised p-6 shadow-lift sm:p-8 lg:col-span-7 lg:p-10">
          <p className="text-[15px] text-muted">On shipment day you receive</p>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 text-accent-text">
            <CountUp to={terms.advance} duration={COUNT_S} className="text-[40px] font-medium leading-none tracking-[-0.03em] sm:text-[56px]" />
            <span className="font-mono text-[15px] text-muted">USD</span>
          </p>

          <div className="mt-9">
            <SplitBar legs={legs} whole={invoice} />
            <ul className="mt-5 divide-y divide-line">
              {legs.map((l) => (
                <li key={l.key} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 py-3.5">
                  <span aria-hidden className={`size-2.5 self-start translate-y-[6px] ${l.tone}`} />
                  <div className="min-w-0">
                    <div className="text-[15px]">{l.name}</div>
                    <div className="mt-0.5 text-[13px] text-muted">{l.note}</div>
                  </div>
                  <CountUp to={l.value} duration={COUNT_S} className="text-[16px]" />
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-line pt-8">
            <p className="text-[15px] text-muted">When the buyer pays, you receive</p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3">
              <CountUp to={split.toExporter} duration={COUNT_S} className="text-[28px] font-medium leading-none tracking-[-0.02em] sm:text-[32px]" />
              <span className="font-mono text-[15px] text-muted">USD</span>
            </p>
            {split.toExporter === 0n && (
              <p role="status" className="mt-4 flex items-start gap-2 text-[14px] leading-snug text-danger">
                <Warning size={16} aria-hidden className="mt-0.5 shrink-0" />
                <span>These terms leave the exporter nothing at settlement. The advance, interest and fee use up the whole invoice.</span>
              </p>
            )}
          </div>

          <div className="mt-8 space-y-2 border-t border-line pt-6 text-[14px] text-muted">
            <p>
              Legs sum to <CountUp to={legsSum} duration={COUNT_S} className="text-text" />
            </p>
            <p>
              Cost of the cash: <CountUp to={cost} duration={COUNT_S} className="text-text" />, which is{' '}
              <span className="font-mono tabular text-text">{pct(cost, invoice)}</span> of the invoice.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
