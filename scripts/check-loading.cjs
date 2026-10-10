// Run: node scripts/check-loading.cjs. No browser/GPU simulation or extra packages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, replacements = {}, extra = '') {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8') + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const context = { exports: {}, require: (name) => Object.hasOwn(replacements, name) ? replacements[name] : require(name) };
  vm.runInNewContext(output, context, { filename: file });
  return context.exports;
}

const cssModule = { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
const { StadiumLoadingArt } = load('src/components/ui/StadiumLoadingArt.tsx', {
  './StadiumLoadingArt.module.css': cssModule,
});
const loaderModules = { './LoadingScreen.module.css': cssModule, './StadiumLoadingArt': { StadiumLoadingArt } };
const { LoadingScreen } = load('src/components/ui/LoadingScreen.tsx', loaderModules);
function markup(props) { return renderToStaticMarkup(React.createElement(LoadingScreen, props)); }
for (const [progress, expected] of [[0, 0], [47.25, 47.25], [95, 95], [100, 100], [-5, 0], [150, 100]]) {
  const html = markup({ label: 'Narendra Modi Stadium', phase: 'loading', progress });
  assert.ok(html.includes(`aria-valuenow="${expected}"`));
  assert.ok(html.includes(`width:${expected}%`), 'The visual progress must match the actual value');
  assert.ok(html.includes('Loading stadium resources'));
  assert.equal((html.match(/role="status"/g) || []).length, 1);
  const status = html.match(/<p[^>]*role="status"[^>]*>(.*?)<\/p>/)[1];
  assert.ok(!status.includes('%'), 'Live status must not announce every progress tick');
}
for (const phase of ['opening', 'loading', 'preparing']) {
  for (const progress of [undefined, NaN, Infinity, -Infinity]) {
    const html = markup({ phase, progress });
    assert.ok(!html.includes('aria-valuenow'));
    assert.ok(!/NaN|Infinity|undefined/.test(html));
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-hidden="true"'));
  }
}
for (const phase of ['opening', 'preparing']) {
  assert.ok(!markup({ phase, progress: 95 }).includes('aria-valuenow'), 'Do not show stale progress while opening/preparing');
}
assert.ok(markup({ label: 'Ground <one>' }).includes('Ground &lt;one&gt;'));
assert.ok(!markup({}).includes('<img'), 'The loader must not make its own asset requests');
const css = fs.readFileSync(path.join(root, 'src/components/ui/LoadingScreen.module.css'), 'utf8');
const artCss = fs.readFileSync(path.join(root, 'src/components/ui/StadiumLoadingArt.module.css'), 'utf8');
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none\s*!important/);
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*transition:\s*none\s*!important/);
assert.match(css, /@container stadium-loader \(max-height: 420px\)/);
assert.match(css, /@container stadium-loader \(max-width: 380px\)/);
assert.match(css, /@container stadium-loader \(max-height: 300px\)/);
assert.match(artCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none\s*!important/);
assert.match(artCss, /\.foundation,\s*\.tiers,\s*\.roof\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/,
  'Reduced-motion users must get the complete stadium, not an invisible assembly frame');
for (const animation of ['assemble-foundation', 'assemble-tiers', 'assemble-roof', 'stadium-float', 'seat-light-wave', 'trace-roof', 'field-sweep']) {
  assert.match(artCss, new RegExp(`@keyframes ${animation}\\s*\\{`), `Missing stadium motion: ${animation}`);
}
assert.match(css, /@keyframes progress-sweep/);
const twoLoaders = renderToStaticMarkup(React.createElement(React.Fragment, null,
  React.createElement(LoadingScreen, { label: 'First', phase: 'opening' }),
  React.createElement(LoadingScreen, { label: 'Second', phase: 'preparing' })));
