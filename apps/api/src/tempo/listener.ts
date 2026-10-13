// Watches TransferWithMemo(to == vault) on Tempo and calls vault.realise(memo, amount, txHash).
import { Contract, JsonRpcProvider, Wallet, id } from "ethers";

const RPC = process.env.TEMPO_RPC_URL ?? "https://rpc.moderato.tempo.xyz";
const TOKEN = process.env.TEMPO_TOKEN ?? "0x20c0000000000000000000000000000000000000";
const EXPLORER = "https://explore.testnet.tempo.xyz";
const POLL_MS = Number(process.env.POLL_MS ?? 4000);
const { VAULT_ADDRESS, KEEPER_KEY, FROM_BLOCK } = process.env;

if (!VAULT_ADDRESS || !KEEPER_KEY) {
  console.error("Missing env. Required: VAULT_ADDRESS, KEEPER_KEY (keeper private key).\nOptional: TEMPO_RPC_URL, TEMPO_TOKEN, FROM_BLOCK, POLL_MS.\nExample: VAULT_ADDRESS=0x... KEEPER_KEY=0x... npm run listener");
  process.exit(1);
}

const provider = new JsonRpcProvider(RPC);
const vault = new Contract(VAULT_ADDRESS, [
  "function bills(bytes32) view returns (address exporter, address financier, uint256 invoice, uint256 advance, uint16 rateBps, uint32 tenorDays, uint8 state)",
  "function realise(bytes32 sbHash, uint256 received, bytes32 payTx)",
], new Wallet(KEEPER_KEY, provider));

const TOPIC = id("TransferWithMemo(address,address,uint256,bytes32)");
const toTopic = "0x" + VAULT_ADDRESS.toLowerCase().slice(2).padStart(64, "0");
const done = new Set<string>();

async function handle(log: { transactionHash: string; index: number; topics: readonly string[]; data: string }) {
  const key = `${log.transactionHash}:${log.index}`;
  if (done.has(key)) return;
  done.add(key);
  const memo = log.topics[3];
  const amount = BigInt(log.data); // non-indexed `amount`
  console.log(`payment ${key} memo=${memo} amount=${amount}`);
  try {
    const bill = await vault.bills(memo);
    if (Number(bill.state) !== 2) return console.log("  skip: unknown or not financed");
    const tx = await vault.realise(memo, amount, log.transactionHash);
    await tx.wait();
    console.log(`  realised: ${tx.hash}\n  ${EXPLORER}/tx/${tx.hash}`);
  } catch (e: any) {
    console.error(`  realise failed (already realised?): ${e.shortMessage ?? e.message}`);
  }
}

let next = FROM_BLOCK ? Number(FROM_BLOCK) : await provider.getBlockNumber();
console.log(`listening: vault=${VAULT_ADDRESS} token=${TOKEN} from block ${next} (${RPC})`);
for (;;) {
  try {
    const head = await provider.getBlockNumber();
    if (head >= next) {
      const logs = await provider.getLogs({ address: TOKEN, topics: [TOPIC, null, toTopic], fromBlock: next, toBlock: head });
      for (const l of logs) await handle(l);
      next = head + 1;
    }
  } catch (e: any) {
    console.error("poll error:", e.shortMessage ?? e.message);
  }
  await new Promise((r) => setTimeout(r, POLL_MS));
}
