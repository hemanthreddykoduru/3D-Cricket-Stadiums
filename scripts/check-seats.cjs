// Run: node scripts/check-seats.cjs. Real Three math; controlled React hooks, no GPU claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const THREE = require('three');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function load(file, overrides = {}, globals = {}) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  });
  const context = { ...globals, exports: {}, require: (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name) };
  vm.runInNewContext(outputText, context, { filename: file });
  return context.exports;
}
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
function harness() {
  const values = [];
  let cursor = 0, dirty = false, effects = [];
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const hooks = { ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], (update) => {
        const next = typeof update === 'function' ? update(values[index]) : update;
        if (!Object.is(next, values[index])) { values[index] = next; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return values[index] ??= { current: initial }; },
    useId() { const index = cursor++; return values[index] ??= `seat-test-${index}`; },
    useMemo(fn, deps) {
      const index = cursor++;
      if (!values[index] || changed(values[index].deps, deps)) values[index] = { deps, value: fn() };
      return values[index].value;
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!values[index] || changed(values[index].deps, deps)) {
        const previous = values[index];
        values[index] = { deps };
        effects.push(() => { previous?.cleanup?.(); values[index].cleanup = fn(); });
      }
    },
  };
  return { hooks, render(component, props) {
    let result;
    for (let attempt = 0; attempt < 12; attempt++) {
      cursor = 0; dirty = false; effects = [];
      result = component(props);
      effects.forEach((effect) => effect());
      if (!dirty) return result;
    }
    throw new Error('Component did not settle');
  }, unmount() {
    values.forEach((value) => value?.cleanup?.());
    values.length = 0;
  } };
}

const { buildSeatMap } = load('src/lib/seats.ts');
const cameraHelpers = load('src/lib/camera.ts');
const geometry = new THREE.BoxGeometry(0.45, 0.94, 0.6);
const polymer = new THREE.MeshStandardMaterial();
polymer.name = 'WEB34C_SEATS_POLYMER_ORANGE';
const positions = [[50, 1, 5], [51, 1, 5], [50, 2, 5], [50, 10, 5], [50, 11, 5], [-50, 1, -5]];
const mesh = new THREE.InstancedMesh(geometry, polymer, positions.length);
positions.forEach((p, i) => mesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(...p)));
const scene = new THREE.Group();
scene.add(mesh);
const hardware = mesh.clone();
hardware.material = new THREE.MeshStandardMaterial();
hardware.material.name = 'HF27_Galvanized';
scene.add(hardware, mesh.clone()); // Duplicate polymer origins must not invent more seats.
const invalid = new THREE.InstancedMesh(geometry, polymer, 2);
invalid.setMatrixAt(0, new THREE.Matrix4().makeScale(0, 0, 0));
const bad = new THREE.Matrix4(); bad.elements[12] = NaN;
invalid.setMatrixAt(1, bad);
scene.add(invalid);
const matricesBefore = Array.from(mesh.instanceMatrix.array);
const map = buildSeatMap(scene);
assert.equal(map.seatCount, positions.length);
assert.equal(map.numbering, 'model');
assert.equal(buildSeatMap(scene, [NaN, 0, 0]).seatCount, 0);
assert.equal(buildSeatMap(new THREE.Group()).seatCount, 0);
assert.deepEqual(Array.from(mesh.instanceMatrix.array), matricesBefore);
assert.equal(mesh.material, polymer);
const lower = map.pavilions.find((p) => p.id === 'model-pavilion-a-lower');
const upper = map.pavilions.find((p) => p.id === 'model-pavilion-a-upper');
assert.equal(lower.rows.length, 2);
assert.equal(upper.rows.length, 2);
const first = lower.rows[0].seats[0];
const second = upper.rows[1].seats[0];
const target = cameraHelpers.getSeatCameraTarget(first);
assert.deepEqual(Array.from(target.position), Array.from(first.eyePosition));
assert.equal(target.fov, 65);
assert.equal(target.duration, 0);
assert.equal(cameraHelpers.getSeatCameraTarget(null), null);
assert.equal(cameraHelpers.getSeatCameraTarget({ ...first, eyePosition: [NaN, 1, 0] }), null);
assert.equal(cameraHelpers.getSeatCameraTarget({ ...first, target: first.eyePosition }), null);
console.log('PASS: filtered/deduplicated instance mapping, real tier gap, exact seat camera data, invalid/empty cases');

