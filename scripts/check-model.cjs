// Run: node scripts/check-model.cjs [--asset] (uses installed Three.js and TypeScript).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const THREE = require('three');
const root = path.resolve(__dirname, '..');
const context = { exports: {}, require };
const modelCode = ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/model.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
vm.runInNewContext(modelCode, context);
const { getStadiumLayer, isModelObjectExcluded, isStadiumLayerVisible, getModelBounds } = context.exports;

const layerNames = ['stadium', 'pitch', 'seats', 'environment', 'roads', 'parking'];
for (const layer of layerNames) {
  const group = new THREE.Group();
  group.name = `WEB34C_${layer.toUpperCase()}_fixture`;
  const child = new THREE.Object3D();
  group.add(child);
  assert.equal(getStadiumLayer(child), layer, 'Inherited export prefix');
  group.userData.stadiumLayer = 'parking';
  child.name = 'WEB34C_PITCH_named_child';
  assert.equal(getStadiumLayer(child), 'parking', 'Metadata must beat name heuristics');
  child.userData.stadiumLayer = layer;
  assert.equal(getStadiumLayer(child), layer, 'Nearest metadata must win');
}
for (const [name, layer] of Object.entries({
  Seating_Detail_Lower: 'seats', Pitch_Outfield: 'pitch',
  Step21_Environment_Parking: 'parking', Near_Road_Main: 'roads',
  Web_Environment_Trees: 'environment', unclassified: 'stadium',
})) {
  const object = new THREE.Object3D();
  object.name = name;
  assert.equal(getStadiumLayer(object), layer);
}
let combinations = 0;
for (let bits = 0; bits < 32; bits++) {
  const [stadium, environment, roads, parking, seats] = Array.from({ length: 5 }, (_, n) => Boolean(bits & (1 << n)));
  const layers = { stadium, environment, roads, parking, seats };
  for (const layer of layerNames) {
    const expected = stadium && ({ environment: false, roads: false, parking: false, seats }[layer] ?? true);
    assert.equal(isStadiumLayerVisible(layer, layers), expected, `${layer}, ${bits}`);
    combinations++;
  }
}

