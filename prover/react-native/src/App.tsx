/**
 * eERC privacy wallet — confidential balances on Avalanche, proven on-device.
 * Three screens (wallet / send / receive) in Prism's design language.
 */
import 'react-native-get-random-values'; // must precede any SDK import (RNG)
import { useCallback, useEffect, useRef, useState } from 'react';
import { Clipboard, StatusBar, View } from 'react-native';
import { EercWallet } from './wallet';
import { CONFIG } from './config';
import { colors as C } from './theme';
import Wallet from './screens/Wallet';
import Send from './screens/Send';
import Receive from './screens/Receive';
import BusyModal from './ui/BusyModal';
import type { Activity } from './activity';
import { shortAddr } from './activity';

type Screen = 'wallet' | 'send' | 'receive';

export default function App() {
  const wallet = useRef<EercWallet | null>(null);
  const [screen, setScreen] = useState<Screen>('wallet');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [registered, setRegistered] = useState(false);
  const [balance, setBalance] = useState('—');
  const [consistent, setConsistent] = useState(true);
  const [pub, setPub] = useState('—');
  const [gas, setGas] = useState('—');
  const [address, setAddress] = useState('');
  const [step, setStep] = useState<string | null>(null);

  // progress text -> modal only. History is the structured `activity` list.
  const say = useCallback((s: string) => setStep(s), []);

  const refresh = useCallback(async () => {
    const w = wallet.current;
    if (!w) return;
    setGas(await w.nativeBalance());
    const reg = await w.isRegistered();
    setRegistered(reg);
    setPub(await w.publicTokenBalance().catch(() => '—'));
    // real history from chain events; merged under anything logged locally this session
    try {
      const chain = await w.history();
      setActivity((local) => {
        const seen = new Set(local.filter((a) => a.hash).map((a) => a.hash));
        const mapped: Activity[] = chain.filter((c) => !seen.has(c.hash)).map((c) => ({
          kind: c.kind === 'send' ? 'send' : 'faucet',
          title: c.kind === 'send' ? `Sent ${CONFIG.confidentialSymbol}`
               : c.kind === 'receive' ? `Received ${CONFIG.confidentialSymbol}`
               : `Added ${CONFIG.confidentialSymbol}`,
          sub: c.counterparty
            ? `${c.kind === 'send' ? 'To' : 'From'}: ${shortAddr(c.counterparty)}`
            : 'From faucet',
          ts: c.ts, hash: c.hash,
        }));
        return [...local, ...mapped].sort((a, b) => b.ts - a.ts).slice(0, 50);
      });
    } catch { /* history is best-effort; balances still render */ }
    if (reg) {
      const b = await w.balance();
      setBalance(b.display);
      setConsistent(b.consistent);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        wallet.current = new EercWallet(CONFIG.demoPrivateKey);
        setAddress(wallet.current.address);
        await refresh();
        setReady(true);
      } catch (e: any) {
        say(`init failed: ${e?.message ?? e}`);
      }
    })();
  }, [refresh, say]);

  const run = async (
    label: string,
    fn: () => Promise<string | void>,
    meta?: (hash?: string) => Omit<Activity, 'ts' | 'hash' | 'failed'>,
  ) => {
    if (busy) return;
    setStep(null);
    setBusy(label);
    try {
      const hash = await fn();
      if (meta) {
        setActivity((a) => [{ ...meta(hash as string), hash: hash as string, ts: Date.now() }, ...a]
          .slice(0, 50));
      }
      await refresh();
      setScreen('wallet');
    } catch (e: any) {
      const msg = e?.shortMessage ?? e?.message ?? String(e);
      if (meta) {
        setActivity((a) => [{ ...meta(), ts: Date.now(), failed: true, sub: msg }, ...a].slice(0, 50));
      }
    } finally {
      setBusy(null);
      setStep(null);
    }
  };

  const w = () => wallet.current!;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <View style={{ flex: 1 }}>
        {screen === 'wallet' && (
          <Wallet
            address={address}
            balance={balance} consistent={consistent} pub={pub} gas={gas}
            registered={registered} ready={ready} busy={busy} activity={activity}
            onReceive={() => setScreen('receive')}
            onSend={() => setScreen('send')}
            onFaucet={() => run('faucet', () => w().faucet('25', say),
              () => ({ kind: 'faucet', title: `Received ${CONFIG.confidentialSymbol}`,
                       sub: 'From faucet', amount: `+25.00 ${CONFIG.confidentialSymbol}` }))}
            onRegister={() => run('register', () => w().register(say),
              () => ({ kind: 'register', title: 'Private account created',
                       sub: 'Key registered on-chain' }))}
            onRefresh={() => run('refresh', async () => {})}
            onCopy={() => { Clipboard.setString(address); setStep(null); }}
          />
        )}
        {screen === 'send' && (
          <Send balance={balance} busy={busy} ready={ready}
                onBack={() => setScreen('wallet')}
                onSend={(to, amt) => run('send', () => w().send(to, amt, say),
                  () => ({ kind: 'send', title: `Sent ${CONFIG.confidentialSymbol}`,
                           sub: `To: ${shortAddr(to)}`,
                           amount: `-${amt} ${CONFIG.confidentialSymbol}` }))} />
        )}
        {screen === 'receive' && (
          <Receive address={address} registered={registered}
                   onBack={() => setScreen('wallet')}
                   onCopy={() => { Clipboard.setString(address); setStep(null); }} />
        )}
      </View>
      <BusyModal busy={busy} step={step} />
    </View>
  );
}
