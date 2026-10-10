import * as THREE from 'three';
import { CRICKET_PITCH_DIMENSIONS } from './cricket-pitch';

const TURF_Y = 0.014;
const FIELD_RADIUS_X = 54;
const FIELD_RADIUS_Z = 60;
const ROPE_RADIUS_X = 50.8;
const ROPE_RADIUS_Z = 56.8;
const ROPE_THICKNESS = 0.04;
const TAU = Math.PI * 2;

// Integer hashing keeps every texture reproducible, including in Node.
function noiseHash(x: number, y: number, seed: number): number {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

// Periodic, smoothly interpolated noise also makes the small detail tiles seamless.
function noise(u: number, v: number, columns: number, rows: number, seed: number): number {
  const x = u * columns;
  const y = v * rows;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const tx = x - ix;
  const ty = y - iy;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const x0 = ((ix % columns) + columns) % columns;
  const y0 = ((iy % rows) + rows) % rows;
  const x1 = (x0 + 1) % columns;
  const y1 = (y0 + 1) % rows;
  const a = noiseHash(x0, y0, seed);
  const b = noiseHash(x1, y0, seed);
  const c = noiseHash(x0, y1, seed);
  const d = noiseHash(x1, y1, seed);
  return ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy) * 2 - 1;
}

function dataTexture(data: Uint8Array<ArrayBuffer>, width: number, height: number, name: string, colour = false): THREE.DataTexture {
  const texture = new THREE.DataTexture(data, width, height, colour ? THREE.RGBAFormat : THREE.RedFormat);
  texture.name = name;
  texture.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = colour ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16; // Three caps this to the renderer's supported maximum.
  texture.needsUpdate = true;
  return texture;
}

function turfColour(): THREE.DataTexture {
  const size = 512;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const worldX = (u - 0.5) * FIELD_RADIUS_X * 2;
      // The ground mapping's +V points towards -Z.
      const worldZ = (0.5 - v) * FIELD_RADIUS_Z * 2;
      const patch = noise(u, v, 5, 5, 631) * 0.58 + noise(u, v, 17, 19, 839) * 0.28
        + noise(u, v, 61, 59, 1637) * 0.14;
      const moisture = noise(u, v, 9, 11, 2671);
      // Broad 7.2 m mower passes, fifteen degrees off-axis, with soft edges.
      const pass = (worldX * Math.cos(Math.PI / 12) + worldZ * Math.sin(Math.PI / 12)) / 7.2;
      const stripe = Math.tanh(Math.sin(pass * Math.PI + patch * 0.035) * 5);
      const grain = (noiseHash(x, y, 4051) - 0.5) * 1.6;
      const index = (y * size + x) * 4;
      data[index] = Math.round(75 + stripe * 3.2 + patch * 10 + moisture * 2 + grain);
      data[index + 1] = Math.round(119 + stripe * 4.8 + patch * 13 + moisture * 3 + grain);
      data[index + 2] = Math.round(45 + stripe * 2 + patch * 5 - moisture * 1.5 + grain * 0.5);
      data[index + 3] = 255;
    }
  }
  return dataTexture(data, size, size, 'Cricket_Turf_Colour_sRGB', true);
}

function turfBump(): THREE.DataTexture {
  const size = 512;
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const bend = noise(u, v, 32, 32, 5381) * 0.003;
      // A 2 m repeat gives irregular 8 mm-wide, 31 mm-long blade/grain ridges.
      const blade = noise(u + bend, v, 256, 64, 6947);
      const tuft = noise(u, v, 48, 48, 7883);
      data[y * size + x] = Math.round(126 + blade * 66 + tuft * 18 + (noiseHash(x, y, 9011) - 0.5) * 16);
    }
  }
  const texture = dataTexture(data, size, size, 'Cricket_Turf_Blade_Bump_Linear');
  texture.repeat.set(FIELD_RADIUS_X, FIELD_RADIUS_Z);
  return texture;
}

class BoundaryLoop extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
    this.arcLengthDivisions = 1024;
  }

  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const angle = t * TAU;
    return target.set(
      ROPE_RADIUS_X * Math.cos(angle),
      TURF_Y + ROPE_THICKNESS,
      ROPE_RADIUS_Z * Math.sin(angle),
    );
  }
}

function ropeBump(length: number): THREE.DataTexture {
  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const v = (y + 0.5) / height;
      const strands = Math.cos(TAU * (u * 2 - v * 3)) * 0.65 + Math.cos(TAU * (u * 2 + v * 3)) * 0.35;
      const fibres = Math.cos(TAU * (u * 12 - v * 18));
      data[y * width + x] = Math.round(128 + strands * 49 + fibres * 9 + (noiseHash(x, y, 10427) - 0.5) * 6);
    }
  }
  const texture = dataTexture(data, width, height, 'Cricket_Rope_Braid_Bump_Linear');
  // Integer repeats close the seam; one repeat is approximately 16 cm of rope.
  texture.repeat.set(Math.round(length / 0.16), 1);
  return texture;
}

