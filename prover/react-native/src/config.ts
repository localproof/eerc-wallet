/** Demo config. Addresses come from our Fuji deployment (see repo README). */
export const CONFIG = {
  chainId: 43113n,
  rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
  explorer: 'https://testnet.snowtrace.io',
  encryptedERC: '0xAf5a8Df08bF9af8f5C62e834F467C4F51feD6396',
  registrar: '0x2f51211033a85001B59405641594AEf6aaCc3575',
  erc20: '0xE43B33d99F289fA0770Ca518E36d4e7354aC64Eb',
  /** Public ERC20 symbol (must match the deployed token). */
  tokenSymbol: 'USDC',
  /** Confidential (encrypted) form of it. */
  confidentialSymbol: 'cUSDC',
  eercDecimals: 2,
  erc20Decimals: 18,
  /** Dev only: drive an action on launch, for automated verification. */
  devAutoRun: false,
  /**
   * DISPOSABLE TESTNET DEMO KEY — holds only Fuji AVAX and test USDC, no real value.
   * Committed on purpose so `git clone && run` works for reviewers. Never reuse this
   * key anywhere, and never put a mainnet key here. Rotate with scripts/fund-demo.mts.
   */
  demoPrivateKey: '0x3b8244c4daa11a524b506b4d1ec3fa7aa0c724f7dbc1d6835ac5e35e4fa7d008',
};