const ui = harness();
const { SeatView } = load('src/components/3d/SeatView.tsx');
const { SeatSelector } = load('src/components/3d/SeatSelector.tsx', { react: ui.hooks, './SeatView': { SeatView } });
const chosen = [];
let exits = 0;
let props = { seatMap: map, selectedSeat: null, seatMode: false,
  onSelect: (seat) => chosen.push(seat), onExit: () => exits++ };
const render = () => ui.render(SeatSelector, props);
const selects = (tree) => elements(tree, (node) => node.type === 'select');
let tree = render();
assert.deepEqual(selects(tree).map((node) => node.props.disabled), [false, true, true]);
assert.ok(elements(tree, (node) => node.type === 'button')[0].props.disabled);
const labels = elements(tree, (node) => node.type === 'label');
assert.deepEqual(labels.map((node) => node.props.htmlFor), selects(tree).map((node) => node.props.id));
selects(tree)[0].props.onChange({ target: { value: lower.id } });
tree = render();
assert.deepEqual(selects(tree).map((node) => node.props.disabled), [false, false, true]);
selects(tree)[1].props.onChange({ target: { value: '1' } });
tree = render();
selects(tree)[2].props.onChange({ target: { value: first.id } });
assert.equal(chosen[0], first, 'Final native select must emit the actual map object automatically');
props = { ...props, selectedSeat: first, seatMode: true };
tree = render();
assert.equal(elements(tree, (node) => node.type === SeatView)[0].props.seat, first);
elements(tree, (node) => node.type === 'button')[0].props.onClick();
assert.equal(chosen[1], first, 'The same seat can be reopened/recentred');
selects(tree)[0].props.onChange({ target: { value: upper.id } });
assert.equal(exits, 1);
props = { ...props, selectedSeat: null, seatMode: false };
tree = render();
assert.equal(selects(tree)[0].props.value, upper.id);
assert.equal(selects(tree)[1].props.value, '');
assert.equal(selects(tree)[2].props.value, '');
selects(tree)[1].props.onChange({ target: { value: '2' } });
tree = render();
selects(tree)[2].props.onChange({ target: { value: second.id } });
assert.equal(chosen.at(-1), second);
tree = render();
const count = chosen.length;
selects(tree)[2].props.onChange({ target: { value: 'not-a-real-seat' } });
tree = render();
assert.equal(chosen.length, count);
assert.equal(elements(tree, (node) => node.type === 'button')[0].props.disabled, true);
props = { ...props, selectedSeat: first, seatMode: true };
tree = render();
assert.equal(selects(tree)[0].props.value, lower.id, 'External selections sync into both desktop/mobile menus');
props = { ...props, seatMap: { ...map, pavilions: [] } };
tree = render();
assert.deepEqual(selects(tree).map((node) => node.props.disabled), [true, true, true]);
assert.equal(elements(tree, (node) => node.type === 'button')[0].props.disabled, true);
assert.ok(renderToStaticMarkup(tree).includes('unavailable for this model'));
props = { ...props, seatMap: null, selectedSeat: null, seatMode: false };
tree = render();
assert.ok(renderToStaticMarkup(tree).includes('Reading seat positions'));
assert.ok(renderToStaticMarkup(tree).includes('not official ticket seats'));
console.log('PASS: pavilion → row → seat flow, automatic selection, repeat selection, reset/stale/empty states and accessible labels');

