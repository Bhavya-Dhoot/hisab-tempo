// Run from apps/web: pnpm check:maths
// Fails loudly if the waterfall drifts from the contract's test vector or from the testnet run.
import assert from 'node:assert/strict';
import { VECTOR, exact, money, settle, toUnits } from '../src/tempo/maths.ts';

// README test vector: legs sum to the invoice.
const s = settle(VECTOR);
assert.equal(money(VECTOR.advance), '42,900.00');
assert.equal(money(s.interest), '1,013.73');
assert.equal(money(s.fee), '146.25');
assert.equal(money(s.toExporter), '4,690.02');
assert.equal(s.toFinancier + s.fee + s.toExporter, VECTOR.invoice);
assert.equal(s.state, 'REALISED');

// The testnet run (vector / 1000) paid exactly these units: see the realise transaction in the README.
const t = settle({ ...VECTOR, invoice: 48_750_000n, advance: 42_900_000n });
assert.deepEqual([t.toFinancier, t.fee, t.toExporter], [43_913_732n, 146_250n, 4_690_018n]);

// Short payment: financier first, nothing beyond what arrived, bill stays PARTIAL.
const short = settle(VECTOR, toUnits(48_705));
assert.equal(short.state, 'PARTIAL');
assert.equal(short.toFinancier + short.fee + short.toExporter, toUnits(48_705));
assert.equal(money(short.toExporter), '4,645.02');

// A payment smaller than what the financier is owed goes to the financier alone.
const tiny = settle(VECTOR, toUnits(1000));
assert.deepEqual([tiny.toFinancier, tiny.fee, tiny.toExporter], [toUnits(1000), 0n, 0n]);

assert.equal(toUnits(48_750.5), 48_750_500_000n);
assert.equal(money(0n), '0.00');
// Exact display for real on-chain amounts: two places at least, never rounded.
assert.deepEqual([exact(43_913_732n), exact(146_250n), exact(48_750_000n), exact(48_750n * 1_000_000n)], ['43.913732', '0.14625', '48.75', '48,750.00']);
console.log('maths ok');
