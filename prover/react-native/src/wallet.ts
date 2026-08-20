/**
 * eERC wallet: chain reads/writes + on-device proving, built on @localproof/eerc-sdk.
 * Everything secret stays on the device; only proofs and ciphertexts go on-chain.
 */
import { ethers } from 'ethers';
import {
  ENCRYPTED_ERC_ABI, REGISTRAR_ABI, ERC20_ABI,
  keysFromSeed, registrationHash, buildRegistrationInput, buildTransferInput,
  buildDepositPCT, decryptBalance, fromUnits, toUnits, type EercKeys,
} from '@localproof/eerc-sdk';
import { CONFIG } from './config';
import { proveOnDevice } from './prover';

export class EercWallet {
  readonly provider: ethers.JsonRpcProvider;
  readonly signer: ethers.Wallet;
  readonly keys: EercKeys;
  readonly eerc: ethers.Contract;
  readonly registrar: ethers.Contract;
  readonly erc20: ethers.Contract;

  constructor(privateKey: string) {
    this.provider = new ethers.JsonRpcProvider(CONFIG.rpc, Number(CONFIG.chainId), {
      staticNetwork: true, // RN: skip auto-detect chatter
    });
    this.signer = new ethers.Wallet(privateKey, this.provider);
    // eERC key deterministically derived from the EVM key, so the wallet is the only secret
    this.keys = keysFromSeed(BigInt(privateKey));
    this.eerc = new ethers.Contract(CONFIG.encryptedERC, ENCRYPTED_ERC_ABI as any, this.signer);
    this.registrar = new ethers.Contract(CONFIG.registrar, REGISTRAR_ABI as any, this.signer);
    this.erc20 = new ethers.Contract(CONFIG.erc20, ERC20_ABI as any, this.signer);
  }

  get address() { return this.signer.address; }

  async nativeBalance(): Promise<string> {
    return ethers.formatEther(await this.provider.getBalance(this.address));
  }

  async isRegistered(): Promise<boolean> {
    return this.registrar.isUserRegistered(this.address);
  }

  /** Proves registration ON DEVICE, then submits it. */
  async register(onLog: (s: string) => void): Promise<string> {
    const h = registrationHash(CONFIG.chainId, this.keys.formatted, this.address);
    const input = buildRegistrationInput(this.keys, this.address, CONFIG.chainId, h);
    onLog('proving registration on device...');
    const { proof, ms } = await proveOnDevice('registration', input);
    onLog(`registration proved in ${ms}ms`);
    const tx = await this.registrar.register(proof);
    const r = await tx.wait();
    return r.hash;
  }

  private async tokenId(): Promise<bigint> {
    return this.eerc.tokenIds(CONFIG.erc20);
  }

  async auditorPublicKey(): Promise<bigint[]> {
    const p = await this.eerc.auditorPublicKey();
    return [BigInt(p.x ?? p[0]), BigInt(p.y ?? p[1])];
  }

  /** Reads the encrypted balance and decrypts it locally. */
  async balance(): Promise<{ units: bigint; display: string; consistent: boolean; raw: any }> {
    const id = await this.tokenId();
    const r = await this.eerc.balanceOf(this.address, id);
    const { balance, consistent } = decryptBalance(this.keys.formatted, {
      encryptedBalance: [
        [BigInt(r[0].c1.x), BigInt(r[0].c1.y)],
        [BigInt(r[0].c2.x), BigInt(r[0].c2.y)],
      ],
      balancePCT: r[3].map((x: any) => BigInt(x)),
      amountPCTs: r[2].map((a: any) => a[0].map((x: any) => BigInt(x))),
    });
    return { units: balance, display: fromUnits(balance, CONFIG.eercDecimals), consistent, raw: r };
  }

  async publicTokenBalance(): Promise<string> {
    const b: bigint = await this.erc20.balanceOf(this.address);
    return ethers.formatUnits(b, CONFIG.erc20Decimals);
  }

  /** Public ERC20 -> encrypted balance. No proof needed; the amount IS public here. */
  async deposit(amountTokens: string, onLog: (s: string) => void): Promise<string> {
    const amount = ethers.parseUnits(amountTokens, CONFIG.erc20Decimals);
    const units = toUnits(amount, CONFIG.erc20Decimals, CONFIG.eercDecimals);
    onLog(`approving ${amountTokens}...`);
    await (await this.erc20.approve(CONFIG.encryptedERC, amount)).wait();
    onLog(`depositing -> ${units} units`);
    const tx = await this.eerc.deposit(amount, CONFIG.erc20, buildDepositPCT(units, this.keys.publicKey));
    const r = await tx.wait();
    return r.hash;
  }