const controls = {
  target: new THREE.Vector3(),
  update: () => { throw new Error('Orbit damping must not change a seat-view camera'); },
  addEventListener() {}, removeEventListener() {},
};
// Event target only: this exercises native input handlers, not browser layout or WebGL.
const listeners = new Map();
const captured = new Set();
const attributes = new Map([['tabindex', '-1'], ['role', 'img'], ['aria-label', 'Stadium panorama']]);
const originalAttributes = new Map(attributes);
let focusCount = 0;
let invalidations = 0;
const invalidate = () => { invalidations++; };
const canvas = {
  style: { touchAction: 'pan-y', cursor: 'crosshair' },
  getAttribute: (name) => attributes.get(name) ?? null,
  setAttribute: (name, value) => attributes.set(name, value),
  removeAttribute: (name) => attributes.delete(name),
  addEventListener(name, listener) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(listener);
  },
  removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
  focus() { focusCount++; },
  setPointerCapture: (id) => captured.add(id),
  hasPointerCapture: (id) => captured.has(id),
  releasePointerCapture: (id) => captured.delete(id),
};
function input(type, fields = {}) {
  const event = { target: canvas, pointerId: 1, isPrimary: true, button: 0, buttons: 1,
    clientX: 100, clientY: 100, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; }, ...fields };
  [...(listeners.get(type) ?? [])].forEach((listener) => listener(event));
  return event;
}
const direction = () => camera.getWorldDirection(new THREE.Vector3());
const azimuths = [];
const camera = new THREE.PerspectiveCamera(45, 1.8, 0.1, 1000);
const cameraRunner = harness();
let frame;
let reducedMotion = false;
const settleCamera = () => { for (let i = 0; i < 40; i++) frame({}, 1 / 30); };
const { CameraController } = load('src/components/3d/CameraController.tsx', {
  react: cameraRunner.hooks,
  '@react-three/fiber': { useThree: () => ({ camera, controls, gl: { domElement: canvas }, invalidate }), useFrame: (fn) => { frame = fn; } },
  '@/lib/camera': cameraHelpers,
}, { window: { matchMedia: () => ({ matches: reducedMotion, addEventListener() {}, removeEventListener() {} }) } });
const bounds = { center: [0, 10, 0], radius: 100, height: 40, pitch: { center: [0, 0.1, 0], radius: 60, height: 0.1 } };
let cameraProps = { preset: 'seat', seat: first, seatMode: true, bounds, requestId: 1,
  onAzimuthChange: (value) => azimuths.push(value) };
cameraRunner.render(CameraController, cameraProps);
function atSeat(seat) {
  assert.deepEqual(camera.position.toArray(), Array.from(seat.eyePosition));
  const expectedDirection = new THREE.Vector3(...seat.target).sub(camera.position).normalize();
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).distanceTo(expectedDirection) < 1e-7);
  assert.equal(camera.fov, 65);
}
atSeat(first);
assert.ok(invalidations > 0, 'Initial seat snap must wake a demand-rendered canvas');
for (let i = 0; i < 10; i++) frame({}, 1 / 60);
atSeat(first);
assert.equal(camera.near, 0.05);
assert.equal(canvas.getAttribute('tabindex'), '0');
assert.match(canvas.getAttribute('aria-label'), /arrow keys/);
assert.equal(canvas.style.touchAction, 'none');
assert.equal(canvas.style.cursor, 'grab');
const initialDirection = direction();
input('pointermove', { clientX: 140 });
input('pointerdown', { button: 2 });
input('pointerdown', { isPrimary: false });
input('pointerdown', { defaultPrevented: true });
assert.equal(captured.size, 0, 'Only an unhandled primary drag may start seat-look');
assert.ok(direction().distanceTo(initialDirection) < 1e-7);
assert.equal(input('pointerdown').defaultPrevented, true);
assert.equal(focusCount, 1);
assert.ok(captured.has(1));
assert.equal(canvas.style.cursor, 'grabbing');
input('pointermove', { pointerId: 2, clientX: 150 });
assert.ok(direction().distanceTo(initialDirection) < 1e-7, 'Another pointer cannot steal a drag');
input('pointermove', { clientX: 140, clientY: 60 });
const dragged = direction();
assert.ok(dragged.distanceTo(initialDirection) > 0.1, 'Dragging must actually turn the seat camera');
assert.ok(dragged.y > initialDirection.y, 'Dragging up must look up');
assert.ok(new THREE.Vector3().crossVectors(initialDirection, dragged).y < 0, 'Dragging right must look right');
assert.deepEqual(camera.position.toArray(), Array.from(first.eyePosition), 'Look-around must never orbit away from the seat');
assert.equal(camera.fov, 65);
assert.ok(controls.target.clone().sub(camera.position).normalize().distanceTo(dragged) < 1e-7);
assert.ok(Math.abs(azimuths.at(-1) - Math.atan2(dragged.x, dragged.z)) < 1e-7);
assert.ok(invalidations > 1, 'Direct seat-look input must wake a demand-rendered canvas');
frame({}, 1 / 60);
assert.ok(direction().distanceTo(dragged) < 1e-7, 'A frame must not snap manual look back at the pitch');
input('pointerup');
assert.equal(captured.size, 0);
assert.equal(canvas.style.cursor, 'grab');

