// Run: node scripts/check-field.cjs. Real Three geometry; no browser/GPU appearance claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const React = require('react');
const THREE = require('three');
const root = path.resolve(__dirname, '..');
function load(file, replacements = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: (name) => Object.hasOwn(replacements, name) ? replacements[name] : require(name) };
  vm.runInNewContext(code, context, { filename: file });
  return context.exports;
}
function near(actual, expected, tolerance = 1e-5) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}
const pitch = load('src/lib/cricket-pitch.ts');
const outfield = load('src/lib/outfield.ts', { './cricket-pitch': pitch });
const model = load('src/lib/model.ts');
const D = pitch.CRICKET_PITCH_DIMENSIONS;
const scene = new THREE.Group();
function sourceMesh(name, geometry) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  mesh.name = name;
  mesh.userData.stadiumLayer = 'pitch';
  scene.add(mesh);
  return mesh;
}
const originalTurf = sourceMesh('WEB34C_PITCH_033_HF27_Pitch_Cricket_Outfield', new THREE.PlaneGeometry(108, 120));
const originalStrip = sourceMesh('WEB34C_PITCH_031_HF27_Pitch_Central_Strip', new THREE.PlaneGeometry(2.5, 20));
const apron = sourceMesh('WEB34C_PITCH_034_HF27_Pitch_Perimeter_Apron', new THREE.BoxGeometry(116, 0.1, 128));
const originalChildren = [...scene.children];
let originalDisposals = 0;
for (const mesh of originalChildren) {
  mesh.geometry.addEventListener('dispose', () => originalDisposals++);
  mesh.material.addEventListener('dispose', () => originalDisposals++);
}
const effects = [];
const { SelectionManager } = load('src/components/3d/SelectionManager.tsx', {
  react: { useLayoutEffect: (effect) => effect() },
  '@react-three/fiber': { useThree: () => ({ gl: { shadowMap: { autoUpdate: true, needsUpdate: false } }, invalidate() {} }) },
  '@/lib/model': model,
});
const { StadiumModel } = load('src/components/3d/StadiumScene.tsx', {
  react: { ...React, useLayoutEffect: (effect) => effects.push(effect) },
  '@react-three/fiber': { useThree: () => ({ gl: { shadowMap: { needsUpdate: false } }, invalidate() {} }) },
  '@react-three/drei': { useGLTF: () => ({ scene }), Html: () => null },
  '@/data/stadiumAssets': { STADIUM_ASSETS: {} },
  '@/lib/model': model, '@/lib/seats': load('src/lib/seats.ts'),
  '@/lib/outfield': outfield, '@/lib/cricket-pitch': pitch,
  './SelectionManager': { SelectionManager },
});
let readyBounds;
function mount() {
  effects.length = 0;
  StadiumModel({ url: '/fixture.glb', layers: { stadium: true, seats: true },
    onBoundsChange: (bounds) => { readyBounds = bounds; },
    onSeatMapChange: (map) => assert.equal(map.seatCount, 0) });
  // React runs the child visibility layout effect before the parent's setup effect.
  SelectionManager({ root: scene, layers: { stadium: true, seats: true } });
  const cleanups = effects.map((effect) => effect());
  return () => cleanups.forEach((cleanup) => cleanup?.());
}
const unmount = mount();
const field = scene.getObjectByName('WEB_CRICKET_FIELD_PRESENTATION');
assert.ok(field, 'The actual StadiumModel must install the new field before reporting readiness');
assert.ok(readyBounds.wicket);
near(readyBounds.wicket.radius, 12.5);
assert.equal(originalTurf.visible, false);
assert.equal(originalStrip.visible, false);
assert.equal(apron.visible, true);
const meshes = [];
field.traverse((object) => { if (object.isMesh) meshes.push(object); });
const stumps = meshes.filter((mesh) => mesh.name.startsWith('Cricket_Stump_'));
const bails = meshes.filter((mesh) => mesh.name.startsWith('Cricket_Bail_'));
const creases = meshes.filter((mesh) => mesh.name.startsWith('Crease_'));
assert.equal(stumps.length, 6);
assert.equal(bails.length, 4);
assert.equal(creases.length, 8);
assert.equal(meshes.length, 23);
near(D.pitchLength, 20.12);
near(D.pitchWidth, 3.05);
near(D.stumpHeight, 0.7112);
near(D.wicketWidth, 0.2286);
for (const [sign, end] of [[1, 'North'], [-1, 'South']]) {
  const wicket = new THREE.Box3();
  for (const stump of stumps.filter((mesh) => mesh.name.includes(end))) {
    near(stump.position.z, sign * D.pitchLength / 2);
    const box = new THREE.Box3().setFromObject(stump);
    near(box.min.y, D.pitchTopY);
    near(box.max.y - box.min.y, D.stumpHeight);
    wicket.union(box);
    assert.ok(stump.castShadow);
  }
  near(wicket.max.x - wicket.min.x, D.wicketWidth);
  const popping = new THREE.Box3().setFromObject(field.getObjectByName(`Crease_Popping_${end}`));
  near(popping.getCenter(new THREE.Vector3()).z, sign * (D.pitchLength / 2 - D.poppingCreaseOffset), 0.002);
  near(popping.max.x - popping.min.x, D.poppingCreaseLength);
  for (const bail of bails.filter((mesh) => mesh.name.includes(end))) {
    const box = new THREE.Box3().setFromObject(bail);
    assert.ok(box.min.y > wicket.max.y - 0.02 && box.max.y < wicket.max.y + 0.02, 'Bails must rest at the stump crowns');
    assert.ok(box.min.x >= wicket.min.x && box.max.x <= wicket.max.x);
  }
}
const turf = field.getObjectByName('Cricket_Outfield_Turf');
const rope = field.getObjectByName('Cricket_Boundary_Rope');
const turfBox = new THREE.Box3().setFromObject(turf);
const ropeBox = new THREE.Box3().setFromObject(rope);
near(turfBox.max.x, 54);
near(turfBox.max.z, 60);
near(turfBox.min.y, 0.014);
near(ropeBox.min.y, turfBox.max.y);
near(ropeBox.max.y - ropeBox.min.y, 0.08);
assert.ok(turfBox.max.x - ropeBox.max.x > 3 && turfBox.max.z - ropeBox.max.z > 3, 'Boundary needs a grass run-off margin');
const dots = field.getObjectByName('Cricket_Thirty_Yard_Fielding_Dots');
assert.ok(dots.isInstancedMesh && dots.count === 47);
console.log('PASS: installed field, true-scale wicket dimensions, six stumps/four bails, creases, raised rope and run-off');

