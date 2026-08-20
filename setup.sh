#!/usr/bin/env bash
# Fetches upstream circuit artefacts and builds the native prover.
# Binaries and proving keys are NOT committed (they are ~250MB and regenerable).
set -euo pipefail
cd "$(dirname "$0")"

echo "==> cloning upstream EncryptedERC (circuits + proving keys)"
[ -d vendor/eerc ] || git clone --depth 1 https://github.com/ava-labs/EncryptedERC.git vendor/eerc

B=vendor/eerc/circom/build
echo "==> staging proving keys"
mkdir -p prover/test-vectors/circom prover/react-native/assets/keys
for pair in "transfer/transfer:transfer" "registration/circuit_final:registration" "withdraw/circuit_final:withdraw"; do
  src="${pair%%:*}"; name="${pair##*:}"
  cp "$B/${src}.zkey" "prover/test-vectors/circom/${name}.zkey"
  cp "$B/${src}.zkey" "prover/react-native/assets/keys/${name}.zkey"
done
cp $B/transfer/transfer.wasm      prover/test-vectors/circom/
cp $B/registration/registration.wasm prover/test-vectors/circom/
cp $B/withdraw/withdraw.wasm      prover/test-vectors/circom/

echo "==> building native prover (rust, stable toolchain)"
( cd prover && cargo +stable build --release --lib )

echo "==> building iOS simulator lib + swapping into the xcframework"
( cd prover && cargo +stable build --release --target aarch64-apple-ios-sim --lib \
  && cp target/aarch64-apple-ios-sim/release/libprover.a \
       react-native/MoproReactNativeBindings/MoproFfiFramework.xcframework/ios-arm64-simulator/ )

echo "==> installing app deps"
( cd prover/react-native && npm install )

echo
echo "done. next:"
echo "  cd prover/react-native && npx react-native-asset && (cd ios && pod install)"
echo "  npm start        # then build from Xcode, or:"
echo "  xcodebuild -workspace ios/*.xcworkspace -scheme MyTestLibraryExample \\"
echo "    -configuration Debug -sdk iphonesimulator -derivedDataPath build/dd build"