// Parent compass updates may replace a callback, but must not reset orientation.
const nextAzimuths = [];
cameraProps = { ...cameraProps, onAzimuthChange: (value) => nextAzimuths.push(value) };
cameraRunner.render(CameraController, cameraProps);
assert.ok(direction().distanceTo(dragged) < 1e-7);
assert.equal(input('keydown', { key: 'ArrowRight' }).defaultPrevented, true);
assert.ok(direction().distanceTo(dragged) > 0.04);
assert.ok(nextAzimuths.length > 0);
const beforeUp = direction();
input('keydown', { key: 'ArrowUp' });
assert.ok(direction().y > beforeUp.y);
const keyboardDirection = direction();
for (const fields of [
  { key: 'ArrowLeft', target: { tagName: 'SELECT' } },
  { key: 'ArrowLeft', altKey: true }, { key: 'ArrowLeft', ctrlKey: true },
  { key: 'ArrowLeft', metaKey: true }, { key: 'Enter' },
]) assert.equal(input('keydown', fields).defaultPrevented, false);
input('wheel', { deltaY: -100 });
assert.ok(direction().distanceTo(keyboardDirection) < 1e-7, 'Unrelated UI keys and scrolling must not turn the camera');
assert.deepEqual(camera.position.toArray(), Array.from(first.eyePosition));
assert.equal(camera.fov, 65, 'Seat mode must not zoom');

input('pointerdown', { pointerType: 'touch' });
input('pointermove', { pointerType: 'touch', clientY: -100000 });
assert.ok(direction().y > 0.99 && direction().y < 1, 'Upward look must stop short of the pole');
input('pointermove', { pointerType: 'touch', clientY: 100000 });
assert.ok(direction().y < -0.99 && direction().y > -1, 'Downward look must not flip');
input('pointercancel');
for (const endEvent of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) {
  input('pointerdown');
  if (endEvent === 'lostpointercapture') captured.delete(1);
  input(endEvent);
  const endedDirection = direction();
  input('pointermove', { clientX: 300 });
  assert.equal(captured.size, 0);
  assert.ok(direction().distanceTo(endedDirection) < 1e-7, `${endEvent} must end the drag`);
}
input('pointerdown');
input('pointermove', { buttons: 0, clientX: 300 });
assert.equal(captured.size, 0, 'Releasing outside the canvas must not leave a stuck drag');

input('pointerdown');
cameraProps = { ...cameraProps, seat: second, requestId: 2 };
cameraRunner.render(CameraController, cameraProps);
atSeat(second);
assert.equal(captured.size, 0, 'Changing seats releases an old drag');
input('pointermove', { clientX: 300 });
atSeat(second);
input('pointerdown');
input('pointermove', { clientX: 200 });
camera.position.x += 2;
cameraProps = { ...cameraProps, requestId: 3 };
cameraRunner.render(CameraController, cameraProps);
atSeat(second);
assert.equal(captured.size, 0, 'Reselecting a seat cancels drag and resets direction');
for (const set of listeners.values()) assert.equal(set.size, 1, 'Reselection must not duplicate event listeners');
let orbitUpdates = 0;
controls.update = () => { orbitUpdates++; };
input('pointerdown');
cameraRunner.render(CameraController, { ...cameraProps, preset: 'overview', seat: null, seatMode: false, requestId: 4 });
settleCamera();
assert.equal(camera.fov, 45);
assert.ok(camera.position.distanceTo(new THREE.Vector3(...second.eyePosition)) > 100);
assert.ok(orbitUpdates > 0);
assert.equal(captured.size, 0);
assert.deepEqual(attributes, originalAttributes, 'Exiting restores original canvas accessibility attributes');
assert.deepEqual(canvas.style, { touchAction: 'pan-y', cursor: 'crosshair' });
for (const set of listeners.values()) assert.equal(set.size, 0, 'Seat handlers must be removed outside seat mode');
cameraRunner.render(CameraController, { ...cameraProps, preset: 'pitch', seat: null, seatMode: false, requestId: 5 });
settleCamera();
const wholeFieldDistance = camera.position.distanceTo(controls.target);
const wicket = { center: [0, 0.385, 0], radius: 12.5, height: 0.73 };
cameraRunner.render(CameraController, { ...cameraProps, preset: 'pitch', seat: null, seatMode: false,
  bounds: { ...bounds, wicket }, requestId: 6 });
