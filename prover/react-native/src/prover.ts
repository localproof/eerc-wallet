/**
 * On-device Groth16 proving. Stages the .zkey out of the app bundle, then calls
 * the native Rust prover through the JSI turbo module. No snarkjs, no WASM.
 */
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { generateCircomProof, verifyCircomProof, ProofLib, type CircomProofResult } from 'mopro-ffi';
import { nativeToCalldata, type CalldataProof, type CircuitInput } from '@localproof/eerc-sdk';

const staged = new Map<string, string>();

async function stageAsset(fileName: string): Promise<string> {
  const cached = staged.get(fileName);
  if (cached) return cached;
  const dest = `${RNFS.DocumentDirectoryPath}/${fileName}`;
  if (!(await RNFS.exists(dest))) {
    if (Platform.OS === 'android') await RNFS.copyFileAssets(`custom/${fileName}`, dest);
    else await RNFS.copyFile(`${RNFS.MainBundlePath}/${fileName}`, dest);
  }
  const path = dest.replace('file://', '');
  staged.set(fileName, path);
  return path;
}

export interface ProveResult { proof: CalldataProof; ms: number }

/** @param circuit 'registration' | 'transfer' | 'withdraw' */
export async function proveOnDevice(circuit: string, input: CircuitInput): Promise<ProveResult> {
  const zkey = await stageAsset(`${circuit}.zkey`);
  const t0 = Date.now();
  const res: CircomProofResult = await generateCircomProof(
    zkey, JSON.stringify(input), ProofLib.Arkworks,
  );
  const ms = Date.now() - t0;

  // sanity: the Rust witness stack silently zeroes bare scalars. Our SDK always
  // wraps them, so an all-zero signal here means an input builder regressed.
  if (res.inputs.every((s) => s === '0')) throw new Error('all public signals zero — bad witness');

  return {
    proof: nativeToCalldata({
      a: { x: res.proof.a.x, y: res.proof.a.y },
      b: { x: [res.proof.b.x[0], res.proof.b.x[1]], y: [res.proof.b.y[0], res.proof.b.y[1]] },
      c: { x: res.proof.c.x, y: res.proof.c.y },
      inputs: res.inputs,
    }),
    ms,
  };
}

/** Local verify — useful to prove the artifact is sane before paying gas. */
export async function verifyOnDevice(circuit: string, res: CircomProofResult): Promise<boolean> {
  const zkey = await stageAsset(`${circuit}.zkey`);
  return verifyCircomProof(zkey, res, ProofLib.Arkworks);
}
