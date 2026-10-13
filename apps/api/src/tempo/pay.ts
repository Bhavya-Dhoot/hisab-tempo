// Demo buyer: tsx src/tempo/pay.ts <sbHash> <amount>  (needs BUYER_KEY, VAULT_ADDRESS)
import { Contract, JsonRpcProvider, Wallet, parseUnits } from "ethers";

const [sbHash, amount] = process.argv.slice(2);
const { BUYER_KEY, VAULT_ADDRESS } = process.env;
if (!sbHash || !amount || !BUYER_KEY || !VAULT_ADDRESS) {
  console.error("Usage: BUYER_KEY=0x... VAULT_ADDRESS=0x... tsx src/tempo/pay.ts <sbHash(bytes32)> <amount>");
  process.exit(1);
}
const provider = new JsonRpcProvider(process.env.TEMPO_RPC_URL ?? "https://rpc.moderato.tempo.xyz");
const token = new Contract(
  process.env.TEMPO_TOKEN ?? "0x20c0000000000000000000000000000000000000",
  ["function transferWithMemo(address to, uint256 amount, bytes32 memo)"],
  new Wallet(BUYER_KEY, provider),
);
const tx = await token.transferWithMemo(VAULT_ADDRESS, parseUnits(amount, 6), sbHash);
await tx.wait();
console.log(`paid: https://explore.testnet.tempo.xyz/tx/${tx.hash}`);
