# eerc-wallet

A React Native confidential wallet for Avalanche's **Encrypted ERC (eERC)**, with
**every zero-knowledge proof generated on the device**.

Built on [`@localproof/eerc-sdk`](https://github.com/localproof/eerc-mobile-sdk).

## Why this exists

eERC's security model is client-side proving, but the official SDKs cannot run in
React Native — `snarkjs` needs WebAssembly (Hermes has none) and `blake-hash` is a
native node-gyp addon. So the standard had no mobile path. This is one.

| | transfer proof |
|---|---|
| snarkjs on a Mac (what the official SDK uses) | 776 ms |
| native Rust (arkworks via Mopro) on a Mac | 184 ms |
| inside an iOS process | 200 ms |
| **from React Native JS on iOS** | **192 ms** |

The JSI bridge costs almost nothing: proving time is the circuit, not the plumbing.
Simulator figures run on the Mac's CPU; a physical handset is not yet measured.

## Live on Fuji

Register, faucet, deposit, decrypt balance and confidential send all work against a
real deployment, with proofs made on device.

| | |
|---|---|
| `EncryptedERC` | `0xAf5a8Df08bF9af8f5C62e834F467C4F51feD6396` |
| `Registrar` | `0x2f51211033a85001B59405641594AEf6aaCc3575` |
| test USDC | `0xE43B33d99F289fA0770Ca518E36d4e7354aC64Eb` |
| example transfer | [`0xe15949…37ec0`](https://testnet.snowtrace.io/tx/0xe15949141df172922931848754b035da9ae17eb796fa4bd3b75dfad7fab37ec0) |

## Run it

```sh
./setup.sh                       # upstream circuits, proving keys, rust prover, deps
cd prover/react-native
npx react-native-asset && (cd ios && pod install)
npm start
xcodebuild -workspace ios/*.xcworkspace -scheme MyTestLibraryExample \
  -configuration Debug -sdk iphonesimulator -derivedDataPath build/dd build
```

Binaries and proving keys are **not committed** (~250 MB, all regenerable) — `setup.sh`
fetches and builds them.

## Layout

```
prover/                   mopro Rust crate — registration / transfer / withdraw
prover/react-native/      the wallet app
  src/screens/            Wallet · Send · Receive
  src/wallet.ts           chain + SDK glue
  src/prover.ts           stages the zkey, calls the native prover over JSI
```

## Notes for anyone picking this up

- The demo key in `src/config.ts` is a **disposable testnet key** holding only Fuji
  AVAX and test USDC. It is committed so the demo runs on clone. Never reuse it.
- ubrn's version is pinned in **three** places that must agree: the app's
  `package.json`, `MoproReactNativeBindings/package.json`, and `MoproFfi.podspec`.
- `ubrn generate bindings` only writes `cpp/generated` and `src/generated`. The
  turbo-module glue (`cpp/mopro-ffi.cpp`, `src/index.tsx`) is hand-written here — a
  regeneration will clobber it and leave an empty `installRustCrate()`.
- Do **not** point `-derivedDataPath` inside `ios/` — RN's post-install hook scans
  every `Info.plist` under it and dies on a binary one.
