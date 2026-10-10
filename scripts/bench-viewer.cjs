// Run: node scripts/bench-viewer.cjs. CPU setup only; not a browser/FPS benchmark.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const ts = require('typescript');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceHashes = {};
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const round = (value) => Math.round(value * 100) / 100;

function resources(group) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  return { geometries, materials, textures };
}

async function run() {
  const started = performance.now();
  const engine = await import('three');
  const modules = new Map();
  function load(relative) {
    const file = path.resolve(root, relative);
    if (modules.has(file)) return modules.get(file);
    const source = fs.readFileSync(file, 'utf8');
    sourceHashes[path.relative(root, file)] = hash(source);
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const exports = {};
    modules.set(file, exports);
    const localRequire = (name) => {
      if (name === 'three') return engine;
      if (name.startsWith('./')) return load(path.resolve(path.dirname(file), `${name}.ts`));
      return require(name);
    };
    new Function('exports', 'require', output)(exports, localRequire);
    return exports;
  }
  const { createOutfield } = load('src/lib/outfield.ts');
  const { createCricketPitch } = load('src/lib/cricket-pitch.ts');
  const { getModelBounds, isModelObjectExcluded, getStadiumLayer, isStadiumLayerVisible } = load('src/lib/model.ts');
  const { buildSeatMap } = load('src/lib/seats.ts');
  const modelPath = 'public/models/narendra-modi-stadium/step34-c-motera.glb';
  const bytes = fs.readFileSync(path.join(root, modelPath));
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const loader = new GLTFLoader();
  loader.register(() => ({ name: 'CPU_ONLY_TEXTURE_STUB', loadTexture: () => Promise.resolve(new engine.Texture()) }));
  const parseStart = performance.now();
  const { scene } = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const geometryParseMs = performance.now() - parseStart;
  const samples = [];
  for (let i = -1; i < 5; i++) {
    if (performance.now() - started > 60000) throw new Error('60 second benchmark cutoff reached; no complete comparison');
    const times = {};
    let start = performance.now();
    const field = createOutfield();
    times.outfieldMs = performance.now() - start;
    start = performance.now();
    const pitch = createCricketPitch();
    times.pitchMs = performance.now() - start;
    scene.add(field, pitch);
    start = performance.now();
    const bounds = getModelBounds(scene);
    times.boundsMs = performance.now() - start;
    start = performance.now();
    const map = buildSeatMap(scene, bounds.pitch.center);
    times.seatsMs = performance.now() - start;
    if (map.seatCount !== 27604) throw new Error('Benchmark must retain all 27,604 model seats');
    times.totalMs = Object.values(times).reduce((a, b) => a + b, 0);
    const detail = new engine.Group().add(field, pitch);
    const owned = resources(detail);
    times.textureBytes = [...owned.textures].reduce((sum, texture) => sum + texture.image.data.byteLength, 0);
    for (const resource of [...owned.geometries, ...owned.materials, ...owned.textures]) resource.dispose();
    detail.traverse((mesh) => { if (mesh.isInstancedMesh) mesh.dispose(); });
    if (i >= 0) samples.push(Object.fromEntries(Object.entries(times).map(([key, value]) => [key, round(value)])));
  }
  let visibleTriangles = 0, visibleMeshes = 0;
  scene.traverse((mesh) => {
    if (!mesh.isMesh || isModelObjectExcluded(mesh) || !isStadiumLayerVisible(getStadiumLayer(mesh), { stadium: true, seats: true })) return;
    visibleMeshes++;
    visibleTriangles += mesh.geometry.index.count / 3 * (mesh.isInstancedMesh ? mesh.count : 1);
  });
  console.log(JSON.stringify({
    scope: 'Warm CPU setup: one unrecorded warmup, five fresh field+map runs; decoded images, GPU, network and FPS excluded',
    environment: { node: process.version, platform: process.platform, arch: process.arch, cpu: os.cpus()[0]?.model },
    sourceHashes, model: { path: modelPath, bytes: bytes.length, sha256: hash(bytes), visibleMeshes, visibleTriangles },
    geometryParseMs: round(geometryParseMs), samples,
    medians: Object.fromEntries(Object.keys(samples[0]).map((key) => [key, median(samples.map((row) => row[key]))])),
  }, null, 2));
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
