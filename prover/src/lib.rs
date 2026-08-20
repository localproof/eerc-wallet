#[macro_use]
mod stubs;

mod error;
pub use error::MoproError;

// Initializes the shared UniFFI scaffolding and defines the `MoproError` enum.
#[cfg(not(target_arch = "wasm32"))]
mopro_ffi::app!();
// Skip wasm_setup!() to avoid extern crate alias conflict
// Instead, we import wasm_bindgen directly when needed
#[cfg(all(feature = "wasm", target_arch = "wasm32"))]
use mopro_ffi::prelude::wasm_bindgen;

/// You can also customize the bindings by #[uniffi::export]
/// Reference: https://mozilla.github.io/uniffi-rs/latest/proc_macro/index.html
#[cfg_attr(feature = "uniffi", uniffi::export)]
pub fn mopro_hello_world() -> String {
    "Hello, World!".to_string()
}

#[cfg_attr(
    all(feature = "wasm", target_arch = "wasm32"),
    wasm_bindgen(js_name = "moproWasmHelloWorld")
)]
pub fn mopro_wasm_hello_world() -> String {
    "Hello, World!".to_string()
}

#[cfg(test)]
mod uniffi_tests {
    #[test]
    fn test_mopro_hello_world() {
        assert_eq!(super::mopro_hello_world(), "Hello, World!");
    }
}


// CIRCOM_TEMPLATE
// --- Circom Example of using groth16 proving and verifying circuits ---

// Module containing the Circom circuit logic (Multiplier2)
#[macro_use]
mod circom;
pub use circom::{
    generate_circom_proof, verify_circom_proof, CircomProof, CircomProofResult, ProofLib, G1, G2,
};

mod witness {
    rust_witness::witness!(multiplier2);
    rust_witness::witness!(registration);
    rust_witness::witness!(transfer);
    rust_witness::witness!(withdraw);
}

crate::set_circom_circuits! {
    ("multiplier2_final.zkey", circom_prover::witness::WitnessFn::RustWitness(witness::multiplier2_witness)),
    ("registration.zkey", circom_prover::witness::WitnessFn::RustWitness(witness::registration_witness)),
    ("transfer.zkey", circom_prover::witness::WitnessFn::RustWitness(witness::transfer_witness)),
    ("withdraw.zkey", circom_prover::witness::WitnessFn::RustWitness(witness::withdraw_witness)),
}

#[cfg(test)]
mod circom_tests {
    use crate::circom::{generate_circom_proof, verify_circom_proof, ProofLib};

    const ZKEY_PATH: &str = "./test-vectors/circom/multiplier2_final.zkey";

    /// Proves each eERC circuit from a JSON input file in $EERC_ARTIFACTS.
    /// Every scalar MUST be a single-element array — the Rust witness stack
    /// silently zeroes bare scalars and emits a proof that fails verification.
    #[test]
    fn eerc_prove() {
        let dir = std::env::var("EERC_ARTIFACTS").expect("set EERC_ARTIFACTS");
        let name = std::env::var("EERC_CIRCUIT").unwrap_or_else(|_| "transfer".to_string());
        let zkey = format!("{}/{}.zkey", dir, name);
        let inputs = std::fs::read_to_string(format!("{}/{}_input.json", dir, name))
            .expect("input json missing");

        let t = std::time::Instant::now();
        let p = generate_circom_proof(zkey.clone(), inputs, ProofLib::Arkworks).expect("prove failed");
        let ms = t.elapsed().as_millis();
        assert!(
            verify_circom_proof(zkey, p.clone(), ProofLib::Arkworks).is_ok(),
            "verification failed"
        );

        let dump = format!(
            "{{\"a\":{{\"x\":\"{}\",\"y\":\"{}\"}},\
              \"b\":{{\"x\":[\"{}\",\"{}\"],\"y\":[\"{}\",\"{}\"]}},\
              \"c\":{{\"x\":\"{}\",\"y\":\"{}\"}},\"inputs\":[{}],\"ms\":{}}}",
            p.proof.a.x, p.proof.a.y,
            p.proof.b.x[0], p.proof.b.x[1], p.proof.b.y[0], p.proof.b.y[1],
            p.proof.c.x, p.proof.c.y,
            p.inputs.iter().map(|s| format!("\"{}\"", s)).collect::<Vec<_>>().join(","),
            ms,
        );
        std::fs::write(format!("{}/{}_proof.json", dir, name), dump).expect("write proof");
        println!("{} proved+verified in {}ms ({} public signals)", name, ms, p.inputs.len());
    }

    #[test]
    fn test_multiplier2() {
        let circuit_inputs = "{\"a\": 2, \"b\": 3}".to_string();
        let result =
            generate_circom_proof(ZKEY_PATH.to_string(), circuit_inputs, ProofLib::Arkworks);
        assert!(result.is_ok());
        let proof = result.unwrap();
        assert!(verify_circom_proof(ZKEY_PATH.to_string(), proof, ProofLib::Arkworks).is_ok());
    }
}


// HALO2_TEMPLATE
halo2_stub!();

// NOIR_TEMPLATE
noir_stub!();

// GNARK_TEMPLATE
gnark_stub!();