// Millimetre-separated full planes still fight for the same depth at stadium scale.
// A ground point must belong to just one surface, not grass + square + strip.
const groundSurfaces = ['Cricket_Outfield_Turf', 'Cricket_Pitch_Square', 'Cricket_Pitch_Strip']
  .map((name) => field.getObjectByName(name));
const groundRay = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
for (const x of [0.43, D.pitchWidth / 2 - 0.001, D.pitchWidth / 2 + 0.001, D.squareWidth / 2 - 0.001, D.squareWidth / 2 + 0.001].flatMap((n) => [n, -n])) {
  for (const z of [1.23, D.preparedLength / 2 - 0.001, D.preparedLength / 2 + 0.001, D.squareLength / 2 - 0.001, D.squareLength / 2 + 0.001].flatMap((n) => [n, -n])) {
    groundRay.ray.origin.set(x, 5, z);
    const surfaces = [...new Set(groundRay.intersectObjects(groundSurfaces, false).map((hit) => hit.object.name))];
    const expected = Math.abs(x) < D.pitchWidth / 2 && Math.abs(z) < D.preparedLength / 2 ? 'Cricket_Pitch_Strip'
      : Math.abs(x) < D.squareWidth / 2 && Math.abs(z) < D.squareLength / 2 ? 'Cricket_Pitch_Square' : 'Cricket_Outfield_Turf';
    assert.deepEqual(surfaces, [expected], `Ground at (${x}, ${z}) must have no overlapping surfaces or holes`);
  }
}
for (const mesh of groundSurfaces) {
  assert.ok(mesh.material.depthTest && mesh.material.depthWrite, 'Do not hide overlap by bypassing depth testing');
  const uv = mesh.geometry.getAttribute('uv');
  assert.ok(Array.from(uv.array).every((n) => n >= -1e-6 && n <= 1 + 1e-6), 'Surface UVs must stay normalized after triangulating the openings');
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  const normals = mesh.geometry.getAttribute('normal');
  for (let i = 0; i < normals.count; i++) {
    assert.ok(new THREE.Vector3().fromBufferAttribute(normals, i).applyNormalMatrix(normalMatrix).y > 0.999,
      'Ground must face upward after cutting the openings');
  }
}
console.log('PASS: turf, square and strip form one ground surface, including both sides of every seam');