settleCamera();
assert.ok(camera.position.distanceTo(controls.target) < wholeFieldDistance / 3, 'Pitch view must frame the wicket detail, not the entire field');
assert.deepEqual(controls.target.toArray(), wicket.center);
camera.updateMatrixWorld(true);
for (const x of [-6.5, 6.5]) for (const z of [-12.5, 12.5]) {
  const projected = new THREE.Vector3(x, 0.02, z).project(camera);
  assert.ok(Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1, 'The prepared square must fit in the close pitch view');
}
console.log('PASS: pitch preset uses close wicket bounds, frames the square and retains legacy fallback');
const stadiumBounds = { center: [26, 31.85000228881836, -25.33025360107422],
  radius: 151.66974639892578, height: 65.70000457763672,
  pitch: { center: [0, 0.375, 0], radius: 64, height: 1.05 }, wicket };
cameraRunner.render(CameraController, { ...cameraProps, preset: 'top', seat: null, seatMode: false,
  bounds: stadiumBounds, requestId: 7 });
settleCamera();
camera.updateMatrixWorld(true);
const depth = (height) => (new THREE.Vector3(0, height, 0).project(camera).z + 1) / 2;
const depthSteps = (a, b) => Math.abs(depth(a) - depth(b)) * (2 ** 24 - 1);
assert.ok(depthSteps(0.014, 0.02) > 8, 'Top view needs enough depth precision for millimetre field detail');
assert.ok(depthSteps(0.031, 0.032) > 2, 'Top view must distinguish the crease from the prepared strip');
for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
  const point = new THREE.Vector3(stadiumBounds.center[0] + sx * stadiumBounds.radius,
    stadiumBounds.center[1] + sy * stadiumBounds.height / 2, stadiumBounds.center[2] + sz * stadiumBounds.radius);
  const projected = point.project(camera);
  assert.ok(projected.z > -1 && projected.z < 1, 'Adaptive clipping must retain all stadium depth bounds');
}
cameraRunner.render(CameraController, { ...cameraProps, preset: 'pitch', seat: null, seatMode: false,
  bounds: stadiumBounds, requestId: 8 });
settleCamera();
assert.ok(camera.near <= 0.1, 'The near plane must return to close-up range on the same transition frame');
console.log('PASS: stadium-scale depth precision without clipping the model, and immediate close-up recovery');
cameraRunner.unmount();
reducedMotion = true;
cameraRunner.render(CameraController, { ...cameraProps, seat: first, requestId: 5 });
atSeat(first);
input('pointerdown');
input('pointermove', { clientX: 200 });
assert.ok(direction().distanceTo(initialDirection) > 0.1, 'Reduced motion must still allow direct look-around');
assert.deepEqual(camera.position.toArray(), Array.from(first.eyePosition));
cameraRunner.unmount();
assert.equal(captured.size, 0);
assert.deepEqual(attributes, originalAttributes);
assert.deepEqual(canvas.style, { touchAction: 'pan-y', cursor: 'crosshair' });
for (const set of listeners.values()) assert.equal(set.size, 0, 'Unmount must remove all seat-look listeners');
console.log('PASS: anchored mouse/touch/keyboard look-around, pitch limits, compass updates, cancellation, recenter, reduced motion and cleanup');

const mobileRunner = harness();
const { SelectionPanel } = load('src/components/3d/SelectionPanel.tsx', {
  react: mobileRunner.hooks, './LayerPanel': { LayerPanel: () => null },
});
let mobileProps = { layers: {}, onToggleLayer() {}, cameraControls: React.createElement('div', null, 'Cameras'),
  seatControls: React.createElement('div', null, 'Seat options'), seatMode: false, seatRequestId: 0 };
const mobile = () => mobileRunner.render(SelectionPanel, mobileProps);
const seatButton = (tree) => elements(tree, (node) => node.type === 'button' && node.props['aria-controls']?.endsWith('-seats'))[0];
tree = mobile();
seatButton(tree).props.onClick();
tree = mobile();
assert.equal(seatButton(tree).props['aria-expanded'], true);
mobileProps = { ...mobileProps, seatMode: true, seatRequestId: 1 };
tree = mobile();
assert.equal(seatButton(tree).props['aria-expanded'], false, 'Seat selection must reveal the view on small screens');
assert.match(renderToStaticMarkup(tree), /Drag to look around/);
assert.match(renderToStaticMarkup(tree), /Arrow keys when focused/);
seatButton(tree).props.onClick();
tree = mobile();
assert.equal(seatButton(tree).props['aria-expanded'], true, 'The seat menu can be reopened from seat mode');
mobileProps = { ...mobileProps, seatRequestId: 2 };
tree = mobile();
assert.equal(seatButton(tree).props['aria-expanded'], false, 'Repeated seat requests must close the mobile menu too');
console.log('PASS: mobile seat drawer opens, closes on selection, and reopens for another seat');