  /**
   * Testnet faucet: mints public test USDC to this wallet, then deposits it into
   * the confidential balance so it is immediately spendable. The test token's
   * `mint` is intentionally unguarded, so no funded faucet service is needed.
   */
  async faucet(amountTokens: string, onLog: (s: string) => void): Promise<string> {
    const amount = ethers.parseUnits(amountTokens, CONFIG.erc20Decimals);
    onLog(`Minting ${amountTokens} ${CONFIG.tokenSymbol}…`);
    await (await this.erc20.mint(this.address, amount)).wait();
    onLog('Approving…');
    await (await this.erc20.approve(CONFIG.encryptedERC, amount)).wait();
    const units = toUnits(amount, CONFIG.erc20Decimals, CONFIG.eercDecimals);
    onLog(`Encrypting into your balance…`);
    const tx = await this.eerc.deposit(amount, CONFIG.erc20, buildDepositPCT(units, this.keys.publicKey));
    const r = await tx.wait();
    return r.hash;
  }

  /**
   * Real history, read from chain events so it survives app restarts.
   * NOTE: amounts are NOT in the events (that is the point of eERC) — we can show
   * who/when/tx, and the direction, but the value stays encrypted. Locally-known
   * amounts are merged in by the caller.
   */
  async history(lookbackBlocks = 2000): Promise<Array<{
    kind: 'send' | 'receive' | 'faucet'; counterparty?: string; hash: string; ts: number;
  }>> {
    const latest = await this.provider.getBlockNumber();
    const from = Math.max(0, latest - lookbackBlocks);
    const me = this.address;

    const [sent, recv, dep] = await Promise.all([
      this.eerc.queryFilter(this.eerc.filters.PrivateTransfer(me, null), from, latest).catch(() => []),
      this.eerc.queryFilter(this.eerc.filters.PrivateTransfer(null, me), from, latest).catch(() => []),
      this.eerc.queryFilter(this.eerc.filters.Deposit(me), from, latest).catch(() => []),
    ]);

    const blockTs = new Map<number, number>();
    const rows = [
      ...sent.map((e: any) => ({ kind: 'send' as const, counterparty: e.args?.to, e })),
      ...recv.map((e: any) => ({ kind: 'receive' as const, counterparty: e.args?.from, e })),
      ...dep.map((e: any) => ({ kind: 'faucet' as const, counterparty: undefined, e })),
    ];
    await Promise.all([...new Set(rows.map((r) => r.e.blockNumber))].map(async (bn) => {
      const b = await this.provider.getBlock(bn);
      if (b) blockTs.set(bn, b.timestamp * 1000);
    }));

    return rows
      .map((r) => ({ kind: r.kind, counterparty: r.counterparty,
                     hash: r.e.transactionHash, ts: blockTs.get(r.e.blockNumber) ?? Date.now() }))
      .sort((a, b) => b.ts - a.ts);
  }

  /** Confidential transfer. Amount and balances stay encrypted; proof made on device. */
  async send(to: string, amountDisplay: string, onLog: (s: string) => void): Promise<string> {
    if (!ethers.isAddress(to)) throw new Error('invalid recipient address');
    if (!(await this.registrar.isUserRegistered(to))) throw new Error('recipient is not registered with eERC');

    const scale = 10n ** BigInt(CONFIG.eercDecimals);
    const [whole, frac = ''] = amountDisplay.split('.');
    const amount = BigInt(whole || 0) * scale + BigInt((frac + '0'.repeat(CONFIG.eercDecimals)).slice(0, CONFIG.eercDecimals) || 0);
    if (amount <= 0n) throw new Error('amount must be positive');

    const bal = await this.balance();
    if (!bal.consistent) throw new Error('local balance is inconsistent — refresh first');

    const receiverPub = (await this.registrar.getUserPublicKey(to)).map((x: any) => BigInt(x));
    const built = buildTransferInput({
      sender: this.keys,
      receiverPublicKey: receiverPub,
      auditorPublicKey: await this.auditorPublicKey(),
      senderBalance: bal.units,
      encryptedBalance: [
        [BigInt(bal.raw[0].c1.x), BigInt(bal.raw[0].c1.y)],
        [BigInt(bal.raw[0].c2.x), BigInt(bal.raw[0].c2.y)],
      ],
      amount,
    });

    onLog('proving transfer on device...');
    const { proof, ms } = await proveOnDevice('transfer', built.input);
    onLog(`transfer proved in ${ms}ms — submitting`);

    const id = await this.tokenId();
    const tx = await this.eerc[
      'transfer(address,uint256,((uint256[2],uint256[2][2],uint256[2]),uint256[32]),uint256[7])'
    ](to, id, proof, built.senderBalancePCT);
    const r = await tx.wait();
    return r.hash;
  }
}