function resources(group) {
  const result = { geometries: new Set(), materials: new Set(), textures: new Set(), instances: new Set() };
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    result.geometries.add(mesh.geometry);
    if (mesh.isInstancedMesh) result.instances.add(mesh);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      result.materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) result.textures.add(value);
    }
  });
  return result;
}
function textureHashes(group) {
  return [...resources(group).textures].map((texture) => [texture.name,
    crypto.createHash('sha256').update(texture.image.data).digest('hex')]).sort();
}
const owned = resources(field);
const expectedTextures = textureHashes(field);
const textureBytes = [...owned.textures].reduce((sum, texture) => sum + texture.image.data.byteLength, 0);
const triangles = meshes.reduce((sum, mesh) => sum + mesh.geometry.index.count / 3 * (mesh.isInstancedMesh ? mesh.count : 1), 0);
assert.ok(textureBytes < 8 * 1024 * 1024, 'Generated textures must stay under 8 MiB, before mipmaps');
assert.ok(triangles < 20000, 'Detail must not add heavyweight grass geometry');
for (const geometry of owned.geometries) {
  for (const attribute of Object.values(geometry.attributes)) {
    assert.ok(Array.from(attribute.array).every(Number.isFinite), 'Geometry must not contain NaN/Infinity');
  }
}
for (const material of owned.materials) {
  assert.ok(material.isMeshStandardMaterial);
  assert.equal(material.metalness, 0);
  assert.ok(material.roughness >= 0.7, 'Grass, clay, chalk and willow must not read as glossy plastic');
  if (material.map) assert.equal(material.map.colorSpace, THREE.SRGBColorSpace);
  if (material.bumpMap) assert.equal(material.bumpMap.colorSpace, THREE.NoColorSpace);
}
for (const texture of owned.textures) {
  assert.ok(texture.isDataTexture && texture.generateMipmaps);
  assert.equal(texture.minFilter, THREE.LinearMipmapLinearFilter);
  assert.equal(texture.magFilter, THREE.LinearFilter);
  assert.ok(texture.anisotropy >= 8);
}
for (const name of ['Cricket_Pitch_Strip', 'Cricket_Pitch_Square']) {
  const data = field.getObjectByName(name).material.map.image.data;
  let sum = 0, sumSquares = 0;
  for (let i = 0; i < data.length; i += 4) { sum += data[i]; sumSquares += data[i] ** 2; }
  const count = data.length / 4;
  const deviation = Math.sqrt(sumSquares / count - (sum / count) ** 2);
  assert.ok(deviation < 4.5, `${name} should have restrained texture variation, not a blotchy patchwork`);
}
const disposalCounts = new Map();
for (const resource of Object.values(owned).flatMap((set) => [...set])) {
  disposalCounts.set(resource, 0);
  resource.addEventListener('dispose', () => disposalCounts.set(resource, disposalCounts.get(resource) + 1));
}
for (const stadium of [false, true]) {
  SelectionManager({ root: scene, layers: { stadium, seats: false, environment: true, roads: true, parking: true } });
  const visible = [];
  field.traverseVisible((object) => { if (object.isMesh) visible.push(object); });
  assert.equal(visible.length, stadium ? 23 : 0, 'New field must follow the master stadium toggle, not the seat toggle');
  assert.equal(originalTurf.visible, false, 'Toggles must never restore the old grass or rings');
}
unmount();
assert.equal(scene.getObjectByName('WEB_CRICKET_FIELD_PRESENTATION'), undefined);
assert.deepEqual(scene.children, originalChildren);
assert.equal(originalDisposals, 0, 'Never dispose cached source-model geometry or materials');
for (const count of disposalCounts.values()) assert.equal(count, 1, 'Each owned/shared resource must be disposed exactly once');
const remountCleanup = mount();
const remounted = scene.getObjectByName('WEB_CRICKET_FIELD_PRESENTATION');
assert.notEqual(remounted, field);
assert.deepEqual(textureHashes(remounted), expectedTextures, 'Remounts must reproduce textures rather than randomising their appearance');
assert.equal(scene.children.filter((child) => child.name === 'WEB_CRICKET_FIELD_PRESENTATION').length, 1);
remountCleanup();
assert.equal(originalDisposals, 0);
scene.remove(originalTurf, originalStrip);
const fallbackCleanup = mount();
assert.equal(scene.getObjectByName('WEB_CRICKET_FIELD_PRESENTATION'), undefined, 'Other venue models must not receive Motera-specific geometry');
assert.equal(readyBounds.wicket, undefined);
fallbackCleanup();
console.log(`PASS: rough mipmapped deterministic textures (${textureBytes} bytes), ${triangles} added triangles, master visibility, cleanup/remount and model scoping`);
