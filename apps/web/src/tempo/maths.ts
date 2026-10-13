// The waterfall, exactly as SettlementVault._settle() computes it. Amounts are 6-decimal token units.

export type Terms = { invoice: bigint; advance: bigint; rateBps: number; tenorDays: number; feeBps: number };
export type Split = { interest: bigint; toFinancier: bigint; fee: bigint; toExporter: bigint; state: 'REALISED' | 'PARTIAL' };

export const UNIT = 1_000_000n;
// Fee the testnet vault was deployed with (contracts/scripts/deploy-tempo.ts), in basis points.
export const FEE_BPS = 30;
// The README's test vector: invoice 48,750.00, 88% advance, 11.5% a year, 75 days.
export const VECTOR: Terms = { invoice: 48_750n * UNIT, advance: 42_900n * UNIT, rateBps: 1150, tenorDays: 75, feeBps: FEE_BPS };

export function settle(t: Terms, received: bigint = t.invoice): Split {
  const interest = (t.advance * BigInt(t.rateBps) * BigInt(t.tenorDays)) / (10_000n * 365n);
  const due = t.advance + interest;
  const toFinancier = received < due ? received : due;
  const rest = received - toFinancier;
  const feeDue = (t.invoice * BigInt(t.feeBps)) / 10_000n;
  const fee = rest < feeDue ? rest : feeDue;
  return { interest, toFinancier, fee, toExporter: rest - fee, state: received >= t.invoice ? 'REALISED' : 'PARTIAL' };
}

// Whole currency units (may carry cents) to token units, without float drift: 48750.5 -> 48750500000n.
export const toUnits = (n: number) => BigInt(Math.round(n * 100)) * (UNIT / 100n);

// Token units as an exact grouped decimal: two places at least, more only when the value needs them. 43913732n -> "43.913732".
export function exact(v: bigint): string {
  const whole = (v / UNIT).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${whole}.${(v % UNIT).toString().padStart(6, '0').replace(/0{1,4}$/, '')}`;
}

// Token units as a grouped decimal string, rounded half-up to `dp` places: 1013732876n -> "1,013.73".
export function money(v: bigint, dp = 2): string {
  const scale = 10n ** BigInt(6 - dp);
  const r = (v + scale / 2n) / scale;
  const whole = (r / 10n ** BigInt(dp)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dp === 0 ? whole : `${whole}.${(r % 10n ** BigInt(dp)).toString().padStart(dp, '0')}`;
}