const svgIds = [...twoLoaders.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.ok(svgIds.length >= 10, 'Both illustrations must include their gradient/clip resources');
assert.equal(new Set(svgIds).size, svgIds.length, 'SVG IDs must be unique across simultaneous loaders');
for (const match of twoLoaders.matchAll(/url\(#([^\)]+)\)|href="#([^"]+)"/g)) {
  assert.ok(svgIds.includes(match[1] ?? match[2]), 'SVG references must resolve to this document');
}
assert.doesNotMatch(twoLoaders, /<(?:img|image|canvas|video|iframe)\b|(?:src|href)="https?:/,
  'The loader must remain self-contained and must not create another renderer or asset request');
assert.ok((twoLoaders.match(/data-loader-art="stadium"/g) ?? []).length === 2);
console.log('PASS: truthful progress, stadium assembly/light motion, collision-free SVG resources, responsive and reduced-motion rules');

const progressBar = (tree) => elements(tree, (node) => node.props.role === 'progressbar')[0];
let loadingTree = LoadingScreen({ phase: 'opening', progress: 80 });
assert.equal(progressBar(loadingTree).props['aria-valuenow'], undefined);
assert.equal(elements(loadingTree, (node) => node.type === 'button').length, 0);
assert.doesNotMatch(renderToStaticMarkup(loadingTree), /Pause animation|Resume animation|Once ready, drag to rotate/);
loadingTree = LoadingScreen({ phase: 'loading', progress: 63.5 });
assert.equal(progressBar(loadingTree).props['aria-valuenow'], 63.5);
loadingTree = LoadingScreen({ phase: 'loading', progress: 100 });
assert.equal(progressBar(loadingTree).props['aria-valuenow'], 100);
loadingTree = LoadingScreen({ phase: 'preparing', progress: 100 });
assert.equal(progressBar(loadingTree).props['aria-valuenow'], undefined);
assert.equal(elements(loadingTree, (node) => node.type === StadiumLoadingArt)[0].props.phase, 'preparing');
assert.equal(elements(loadingTree, (node) => node.type === 'button').length, 0);
console.log('PASS: real opening/loading/preparing status states without extra loader controls');

// Inspect the real viewer's component tree using controlled hook state.
// This checks readiness policy; it deliberately does not pretend to run WebGL.
let cursor = 0;
const state = [];
let progressState = { active: false, loaded: 0, total: 0, progress: 0 };
const hooks = { ...React,
  useState(initial) {
    const index = cursor++;
    if (index === state.length) state.push(typeof initial === 'function' ? initial() : initial);
    return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  },
  useRef: () => ({ current: null }), useEffect: () => {}, useCallback: (callback) => callback,
};
const Canvas = () => null;
const OrbitControls = () => null;
const StadiumScene = () => null;
const SeatSelector = () => null;
const Compass = () => null;
const noop = () => null;
const cameraHelpers = load('src/lib/camera.ts');
const viewer = load('src/components/3d/StadiumViewer.tsx', {
  react: hooks,
  '@react-three/fiber': { Canvas },
  '@react-three/drei': { PerspectiveCamera: noop, OrbitControls, useProgress: () => progressState },
  './StadiumScene': { StadiumScene },
  './CameraController': { CameraController: noop },
  './ViewerControls': { ViewerControls: noop },
  './SelectionPanel': { SelectionPanel: noop },
  './LayerPanel': { LayerPanel: noop },
  './SeatSelector': { SeatSelector },
  '@/lib/camera': cameraHelpers,
  '../ui/Compass': { Compass },
  '../ui/LoadingScreen': { LoadingScreen },
  '../ui/ViewerErrorBoundary': { ViewerErrorBoundary: noop },
}, '\nexport { StadiumViewerInner, StadiumLoadingOverlay };');

function elements(node, match) {
  const found = [];
  function visit(child) {
    if (!React.isValidElement(child)) return;
    if (match(child)) found.push(child);
    React.Children.forEach(child.props.children, visit);
  }
  visit(node);
  return found;
}
function view() {
  cursor = 0;
  return viewer.StadiumViewerInner({ stadium: { id: 'narendra-modi-stadium', name: 'Narendra Modi Stadium', city: 'Ahmedabad', state: 'Gujarat' } });
}

function checkRail(tree) {
  const rail = elements(tree, (node) => node.props['data-viewer-rail'])[0];
  assert.ok(rail, 'Header and selector must have a shared left rail');
  const children = React.Children.toArray(rail.props.children);
  assert.equal(children.length, 2);
  assert.ok(children[0].props['data-viewer-header']);
  assert.ok(children[1].props['data-viewer-panels']);
  for (const child of children) {
    assert.ok(child.props.className.split(' ').includes('w-full'), 'Header and panels must align to the same width');
    assert.doesNotMatch(child.props.className, /(?:^|\s)(?:\w+:)?(?:absolute|top-\S+|bottom-\S+)(?:\s|$)/,
      'Growing header content must push panels down in flow, not overlap them');
  }
  for (const token of ['flex', 'flex-col', 'gap-3', 'min-h-0', 'md:top-6', 'md:bottom-24', 'md:overflow-y-auto']) {
    assert.ok(rail.props.className.split(' ').includes(token), `Rail needs ${token}`);
  }
  assert.ok(children[1].props.className.includes('hidden') && children[1].props.className.includes('md:flex'),
    'Mobile must retain its separate drawers instead of the desktop stack');
}

for (const [manager, phase, progress] of [
  [{ active: false, loaded: 0, total: 0, progress: 0 }, 'opening', undefined],
  [{ active: true, loaded: 19, total: 20, progress: 95 }, 'loading', 95],
  [{ active: true, loaded: 20, total: 20, progress: 100 }, 'preparing', undefined],
  [{ active: false, loaded: 20, total: 20, progress: 100 }, 'preparing', undefined],
]) {
  progressState = manager;
  const overlay = viewer.StadiumLoadingOverlay({ label: 'Narendra Modi Stadium' });
  const content = elements(overlay, (node) => node.type === LoadingScreen)[0];
  assert.equal(content.props.phase, phase);
  assert.equal(content.props.progress, progress);
  assert.equal(content.props.label, 'Narendra Modi Stadium');
}

let tree = view();
const isOverlay = (node) => node.type === viewer.StadiumLoadingOverlay;
const isControls = (node) => node.props.className === 'pointer-events-none absolute inset-0 z-10';
assert.equal(elements(tree, isOverlay).length, 1, 'Loader must remain while parsed model is not ready, even at 100%');
assert.equal(elements(tree, (node) => node.props.role === 'region')[0].props['aria-busy'], true);
assert.equal(elements(tree, isControls)[0].props.hidden, true);
assert.equal(elements(tree, (node) => node.type === OrbitControls)[0].props.enabled, false);
const directionalLight = elements(tree, (node) => node.type === 'directionalLight')[0];
assert.deepEqual(Array.from(directionalLight.props['shadow-mapSize']), [1024, 1024], 'Static shadows should use the fast shadow-map tier');
const canvas = elements(tree, (node) => node.type === Canvas)[0];
assert.equal(elements(canvas, isOverlay).length, 0, 'Loading UI must be outside WebGL/camera space');
const model = elements(tree, (node) => node.type === StadiumScene)[0];
model.props.onBoundsChange({ center: [0, 1, 0], radius: 100, height: 50 });
progressState = { active: true, loaded: 1, total: 20, progress: 5 };
tree = view();
assert.equal(elements(tree, isOverlay).length, 1, 'Real readiness must still respect the five-second minimum loader window');
assert.equal(elements(tree, isControls)[0].props.hidden, true);
assert.equal(elements(tree, (node) => node.type === OrbitControls)[0].props.enabled, false);
const loadingOverlay = elements(tree, isOverlay)[0];
assert.equal(typeof loadingOverlay.props.onMinimumElapsed, 'function');
loadingOverlay.props.onMinimumElapsed();
tree = view();
assert.equal(elements(tree, isOverlay).length, 0, 'Loader should dismiss once the model is ready and the minimum window completes');
assert.equal(elements(tree, isControls)[0].props.hidden, false);
assert.equal(elements(tree, (node) => node.type === OrbitControls)[0].props.enabled, true);
assert.equal(elements(tree, (node) => node.props.role === 'region')[0].props['aria-busy'], false);
checkRail(tree);
console.log('PASS: resource-based phases, readiness-gated dismissal, external DOM overlay, hidden controls and disabled orbit while loading');

const seat = { id: 'model-seat-70,4,0', standId: 'model-a-lower', standName: 'Pavilion A · Lower tier',
  blockId: 'lower', blockName: 'Lower tier', row: 1, seat: 1, isDemo: true,
  position: [70, 4, 0], eyePosition: [70, 5.15, 0], target: [0, 0.1, 0] };
model.props.onSeatMapChange({ numbering: 'model', seatCount: 1,
  pavilions: [{ id: seat.standId, name: seat.standName, tier: 'lower', rows: [{ number: 1, seats: [seat] }] }] });
tree = view();
let selector = elements(tree, (node) => node.type === SeatSelector)[0];
selector.props.onSelect({ ...seat, id: 'invalid-seat' });
tree = view();
assert.equal(elements(tree, (node) => node.type === SeatSelector)[0].props.seatMode, false);
selector.props.onSelect({ ...seat, eyePosition: [NaN, 0, 0] });
tree = view();
selector = elements(tree, (node) => node.type === SeatSelector)[0];
assert.equal(selector.props.selectedSeat, seat, 'Resolve against the actual seat map, never trust caller coordinates');
assert.equal(selector.props.seatMode, true);
assert.equal(elements(tree, (node) => node.type === OrbitControls)[0].props.enabled, false);
const cameraNode = elements(tree, (node) => node.props.preset === 'seat')[0];
assert.equal(cameraNode.props.seat, seat);
assert.equal(elements(tree, (node) => node.type === StadiumScene)[0].props.layers.seats, true);
cameraNode.props.onAzimuthChange(0.75);
tree = view();
assert.equal(elements(tree, (node) => node.type === Compass)[0].props.azimuth, 0.75, 'Look-around must update the compass');
checkRail(tree);
const seatHeader = elements(tree, (node) => node.props['data-viewer-header'])[0];
assert.match(renderToStaticMarkup(seatHeader), /Model seat view/);
assert.match(renderToStaticMarkup(seatHeader), /Row 1 · Seat 1/);
selector.props.onExit();
tree = view();
assert.equal(elements(tree, (node) => node.type === SeatSelector)[0].props.selectedSeat, null);
assert.equal(elements(tree, (node) => node.type === OrbitControls)[0].props.enabled, true);
const { LayerPanel } = load('src/components/3d/LayerPanel.tsx');
const layerPanel = LayerPanel({ layers: { stadium: true, seats: true }, onToggle() {} });
assert.doesNotMatch(layerPanel.props.className, /overflow-y-|max-h-/, 'Layers must not introduce a second desktop scrollbar');
console.log('PASS: canonical seat camera and compass wiring, in-flow header/sidebar, one desktop scrollbar and return to overview');

const { ViewerErrorBoundary } = load('src/components/ui/ViewerErrorBoundary.tsx');
const boundary = new ViewerErrorBoundary({ children: React.createElement(LoadingScreen), fallbackLink: '#info' });
boundary.state = ViewerErrorBoundary.getDerivedStateFromError(new Error('model test failure'));
const failure = renderToStaticMarkup(boundary.render());
assert.ok(failure.includes('role="alert"') && failure.includes('Reload viewer'));
assert.ok(!failure.includes('role="progressbar"'), 'A real failure must replace loading, not leave a spinner');
console.log('PASS: error fallback replaces loading with recovery controls');
