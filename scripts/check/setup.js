// ---------------------------------------------------------------------------
// Harnais de vérification — prépare l'exécution du VRAI code du projet sous
// Node (sans Metro, sans appareil) :
//
//   1. compile src/ (ESM + JSX) en CommonJS dans un dossier temporaire ;
//   2. installe des stubs pour les modules natifs (react-native, AsyncStorage,
//      expo-image-picker, @expo/vector-icons, react-native-qrcode-svg,
//      react-native-safe-area-context, expo-linear-gradient) ;
//   3. détourne la résolution des assets image.
//
// Les stubs sont placés dans <tmp>/node_modules : la résolution Node les trouve
// AVANT les vrais paquets du projet, sans rien écrire dans le dépôt.
// ---------------------------------------------------------------------------
const babel = require('@babel/core');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..', '..');
const BASE = fs.mkdtempSync(path.join(os.tmpdir(), 'travex-check-'));
const OUT = path.join(BASE, 'build');
const NM = path.join(BASE, 'node_modules');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.js')) acc.push(p);
  }
  return acc;
}

// 1. Compilation ESM + JSX → CommonJS
const files = walk(path.join(ROOT, 'src'));
for (const src of files) {
  const rel = path.relative(ROOT, src);
  const out = babel.transformSync(fs.readFileSync(src, 'utf8'), {
    filename: src,
    babelrc: false,
    configFile: false,
    plugins: [
      require.resolve('@babel/plugin-transform-modules-commonjs'),
      require.resolve('@babel/plugin-transform-react-jsx'),
    ],
  }).code;
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
}

// 2. Stubs natifs
function stub(pkg, body) {
  const dir = path.join(NM, pkg);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: pkg, version: '0.0.0-stub', main: 'index.js' }));
  fs.writeFileSync(path.join(dir, 'index.js'), body);
}

function stubFile(pkg, rel, body) {
  const dir = path.join(NM, pkg);
  fs.mkdirSync(dir, { recursive: true });
  const pj = path.join(dir, 'package.json');
  if (!fs.existsSync(pj)) fs.writeFileSync(pj, JSON.stringify({ name: pkg, version: '0.0.0-stub', main: 'index.js' }));
  fs.writeFileSync(path.join(dir, rel), body);
}

const h = `const React = require('react');\nconst h = (n) => { const C = React.forwardRef((p, r) => React.createElement(n, { ...p, ref: r }, p && p.children)); C.displayName = n; return C; };\n`;

stub('react-native', `
${h}
const alerts = [];
class Value {
  constructor(v) { this._v = v; }
  setValue(v) { this._v = v; }
  interpolate() { return new Value(0); }
  addListener() { return 'l'; }
  removeListener() {}
  removeAllListeners() {}
  stopAnimation(cb) { cb && cb(this._v); }
}
const done = { start: (cb) => cb && cb({ finished: true }) };
const Animated = {
  View: h('RCTAnimatedView'), Text: h('RCTAnimatedText'), Value,
  timing: () => done, spring: () => done, decay: () => done,
  parallel: () => done, sequence: () => done, createAnimatedComponent: (c) => c,
};
const Modal = (p) => (p.visible ? React.createElement('RCTModal', p, p.children) : null);
const FlatList = (p) => React.createElement('RCTFlatList', p,
  (p.data || []).map((item, i) => React.createElement('RCTCell',
    { key: p.keyExtractor ? p.keyExtractor(item, i) : i },
    p.renderItem ? p.renderItem({ item, index: i }) : null)));
module.exports = {
  __esModule: true, __alerts: alerts,
  View: h('RCTView'), Text: h('RCTText'), Image: h('RCTImage'),
  ScrollView: h('RCTScrollView'), TextInput: h('RCTTextInput'),
  TouchableOpacity: h('RCTTouchableOpacity'), Pressable: h('RCTPressable'),
  ActivityIndicator: h('RCTActivityIndicator'), KeyboardAvoidingView: h('RCTKAV'),
  RefreshControl: h('RCTRefreshControl'), Modal, FlatList, Animated,
  StyleSheet: {
    create: (s) => s,
    flatten: (s) => (Array.isArray(s) ? Object.assign({}, ...s.filter(Boolean)) : s || {}),
    absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    hairlineWidth: 1,
  },
  Platform: { OS: 'ios', select: (o) => (o && (o.ios !== undefined ? o.ios : o.default)), Version: 17 },
  Dimensions: { get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }), addEventListener: () => ({ remove() {} }) },
  Alert: { alert: (title, msg) => { alerts.push({ title, msg }); } },
  Share: { share: async () => ({ action: 'sharedAction' }) },
  Linking: { openURL: async () => {}, canOpenURL: async () => true },
  Appearance: { getColorScheme: () => 'light', addChangeListener: () => ({ remove() {} }) },
  PanResponder: { create: () => ({ panHandlers: {} }) },
  PixelRatio: { get: () => 3, roundToNearestPixel: (n) => n },
  useColorScheme: () => 'light', I18nManager: { isRTL: false },
  NativeModules: {}, UIManager: {}, findNodeHandle: () => null,
};
`);