function mesh(layer, size, position) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color: '#153B96' }));
  object.userData.stadiumLayer = layer;
  object.position.set(...position);
  return object;
}
function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} != ${expected}`);
}
function vector(actual, expected) { actual.forEach((value, index) => near(value, expected[index])); }
const scene = new THREE.Group();
const building = mesh('stadium', [20, 8, 12], [0, 4, 0]);
const pitch = mesh('pitch', [14, 0.1, 8], [0, 0.05, 0]);
scene.add(building, pitch, mesh('environment', [200, 1, 200], [10000, 0, 10000]));
// A recursive bounds union on the building would wrongly include this child.
building.add(mesh('roads', [10, 1, 10], [-5000, 0, 0]));
building.visible = false;
const material = building.material;
const originalColor = material.color.clone();
let bounds = getModelBounds(scene);
vector(bounds.center, [0, 4, 0]);
near(bounds.radius, 10);
near(bounds.height, 8);
near(bounds.pitch.radius, 7);
near(bounds.full.radius, bounds.radius);
vector(bounds.full.center, bounds.center);
assert.equal(building.visible, false, 'Measuring must not change visibility');
assert.equal(building.material, material);
assert.ok(material.color.equals(originalColor), 'Measuring must not change materials');

const parent = new THREE.Group();
parent.position.set(50, 20, -30);
parent.scale.set(2, 3, 4);
parent.add(scene);
bounds = getModelBounds(scene);
vector(bounds.center, [50, 32, -30]);
near(bounds.radius, 24);
near(bounds.height, 24);

const instanced = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 2, 2), material, 2);
instanced.userData.stadiumLayer = 'seats';
instanced.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-20, 2, 0));
instanced.setMatrixAt(1, new THREE.Matrix4().makeTranslation(30, 8, 0));
instanced.position.set(10, 5, -7);
bounds = getModelBounds(instanced);
vector(bounds.center, [15, 10, -7]);
near(bounds.radius, 26);
near(bounds.height, 8);
const empty = getModelBounds(new THREE.Group());
near(empty.radius, 1);
assert.equal(empty.pitch, undefined);
const detached = mesh('stadium', [30, 12, 20], [600, 0, 600]);
detached.name = 'WEB34C_STADIUM_055_MAT_D2_Facade_Concrete';
const detachedChild = mesh('stadium', [1, 1, 1], [0, 0, 0]);
detached.add(detachedChild);
assert.equal(getStadiumLayer(detachedChild), 'environment', 'Detached pavilion must not leak through its saved stadium tag');
assert.equal(getModelBounds(detached).radius, 1, 'Detached pavilion must not contribute to the camera fit');
const obsoletePitch = new THREE.Group();
obsoletePitch.name = 'WEB34C_PITCH_035_NMS_HF_Grass';
const obsoleteChild = mesh('pitch', [1000, 5, 1000], [1000, 20, 1000]);
obsoletePitch.add(obsoleteChild);
assert.equal(getStadiumLayer(obsoleteChild), 'pitch', 'Visibility exclusion must not change semantic classification');
assert.equal(isModelObjectExcluded(obsoleteChild), true, 'Obsolete surface exclusion must be inherited');
assert.equal(getModelBounds(obsoletePitch).pitch, undefined, 'Excluded overlay must not affect pitch framing');
obsoletePitch.name = 'WEB34C_PITCH_036_NMS_HF_Grass';
assert.equal(isModelObjectExcluded(obsoleteChild), false, 'Keep the separate boundary grass batch');
console.log(`PASS: semantic inheritance, legacy names, ${combinations} stadium-only layer combinations, excluded-site bounds, transforms and GPU instances`);

async function checkAsset() {
  const crypto = require('node:crypto');
  const modelPath = 'public/models/narendra-modi-stadium/step34-c-motera.glb';
  const bytes = fs.readFileSync(path.join(root, modelPath));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.toString('ascii', 16, 20), 'JSON');
  const jsonLength = bytes.readUInt32LE(12);
  const document = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const provenance = document.asset.extras;
  assert.equal(provenance.source_checkpoint, 'step34_C_motera_reference_seat_colours.blend');
  assert.equal(provenance.visual_seat_count, 27604);
  assert.equal(provenance.unit_metres, 1);
  assert.equal(provenance.up_axis, '+Y');
  const source = fs.readFileSync(path.join(root, 'sources/narendra-modi-stadium/detailed/step34-finalization', provenance.source_checkpoint));
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'), provenance.source_sha256);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'public/models/narendra-modi-stadium/stadium.glb'))).digest('hex'),
    '69a67c6b80c7e48f26f4331c4516abcba18300d80f73136aafdce0913aae3003');
  assert.ok(document.images.length > 0, 'Saved baked textures must be embedded');
  for (const image of document.images) {
    assert.equal(image.uri, undefined);
    const view = document.bufferViews[image.bufferView];
    const start = 28 + jsonLength + (view.byteOffset ?? 0);
    const imageBytes = bytes.subarray(start, start + view.byteLength);
    if (image.mimeType === 'image/png') {
      assert.equal(imageBytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.ok(imageBytes.readUInt32BE(16) > 0 && imageBytes.readUInt32BE(20) > 0);
    } else {
      assert.equal(image.mimeType, 'image/jpeg');
      assert.equal(imageBytes.readUInt16BE(0), 0xffd8);
    }
  }
  const engine = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const engineContext = { exports: {}, require: () => engine };
  vm.runInNewContext(modelCode, engineContext);
  const helpers = engineContext.exports;
  const loader = new GLTFLoader();
  // Node has no browser image decoder. Test real geometry/material/instance parsing
  // with texture placeholders; image headers are checked above, not visually rendered.
  loader.register(() => ({ name: 'GEOMETRY_ONLY_TEXTURE_STUB', loadTexture: () => Promise.resolve(new engine.Texture()) }));
  const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const actualBounds = helpers.getModelBounds(gltf.scene);
  assert.ok(actualBounds.radius > 100 && actualBounds.height > 5);
  near(actualBounds.full.radius, actualBounds.radius);
  vector(actualBounds.full.center, actualBounds.center);
  assert.ok(actualBounds.pitch.radius < actualBounds.radius);
  let triangles = 0;
  let drawBatches = 0;
  const colours = { orange: 0, blue: 0, gold: 0 };
  const origins = new Set();
  const layers = new Set();
  const transform = new engine.Matrix4();
  const point = new engine.Vector3();
  const palette = { orange: '#ED4D10', blue: '#153B96', gold: '#FFC51A' };
  gltf.scene.traverse((object) => {
    if (!object.isMesh) return;
    assert.equal(object.isSkinnedMesh, undefined);
    layers.add(helpers.getStadiumLayer(object));
    assert.ok(object.geometry.index && object.geometry.attributes.normal);
    const count = object.isInstancedMesh ? object.count : 1;
    triangles += object.geometry.index.count / 3 * count;
    drawBatches++;
    const colour = object.material.name.replace('WEB34C_SEATS_POLYMER_', '').toLowerCase();
    if (!Object.hasOwn(colours, colour)) return;
    assert.ok(object.isInstancedMesh, 'Seats must stay GPU instanced');
    const expected = new engine.Color(palette[colour]);
    for (const channel of ['r', 'g', 'b']) near(object.material.color[channel], expected[channel]);
    colours[colour] += count;
    for (let i = 0; i < count; i++) {
      object.getMatrixAt(i, transform);
      point.setFromMatrixPosition(transform).applyMatrix4(object.matrixWorld);
      origins.add(point.toArray().join(','));
    }
  });
  assert.deepEqual(colours, provenance.seat_colour_counts);
  assert.equal(origins.size, 27604);
  assert.equal(triangles, 4847635);
  assert.equal(drawBatches, 99);
  assert.deepEqual([...layers].sort(), [...layerNames].sort());
  const seatContext = { exports: {}, require: () => engine };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/seats.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, seatContext);
  const seatMap = seatContext.exports.buildSeatMap(gltf.scene, actualBounds.pitch.center);
  assert.equal(seatMap.numbering, 'model');
  assert.equal(seatMap.seatCount, origins.size);
  const mappedIds = new Set();
  const mappedPositions = new Set();
  for (const pavilion of seatMap.pavilions) {
    assert.ok(pavilion.rows.length > 0);
    assert.ok(pavilion.tier === 'lower' || pavilion.tier === 'upper');
    for (const [rowIndex, row] of pavilion.rows.entries()) {
      assert.equal(row.number, rowIndex + 1);
      assert.ok(row.seats.length > 0);
      const elevation = Math.round(row.seats[0].position[1] * 100);
      for (const [index, seat] of row.seats.entries()) {
        assert.equal(seat.seat, index + 1);
        assert.equal(seat.standId, pavilion.id);
        assert.equal(seat.row, row.number);
        assert.equal(seat.isDemo, true);
        assert.ok(origins.has(seat.position.join(',')), 'Every menu option must refer to an actual GLB instance');
        assert.equal(Math.round(seat.position[1] * 100), elevation);
        near(seat.eyePosition[0], seat.position[0]);
        near(seat.eyePosition[1] - seat.position[1], 1.15);
        near(seat.eyePosition[2], seat.position[2]);
        vector(seat.target, actualBounds.pitch.center);
        mappedIds.add(seat.id);
        mappedPositions.add(seat.position.join(','));
      }
    }
  }
  assert.equal(mappedIds.size, 27604);
  assert.equal(mappedPositions.size, 27604);
  gltf.scene.children.reverse();
  assert.equal(JSON.stringify(seatContext.exports.buildSeatMap(gltf.scene, actualBounds.pitch.center)), JSON.stringify(seatMap),
    'Pavilion/row/seat numbering must not depend on mesh traversal order');
  gltf.scene.children.reverse();
  console.log(`PASS: all ${seatMap.seatCount} real seats map uniquely into ${seatMap.pavilions.length} model pavilion/tier groups with stable numbering and seated eye positions`);
  // The web scene adds these generated details without rewriting the source GLB.
  let cricketPitch;
  for (const [file, factory] of [['src/lib/cricket-pitch.ts', 'createCricketPitch'], ['src/lib/outfield.ts', 'createOutfield']]) {
    const detailContext = { exports: {}, require: (name) => {
      if (name === 'three') return engine;
      if (name === './cricket-pitch') return cricketPitch;
      throw new Error(`Unexpected field dependency: ${name}`);
    } };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText, detailContext);
    if (factory === 'createCricketPitch') cricketPitch = detailContext.exports;
    gltf.scene.add(detailContext.exports[factory]());
  }
  const detailBounds = helpers.getModelBounds(gltf.scene);
  assert.ok(detailBounds.wicket && detailBounds.wicket.radius < detailBounds.pitch.radius / 3,
    'Pitch preset needs close wicket bounds rather than the whole playing field');
  near(detailBounds.radius, actualBounds.radius);
  vector(detailBounds.pitch.center, actualBounds.pitch.center);
  assert.equal(JSON.stringify(seatContext.exports.buildSeatMap(gltf.scene, detailBounds.pitch.center)), JSON.stringify(seatMap),
    'Field presentation must not change seat positions, numbering or view targets');
  // Exercise the production visibility effect, not just the classification helper.
  const managerContext = { exports: {}, require: (name) => {
     if (name === 'three') return engine;
     if (name === 'react') return { useLayoutEffect: (effect) => effect() };
     if (name === '@react-three/fiber') return { useThree: () => ({
       gl: { shadowMap: { autoUpdate: true, needsUpdate: false } }, invalidate() {},
     }) };
    if (name === '@/lib/model') return helpers;
    throw new Error(`Unexpected import: ${name}`);
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/components/3d/SelectionManager.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, managerContext);
  const show = (stadium, seats) => {
    // Even stale flags requesting every surrounding layer must not reveal the site.
    managerContext.exports.SelectionManager({ root: gltf.scene, layers: { stadium, seats, environment: true, roads: true, parking: true } });
    const visible = new Set();
    gltf.scene.traverseVisible((object) => { if (object.isMesh) visible.add(helpers.getStadiumLayer(object)); });
    return [...visible].sort();
  };
  assert.deepEqual(show(true, true), ['pitch', 'seats', 'stadium']);
  assert.deepEqual(show(true, false), ['pitch', 'stadium']);
  assert.deepEqual(show(false, true), []);
  assert.deepEqual(show(true, true), ['pitch', 'seats', 'stadium'], 'Resetting the master toggle must never restore the site');
  const visibleMeshes = [];
  gltf.scene.traverseVisible((object) => { if (object.isMesh) visibleMeshes.push(object); });
  const pitchRay = new engine.Raycaster(undefined, new engine.Vector3(0, -1, 0), 0, 150);
  for (const [x, z, expected, height] of [
    [0.4, 1, 'Cricket_Pitch_Strip', 0.031],
    [1, -8, 'Cricket_Pitch_Strip', 0.031],
    [-1, 8, 'Cricket_Pitch_Strip', 0.031],
    [4, 4, 'Cricket_Pitch_Square', 0.02],
    [20, 20, 'Cricket_Outfield_Turf', 0.014],
    [46, 0, 'Cricket_Outfield_Turf', 0.014],
    [49, 0, 'Cricket_Outfield_Turf', 0.014],
    [50.8, 0, 'Cricket_Boundary_Rope', 0.094],
    [53, 0, 'Cricket_Outfield_Turf', 0.014],
    [0.4, 8.84, 'Crease_Popping_North', 0.032],
  ]) {
    pitchRay.ray.origin.set(x, 100, z);
    const hit = pitchRay.intersectObjects(visibleMeshes, false)[0];
    assert.equal(hit?.object.name, expected, `Field detail at (${x}, ${z}) must not be covered by legacy surfaces`);
    near(hit.point.y, height);
  }
  assert.equal(gltf.scene.getObjectByName('WEB34C_PITCH_035_NMS_HF_Grass').visible, false);
  assert.equal(gltf.scene.getObjectByName('WEB34C_PITCH_036_NMS_HF_Grass').visible, true);
  for (const name of ['WEB34C_PITCH_030_HF27_Pitch_Boundary_Approximat',
    'WEB34C_PITCH_031_HF27_Pitch_Central_Strip', 'WEB34C_PITCH_032_HF27_Pitch_Central_Wicket_Area',
    'WEB34C_PITCH_033_HF27_Pitch_Cricket_Outfield', 'WEB34C_PITCH_037_Study_field', 'WEB34C_PITCH_038_Study_site']) {
    assert.equal(gltf.scene.getObjectByName(name).visible, false, `Replaced surface ${name} must stay hidden after toggles`);
  }
  for (const [sign, end] of [[1, 'North'], [-1, 'South']]) {
    for (const [index, x] of [-0.09525, 0, 0.09525].entries()) {
      const ray = new engine.Raycaster(new engine.Vector3(x, 0.38, sign * 8), new engine.Vector3(0, 0, sign), 0, 4);
      assert.equal(ray.intersectObjects(visibleMeshes, false)[0]?.object.name, `Cricket_Stump_${end}_${index + 1}`);
    }
  }
  console.log('PASS: real-model rays expose new turf, clay, square, creases, rope, run-off and all six stumps; old surfaces stay hidden after toggles');
  const report = JSON.parse(fs.readFileSync(path.join(root, 'sources/narendra-modi-stadium/detailed/step34-finalization/step34-c-web-export-report.json'), 'utf8'));
  const detachedBatches = report.nonseat_batches.filter((batch) => batch.source_names.every((name) => name.includes('VIP_PLAYERS_PAVILION')) && batch.layer === 'stadium');
  assert.equal(detachedBatches.length, 6);
  for (const batch of detachedBatches) {
    const object = gltf.scene.getObjectByName(batch.name);
    assert.ok(object, `Missing detached pavilion batch: ${batch.name}`);
    assert.equal(object.visible, false, `Detached building still visible: ${batch.name}`);
  }
  console.log('PASS: real GLB shows only stadium, seats and pitch; all surrounding layers and six detached pavilion batches stay hidden');
  console.log('PASS: real Three.js GLTFLoader geometry/material/instancing parse (texture decoding and GPU rendering not tested)');
  console.log(JSON.stringify({ modelPath, bytes: bytes.length, triangles, drawBatches, embeddedImages: document.images.length,
    colours, uniqueSeats: origins.size, bounds: actualBounds, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }, null, 2));
}
if (process.argv.includes('--asset')) checkAsset().catch((error) => { console.error(error); process.exitCode = 1; });
