// Barrel for the generated bindings.
// NOTE: `ubrn generate bindings` only writes src/generated/*; the re-export barrel
// normally comes from `generate turbo-module`. Hand-written here so the app can do
// `import { generateCircomProof, ProofLib } from 'mopro-ffi'`.
import installer from './NativeMoproFfi';

let rustInstalled = false;
if (!rustInstalled) {
  installer.installRustCrate();
  rustInstalled = true;
}

import * as prover from './generated/prover';

let initialized = false;
if (!initialized) {
  prover.default.initialize();
  initialized = true;
}

export * from './generated/prover';

export async function uniffiInitAsync() {
  // native install is synchronous above; kept for parity with the web build
}

export default { prover };
