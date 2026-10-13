import { useEffect, useState } from 'react';
import { RPC, VAULT } from './config';

// Read-only view of a bill, straight from the vault. No wallet, no key: one eth_call.
// Selector of bills(bytes32), the public getter of `mapping(bytes32 => Bill) bills`.
const BILLS = '0xa4497182';
// Mirrors the uint8 state constants in SettlementVault.sol.
const STATES = ['NONE', 'OPEN', 'FINANCED', 'REALISED', 'PARTIAL'] as const;

export type Bill = {
  state: (typeof STATES)[number];
  invoice: bigint;
  advance: bigint;
  rateBps: number;
  tenorDays: number;
};
export type BillQuery = { status: 'loading' } | { status: 'error' } | { status: 'ok'; bill: Bill };

export async function readBill(sbHash: string): Promise<Bill> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: VAULT, data: BILLS + sbHash.slice(2) }, 'latest'] }),
  });
  const { result, error } = await res.json();
  // The getter returns seven 32-byte words: exporter, financier, invoice, advance, rateBps, tenorDays, state.
  if (error || typeof result !== 'string' || result.length < 2 + 64 * 7) throw new Error(error?.message ?? 'unexpected reply');
  const word = (i: number) => BigInt('0x' + result.slice(2 + 64 * i, 66 + 64 * i));
  const state = STATES[Number(word(6))];
  if (!state) throw new Error('unknown state');
  return { state, invoice: word(2), advance: word(3), rateBps: Number(word(4)), tenorDays: Number(word(5)) };
}

export function useBill(sbHash: string | null): BillQuery {
  const [q, setQ] = useState<BillQuery>({ status: 'loading' });
  useEffect(() => {
    if (!sbHash) return;
    let live = true;
    setQ({ status: 'loading' });
    readBill(sbHash).then(
      (bill) => live && setQ({ status: 'ok', bill }),
      () => live && setQ({ status: 'error' }),
    );
    return () => {
      live = false;
    };
  }, [sbHash]);
  return q;
}

// 6-decimal stablecoin units as an exact decimal string: 48750000n -> "48.75", 43913732n -> "43.913732".
export function amount6(v: bigint): string {
  const frac = String(v % 1_000_000n).padStart(6, '0').replace(/0{1,4}$/, '');
  return `${v / 1_000_000n}.${frac}`;
}
