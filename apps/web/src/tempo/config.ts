export const CHAIN = 'Tempo Testnet (Moderato)';
export const CHAIN_ID = 42431;
export const EXPLORER = 'https://explore.testnet.tempo.xyz';
export const TOKEN = { symbol: 'pathUSD', address: '0x20c0000000000000000000000000000000000000' };
// Deployed vault (contracts/deployments/tempo.json). VITE_VAULT_ADDRESS overrides it for another deployment.
export const VAULT: string = import.meta.env.VITE_VAULT_ADDRESS || '0xe0FC7e9fb0A36eD966839dC532ECF53d57630dbf';
export const GITHUB = 'https://github.com/vj-io/hisab-tempo';

// The demo bill exercised on testnet by scripts/tempo-demo.sh. Test vector scaled 1000x: invoice 48.75 pathUSD.
export const DEMO = {
  sbHash: '0x28c68e6d630f6987061a518400fcaaeaeaaa98ced9407839665ad0303b2d8774',
  txs: [
    { fn: 'register', hash: '0x513444486c1038edfb655c1df343c02bcbb524509da24631ae8ad57a0e0f6395', effect: 'Bill recorded: invoice 48.75 pathUSD, 75 days.' },
    { fn: 'finance', hash: '0x712d8cb861124cb4043652be6a98010d14738524f4cf63ac5f052fcbed6a8a00', effect: 'Financier pays the exporter 42.90.' },
    { fn: 'transferWithMemo', hash: '0x3576ca2148d57d9ae5367dc454b755917a7aca014e14a79a652e8c6ceca841df', effect: 'Buyer sends 48.75 with the bill hash as the memo.' },
    { fn: 'realise', hash: '0x322317a220a5cd90c17582a7661b31606c56ec57f6cba7e0af987312ad3993f4', effect: 'Financier 43.913732, fee 0.146250, exporter 4.690018.' },
  ],
};