stub('react-native-safe-area-context', `
const React = require('react');
const insets = { top: 0, bottom: 0, left: 0, right: 0 };
const SafeAreaView = React.forwardRef((p, r) => React.createElement('SafeAreaView', { ...p, ref: r }, p.children));
module.exports = {
  __esModule: true, SafeAreaView, SafeAreaProvider: (p) => p.children,
  useSafeAreaInsets: () => insets,
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  SafeAreaInsetsContext: React.createContext(insets),
  initialWindowMetrics: { insets, frame: { x: 0, y: 0, width: 390, height: 844 } },
};
`);

stub('@react-native-async-storage/async-storage', `
const store = new Map();
const impl = {
  getItem: async (k) => (store.has(k) ? store.get(k) : null),
  setItem: async (k, v) => { store.set(k, String(v)); },
  removeItem: async (k) => { store.delete(k); },
  clear: async () => { store.clear(); },
  getAllKeys: async () => Array.from(store.keys()),
};
module.exports = { __esModule: true, __store: store, default: impl };
`);

stub('@expo/vector-icons', `
const React = require('react');
const Ionicons = (p) => React.createElement('Ionicon', { name: p.name, size: p.size, color: p.color });
module.exports = { __esModule: true, Ionicons, default: { Ionicons } };
`);

stub('react-native-qrcode-svg', `
const React = require('react');
module.exports = { __esModule: true, default: (p) => React.createElement('QRCode', { value: p.value }) };
`);

stub('expo-linear-gradient', `
const React = require('react');
module.exports = { __esModule: true, LinearGradient: (p) => React.createElement('LinearGradient', p, p.children) };
`);

stub('expo-image-picker', `
let result = { canceled: true, assets: [] };
const calls = [];
module.exports = {
  __esModule: true,
  MediaTypeOptions: { Images: 'Images' },
  __calls: calls,
  __setResult: (r) => { result = r; },
  requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
  requestCameraPermissionsAsync: async () => ({ granted: true }),
  launchImageLibraryAsync: async (opts) => { calls.push(opts); return result; },
  launchCameraAsync: async (opts) => { calls.push(opts); return result; },
};
`);

// expo-file-system (API legacy) : écriture base64 + téléchargement, mémorisés
// pour que les tests puissent vérifier CE QUI est réellement écrit sur disque.
const fsStub = `
const writes = [];
module.exports = {
  __esModule: true,
  __writes: writes,
  cacheDirectory: 'file:///data/user/0/cm.travex/cache/',
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
  writeAsStringAsync: async (uri, contents, options) => { writes.push({ uri, contents, options }); },
  downloadAsync: async (uri, dest) => ({ uri: dest }),
};
`;
stub('expo-file-system', fsStub);
stubFile('expo-file-system', 'legacy.js', fsStub);

// expo-sharing : mémorise ce que l'app propose réellement au partage système.
stub('expo-sharing', `
const shared = [];
module.exports = {
  __esModule: true,
  __shared: shared,
  isAvailableAsync: async () => true,
  shareAsync: async (url, options) => { shared.push({ url, options }); },
};
`);

// 3. Assets image → stub
const assetStub = path.join(BASE, 'asset-stub.js');
fs.writeFileSync(assetStub, 'module.exports = 1;');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (/\.(jpg|jpeg|png|gif|webp|ttf)$/.test(request)) return assetStub;
  return origResolve.call(this, request, ...rest);
};

// React doit être partagé entre le code compilé et le test : on lie le paquet
// réel du projet (même instance ⇒ mêmes hooks, même react-test-renderer).
try {
  fs.symlinkSync(path.join(ROOT, 'node_modules', 'react'), path.join(NM, 'react'), 'dir');
} catch (e) { /* déjà présent */ }

module.exports = { BASE, SRC: path.join(OUT, 'src'), compiled: files.length };
