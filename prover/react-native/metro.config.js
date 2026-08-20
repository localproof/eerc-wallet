const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');

const root = path.resolve(__dirname, './MoproReactNativeBindings');
const sdk = path.join(__dirname, 'node_modules/@localproof/eerc-sdk');

const base = withMetroConfig(getDefaultConfig(__dirname), { root, dirname: __dirname });

// NOTE: must be applied AFTER withMetroConfig — it overwrites resolver settings.
for (const ext of ['zkey', 'bin', 'local', 'pk', 'vk', 'r1cs']) {
  if (!base.resolver.assetExts.includes(ext)) base.resolver.assetExts.push(ext);
}
// SDK is installed into node_modules now, so no watchFolder is needed.
// Metro resolves the symlinked SDK from its REAL path, so it must also be told
// to look in the app's node_modules for the SDK's own deps (incl. @babel/runtime).
base.resolver.nodeModulesPaths = [
  ...(base.resolver.nodeModulesPaths ?? []),
  path.join(__dirname, 'node_modules'),
  path.join(sdk, 'node_modules'),
];
base.resolver.extraNodeModules = {
  ...(base.resolver.extraNodeModules ?? {}),
  // '@eerc/sdk' now resolves via node_modules symlink (file:../../sdk)
  // the SDK's own deps resolve out of the app's node_modules
};

module.exports = base;
