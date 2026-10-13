#!/usr/bin/env bash
# End-to-end testnet demo on Tempo Moderato. One throwaway wallet plays exporter, financier and buyer.
# Usage: PK=0x... ./scripts/tempo-demo.sh      (testnet key only; never a key holding real funds)
set -euo pipefail
: "${PK:?set PK to a throwaway testnet private key}"
cd "$(dirname "$0")/.."
RPC=${TEMPO_RPC_URL:-https://rpc.moderato.tempo.xyz}
TOKEN=${TEMPO_TOKEN:-0x20c0000000000000000000000000000000000000}
EXPLORER=https://explore.testnet.tempo.xyz
ADDR=$(cast wallet address --private-key "$PK")
SB=$(cast keccak "SB-6674321-$(date +%s)")
send() { cast send "$@" --private-key "$PK" --rpc-url "$RPC" --json | node -pe 'JSON.parse(require("fs").readFileSync(0)).transactionHash'; }

echo "== wallet $ADDR"
cast rpc tempo_fundAddress "$ADDR" --rpc-url "$RPC" >/dev/null || echo "faucet RPC failed; fund via web faucet"
sleep 5
echo "balance: $(cast call "$TOKEN" 'balanceOf(address)(uint256)' "$ADDR" --rpc-url "$RPC")"

echo "== deploy vault"
(cd contracts && DEPLOYER_KEY="$PK" pnpm -s deploy:tempo)
VAULT=$(node -p 'require("./contracts/deployments/tempo.json").vault')
echo "vault $VAULT  $EXPLORER/address/$VAULT"

# Test vector scaled 1000x down: invoice 48.75, advance 42.90 (88%), 11.5% p.a., 75 days.
echo "== register $SB";  echo "tx $(send "$VAULT" 'register(bytes32,uint256,uint32)' "$SB" 48750000 75)"
echo "== approve";       echo "tx $(send "$TOKEN" 'approve(address,uint256)' "$VAULT" 100000000)"
echo "== finance";       echo "tx $(send "$VAULT" 'finance(bytes32,uint256,uint16)' "$SB" 42900000 1150)"
echo "== second finance (expect ALREADY_LOCKED)"
cast call "$VAULT" 'finance(bytes32,uint256,uint16)' "$SB" 42900000 1150 --from "$ADDR" --rpc-url "$RPC" 2>&1 | tail -1 || true

echo "== start listener, pay with memo"
FROM=$(cast block-number --rpc-url "$RPC")
(cd apps/api && VAULT_ADDRESS="$VAULT" KEEPER_KEY="$PK" FROM_BLOCK="$FROM" npx tsx src/tempo/listener.ts) &
LPID=$!
trap 'kill $LPID 2>/dev/null || true' EXIT
echo "pay tx $(send "$TOKEN" 'transferWithMemo(address,uint256,bytes32)' "$VAULT" 48750000 "$SB")"
for _ in $(seq 1 30); do
  STATE=$(cast call "$VAULT" 'bills(bytes32)(address,address,uint256,uint256,uint16,uint32,uint8)' "$SB" --rpc-url "$RPC" | tail -1)
  [ "$STATE" = "3" ] && break; sleep 2
done
echo "final state: $STATE (3 = REALISED)"
echo "== summary"; echo "VAULT=$VAULT"; echo "SB=$SB"