function fieldingDots(): THREE.InstancedMesh {
  const radius = 27.432; // 30 yards, with the two semicircles centred on the wickets.
  const wicketZ = 10.06;
  const arcLength = Math.PI * radius;
  const straightLength = wicketZ * 2;
  const perimeter = arcLength * 2 + straightLength * 2;
  const count = Math.round(perimeter / 4.572); // Approximately five yards apart.
  const geometry = new THREE.CircleGeometry(0.0762, 12); // Six-inch diameter paint dots.
  geometry.name = 'Cricket_Fielding_Dot_Geometry';
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({
    name: 'Cricket_Fielding_Dot_Paint',
    color: 0xd8dccf,
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.15,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const dots = new THREE.InstancedMesh(geometry, material, count);
  dots.name = 'Cricket_Thirty_Yard_Fielding_Dots';
  dots.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const distance = i * perimeter / count;
    let x: number;
    let z: number;
    if (distance < arcLength) {
      const angle = distance / radius;
      x = Math.cos(angle) * radius;
      z = wicketZ + Math.sin(angle) * radius;
    } else if (distance < arcLength + straightLength) {
      x = -radius;
      z = wicketZ - (distance - arcLength);
    } else if (distance < arcLength * 2 + straightLength) {
      const angle = Math.PI + (distance - arcLength - straightLength) / radius;
      x = Math.cos(angle) * radius;
      z = -wicketZ + Math.sin(angle) * radius;
    } else {
      x = radius;
      z = -wicketZ + (distance - arcLength * 2 - straightLength);
    }
    dots.setMatrixAt(i, matrix.makeTranslation(x, TURF_Y + 0.001, z));
  }
  dots.instanceMatrix.needsUpdate = true;
  dots.computeBoundingBox();
  dots.computeBoundingSphere();
  return dots;
}

/** Metres, +Y up. The caller owns all resources and disposes them on unmount. */
export function createOutfield(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WEB_REALISTIC_OUTFIELD';
  group.userData.stadiumLayer = 'pitch';

  // Three mipmapped textures retain 1,318,912 base-level CPU bytes in total (1.26 MiB).
  const turfMaterial = new THREE.MeshStandardMaterial({
    name: 'Cricket_Turf_Rough_Grass',
    color: 0xffffff,
    map: turfColour(),
    bumpMap: turfBump(),
    bumpScale: 0.013,
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.2,
  });
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, FIELD_RADIUS_X, FIELD_RADIUS_Z, 0, TAU, false, 0);
  const { squareWidth, squareLength } = CRICKET_PITCH_DIMENSIONS;
  const square = new THREE.Path();
  square.moveTo(-squareWidth / 2, -squareLength / 2);
  square.lineTo(-squareWidth / 2, squareLength / 2);
  square.lineTo(squareWidth / 2, squareLength / 2);
  square.lineTo(squareWidth / 2, -squareLength / 2);
  square.closePath();
  // The prepared square replaces this grass, rather than sitting above a competing full disc.
  shape.holes.push(square);
  const turfGeometry = new THREE.ShapeGeometry(shape, 128); // 256 ellipse segments, as before.
  turfGeometry.name = 'Cricket_Outfield_Ellipse_Geometry';
  const positions = turfGeometry.getAttribute('position');
  const uv = turfGeometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, positions.getX(i) / (FIELD_RADIUS_X * 2) + 0.5, positions.getY(i) / (FIELD_RADIUS_Z * 2) + 0.5);
  }
  turfGeometry.rotateX(-Math.PI / 2);
  const turf = new THREE.Mesh(turfGeometry, turfMaterial);
  turf.name = 'Cricket_Outfield_Turf';
  turf.position.y = TURF_Y;
  turf.receiveShadow = true;
  group.add(turf);

  const path = new BoundaryLoop();
  const boundaryGeometry = new THREE.TubeGeometry(path, 768, ROPE_THICKNESS, 8, true);
  boundaryGeometry.name = 'Cricket_Boundary_Rope_Geometry';
  const boundaryMaterial = new THREE.MeshStandardMaterial({
    name: 'Cricket_Boundary_Off_White_Braid',
    color: 0xe4dfcc,
    bumpMap: ropeBump(path.getLength()),
    bumpScale: 0.0012,
    roughness: 0.98,
    metalness: 0,
    envMapIntensity: 0.15,
  });
  const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
  boundary.name = 'Cricket_Boundary_Rope';
  boundary.receiveShadow = true;
  boundary.castShadow = true;
  group.add(boundary);
  group.add(fieldingDots());

  return group;
}
