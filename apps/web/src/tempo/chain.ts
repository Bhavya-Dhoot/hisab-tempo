import { useEffect, useState } from 'react';
import { RPC, VAULT } from './config';

// Read-only views of the vault, straight from the chain. No wallet, no key: plain eth_call.
// Selectors: first four bytes of keccak256 of the signature.
const BILLS = '0xa4497182'; // bills(bytes32), the public getter of `mapping(bytes32 => Bill) bills`
const FEE_BPS = '0x24a9d853'; // feeBps()
// Mirrors the uint8 state constants in SettlementVault.sol.
const STATES = ['NONE', 'OPEN', 'FINANCED', 'REALISED', 'PARTIAL'] as const;

export type BillState = (typeof STATES)[number];
export type Bill = {
  state: BillState;
  invoice: bigint;
  advance: bigint;
  rateBps: number;
  tenorDays: number;
};
export type BillQuery = { status: 'loading' } | { status: 'error' } | { status: 'ok'; bill: Bill };

async function rpc(method: string, params: unknown[]): Promise<string> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const { result, error } = await res.json();
  if (error || typeof result !== 'string') throw new Error(error?.message ?? 'unexpected reply');
  return result;
}

export async function readBill(sbHash: string): Promise<Bill> {
  const result = await rpc('eth_call', [{ to: VAULT, data: BILLS + sbHash.slice(2) }, 'latest']);
  // The getter returns seven 32-byte words: exporter, financier, invoice, advance, rateBps, tenorDays, state.
  if (result.length < 2 + 64 * 7) throw new Error('unexpected reply');
  const word = (i: number) => BigInt('0x' + result.slice(2 + 64 * i, 66 + 64 * i));
  const state = STATES[Number(word(6))];
  if (!state) throw new Error('unknown state');
  return { state, invoice: word(2), advance: word(3), rateBps: Number(word(4)), tenorDays: Number(word(5)) };
}

// The platform fee the vault was deployed with, in basis points.
export const readFeeBps = async () => Number(BigInt(await rpc('eth_call', [{ to: VAULT, data: FEE_BPS }, 'latest'])));
export const readHead = async () => Number(BigInt(await rpc('eth_blockNumber', [])));

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

// Latest block number, refreshed every few seconds while the tab is visible. null until the first reply, or if the RPC is unreachable.
export function useHead(everyMs = 4000): number | null {
  const [head, setHead] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    const tick = () => {
      if (document.hidden) return;
      readHead().then((n) => live && setHead(n), () => {});
    };
    tick();
    const id = setInterval(tick, everyMs);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [everyMs]);
  return head;
}

// 6-decimal stablecoin units as an exact decimal string: 48750000n -> "48.75", 43913732n -> "43.913732".
export function amount6(v: bigint): string {
  const frac = String(v % 1_000_000n).padStart(6, '0').replace(/0{1,4}$/, '');
  return `${v / 1_000_000n}.${frac}`;
}
