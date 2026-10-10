import * as THREE from 'three';

/** Metres, with +Y up and the two wickets on the Z axis. */
export const CRICKET_PITCH_DIMENSIONS = {
  pitchLength: 20.12, // Between wickets, not the length of the prepared ground.
  pitchWidth: 3.05,
  preparedLength: 24,
  squareWidth: 13,
  squareLength: 25,
  squareTopY: 0.02,
  pitchTopY: 0.031,
  paintLift: 0.001,
  stumpHeight: 0.7112,
  stumpDiameter: 0.0381,
  wicketWidth: 0.2286, // Outside edge to outside edge of the three stumps.
  bailLength: 0.1095,
  bailLongSpigotLength: 0.034,
  bailBarrelLength: 0.054,
  bailSpigotRadius: 0.0035,
  bailBarrelRadius: 0.0085,
  stumpGrooveDepth: 0.0045,
  bowlingCreaseLength: 2.64,
  poppingCreaseLength: 3.66,
  poppingCreaseOffset: 1.22,
  returnCreaseOffset: 1.32,
  returnCreaseBehindBowling: 1.22,
  creaseWidth: 0.045,
} as const;

const D = CRICKET_PITCH_DIMENSIONS;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function noiseField(width: number, height: number, random: () => number) {
  const values = Float32Array.from({ length: width * height }, random);
  return (u: number, v: number) => {
    const x = THREE.MathUtils.clamp(u, 0, 1) * (width - 1);
    const y = THREE.MathUtils.clamp(v, 0, 1) * (height - 1);
    const ix = Math.min(Math.floor(x), width - 2);
    const iy = Math.min(Math.floor(y), height - 2);
    const tx = THREE.MathUtils.smoothstep(x - ix, 0, 1);
    const ty = THREE.MathUtils.smoothstep(y - iy, 0, 1);
    const top = THREE.MathUtils.lerp(values[iy * width + ix], values[iy * width + ix + 1], tx);
    const bottom = THREE.MathUtils.lerp(values[(iy + 1) * width + ix], values[(iy + 1) * width + ix + 1], tx);
    return THREE.MathUtils.lerp(top, bottom, ty);
  };
}

function dataTexture(data: Uint8Array<ArrayBuffer>, width: number, height: number, name: string, color: boolean) {
  const texture = new THREE.DataTexture(data, width, height, color ? THREE.RGBAFormat : THREE.RedFormat);
  texture.name = name;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function pixel(data: Uint8Array, offset: number, r: number, g: number, b: number) {
  data[offset] = THREE.MathUtils.clamp(Math.round(r), 0, 255);
  data[offset + 1] = THREE.MathUtils.clamp(Math.round(g), 0, 255);
  data[offset + 2] = THREE.MathUtils.clamp(Math.round(b), 0, 255);
  data[offset + 3] = 255;
}

function bumpPixel(data: Uint8Array, offset: number, value: number) {
  data[offset] = THREE.MathUtils.clamp(Math.round(value), 0, 255);
}

function groundMaterial(strip: boolean) {
  const width = 256;
  const height = strip ? 1024 : 512;
  const metresWide = strip ? D.pitchWidth : D.squareWidth;
  const metresLong = strip ? D.preparedLength : D.squareLength;
  const color = new Uint8Array(width * height * 4);
  const bump = new Uint8Array(width * height);
  const random = seededRandom(strip ? 72813 : 39427);
  const patches = noiseField(7, 13, random);
  const roller = noiseField(35, 8, random);
  const laneColors = [[95, 119, 59], [98, 121, 61], [96, 120, 60], [97, 121, 60], [94, 118, 58]];

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const u = (column + 0.5) / width;
      const v = (row + 0.5) / height;
      const x = (u - 0.5) * metresWide;
      const z = (0.5 - v) * metresLong;
      const mottling = patches(u, v) - 0.5;
      const grain = random() - 0.5;
      const roll = roller(u, v) - 0.5;
      const bumpOffset = row * width + column;
      const colorOffset = bumpOffset * 4;
      if (strip) {
        const endWear = Math.exp(-Math.pow((Math.abs(z) - 9.5) / 1.25, 2));
        const shade = mottling * 3 + roll * 2.5 + grain * 5 - endWear * 1.5;
        pixel(color, colorOffset, 193 + shade, 174 + shade, 134 + shade * 0.8);
      } else {
        const lane = Math.round(x / 3.12);
        const base = laneColors[lane + 2];
        // Maintained short grass: gently distinct olive lanes, without bare mottled patches.
        const shade = mottling * 4 + roll * 3 + grain * 6;
        pixel(color, colorOffset, base[0] + shade, base[1] + shade, base[2] + shade * 0.7);
      }
      const relief = 128 + grain * (strip ? 38 : 64) + mottling * 4;
      bumpPixel(bump, bumpOffset, relief);
    }
  }

  if (strip) {
    // A few restrained crease-end scuffs baked into otherwise clean rolled clay.
    for (const sign of [-1, 1]) {
      for (let mark = 0; mark < 5; mark++) {
        const cx = (random() - 0.5) * 1.8;
        const cz = sign * (mark < 3 ? 8.65 + random() * 0.55 : 10.3 + random() * 0.6);
        const rx = 0.045 + random() * 0.035;
        const rz = 0.10 + random() * 0.09;
        const angle = (random() - 0.5) * 1.5;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const reach = rx + rz;
        const x0 = Math.max(0, Math.floor((0.5 + (cx - reach) / metresWide) * width));
        const x1 = Math.min(width - 1, Math.ceil((0.5 + (cx + reach) / metresWide) * width));
        const y0 = Math.max(0, Math.floor((0.5 - (cz + reach) / metresLong) * height));
        const y1 = Math.min(height - 1, Math.ceil((0.5 - (cz - reach) / metresLong) * height));
        for (let row = y0; row <= y1; row++) {
          for (let column = x0; column <= x1; column++) {
            const x = ((column + 0.5) / width - 0.5) * metresWide - cx;
            const z = (0.5 - (row + 0.5) / height) * metresLong - cz;
            const distance = ((x * cos + z * sin) / rx) ** 2 + ((z * cos - x * sin) / rz) ** 2;
            if (distance >= 1) continue;
            const amount = (1 - distance) * (0.35 + random() * 0.65);
            const bumpOffset = row * width + column;
            const colorOffset = bumpOffset * 4;
            pixel(color, colorOffset, color[colorOffset] - amount * 8, color[colorOffset + 1] - amount * 7, color[colorOffset + 2] - amount * 5);
            const relief = bump[bumpOffset] - amount * 8;
            bumpPixel(bump, bumpOffset, relief);
          }
        }
      }
    }
  }

  const name = strip ? 'Cricket_Rolled_Clay' : 'Cricket_Prepared_Grass';
  const material = new THREE.MeshStandardMaterial({
    map: dataTexture(color, width, height, `${name}_Color`, true),
    bumpMap: dataTexture(bump, width, height, `${name}_Bump`, false),
    bumpScale: strip ? 0.0012 : 0.003,
    roughness: strip ? 0.96 : 0.99,
    metalness: 0,
  });
  material.name = name;
  return material;
}

function woodMaterial() {
  const width = 64;
  const height = 256;
  const color = new Uint8Array(width * height * 4);
  const bump = new Uint8Array(width * height);
  const random = seededRandom(88017);
  const fibres = noiseField(64, 7, random);
  const patches = noiseField(7, 13, random);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const u = column / (width - 1);
      const v = row / (height - 1);
      const fibre = fibres(u, v);
      const grain = fibre ** 3 * 22 + patches(u, v) * 4 + random() * 2;
      const bumpOffset = row * width + column;
      const colorOffset = bumpOffset * 4;
      pixel(color, colorOffset, 232 - grain, 225 - grain * 1.1, 204 - grain * 1.2);
      const relief = 128 - (fibre - 0.5) * 31;
      bumpPixel(bump, bumpOffset, relief);
    }
  }
  const material = new THREE.MeshStandardMaterial({
    map: dataTexture(color, width, height, 'Cricket_Willow_Grain', true),
    bumpMap: dataTexture(bump, width, height, 'Cricket_Willow_Bump', false),
    bumpScale: 0.00025,
    roughness: 0.72,
    metalness: 0,
  });
  material.name = 'Cricket_Light_Willow';
  return material;
}

function stumpGeometry() {
  const r = D.stumpDiameter / 2;
  const h = D.stumpHeight;
  const profile = [
    [0, 0], [r * 0.91, 0], [r, 0.012], [r * 0.97, h - 0.04],
    [r * 0.92, h - 0.013], [r * 0.76, h - 0.003], [r * 0.56, h], [0, h],
  ];
  const geometry = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 20);
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    // A shallow transverse groove receives the bail spigots in the rounded crown.
    const notch = Math.max(0, 1 - Math.abs(positions.getZ(i)) / (D.bailSpigotRadius * 1.7));
    const crown = THREE.MathUtils.smoothstep(y, h - 0.013, h);
    positions.setY(i, y - notch * crown * D.stumpGrooveDepth);
    uv.setY(i, y / h);
  }
  geometry.computeVertexNormals();
  geometry.name = 'Cricket_Tapered_Grooved_Stump';
  return geometry;
}

function bailGeometry() {
  const start = -D.bailLength / 2;
  const shoulder = start + D.bailLongSpigotLength;
  const endBarrel = shoulder + D.bailBarrelLength;
  const end = D.bailLength / 2;
  const r = D.bailSpigotRadius;
  const barrel = D.bailBarrelRadius;
  const profile = [
    [0, start], [r * 0.8, start + 0.0007], [r, start + 0.002],
    [r, shoulder - 0.002], [barrel * 0.7, shoulder], [barrel, shoulder + 0.004],
    [barrel, endBarrel - 0.004], [barrel * 0.7, endBarrel],
    [r, endBarrel + 0.002], [r, end - 0.001], [r * 0.75, end - 0.0004], [0, end],
  ];
  const geometry = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 16);
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) uv.setY(i, (positions.getY(i) - start) / D.bailLength);
  geometry.name = 'Cricket_Turned_Bail';
  return geometry;
}

function creaseGeometry(axis: 'x' | 'z', fixed: number, start: number, end: number, seed: number) {
  const random = seededRandom(seed);
  const vertices: number[] = [];
  const indices: number[] = [];
  // Popping creases extend onto the green square: split exactly at the clay edges.
  const cuts = [start, end];
  if (axis === 'x') {
    for (const edge of [-D.pitchWidth / 2, D.pitchWidth / 2]) {
      if (edge > start && edge < end) cuts.push(edge);
    }
  }
  cuts.sort((a, b) => a - b);
  for (let cut = 0; cut < cuts.length - 1; cut++) {
    const a = cuts[cut];
    const b = cuts[cut + 1];
    const middleX = axis === 'x' ? (a + b) / 2 : fixed;
    const top = Math.abs(middleX) < D.pitchWidth / 2 ? D.pitchTopY : D.squareTopY;
    const y = top + D.paintLift;
    const steps = Math.ceil((b - a) / 0.1);
    const first = vertices.length / 3;
    for (let step = 0; step <= steps; step++) {
      const t = THREE.MathUtils.lerp(a, b, step / steps);
      const halfWidth = D.creaseWidth / 2 + (random() - 0.5) * 0.002;
      if (axis === 'x') vertices.push(t, y, fixed - halfWidth, t, y, fixed + halfWidth);
      else vertices.push(fixed + halfWidth, y, t, fixed - halfWidth, y, t);
      if (step < steps) {
        const i = first + step * 2;
        indices.push(i, i + 1, i + 2, i + 2, i + 1, i + 3);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function squareGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-D.squareWidth / 2, -D.squareLength / 2);
  shape.lineTo(D.squareWidth / 2, -D.squareLength / 2);
  shape.lineTo(D.squareWidth / 2, D.squareLength / 2);
  shape.lineTo(-D.squareWidth / 2, D.squareLength / 2);
  shape.closePath();
  // The clay owns this exact footprint; height separation alone still z-fights at stadium scale.
  const strip = new THREE.Path();
  strip.moveTo(-D.pitchWidth / 2, -D.preparedLength / 2);
  strip.lineTo(-D.pitchWidth / 2, D.preparedLength / 2);
  strip.lineTo(D.pitchWidth / 2, D.preparedLength / 2);
  strip.lineTo(D.pitchWidth / 2, -D.preparedLength / 2);
  strip.closePath();
  shape.holes.push(strip);
  const geometry = new THREE.ShapeGeometry(shape);
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  // ShapeGeometry uses world-space XY as UVs; retain the original full-square texture mapping.
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, positions.getX(i) / D.squareWidth + 0.5, positions.getY(i) / D.squareLength + 0.5);
  }
  return geometry;
}

/** A self-contained pitch; the caller owns placement, visibility and resource disposal. */
export function createCricketPitch(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'WEB_CRICKET_PITCH';
  group.userData.stadiumLayer = 'pitch';
  group.userData.cameraFocus = 'wicket';

  const add = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material, castShadow = false) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  const square = add('Cricket_Pitch_Square', squareGeometry(), groundMaterial(false));
  square.rotation.x = -Math.PI / 2;
  square.position.y = D.squareTopY;
  const strip = add('Cricket_Pitch_Strip', new THREE.PlaneGeometry(D.pitchWidth, D.preparedLength), groundMaterial(true));
  strip.rotation.x = -Math.PI / 2;
  strip.position.y = D.pitchTopY;

  const chalk = new THREE.MeshStandardMaterial({
    color: 0xf1efdf,
    roughness: 1,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  chalk.name = 'Cricket_Chalk_White';
  const wood = woodMaterial();
  const stump = stumpGeometry();
  const bail = bailGeometry();
  const stumpSpacing = (D.wicketWidth - D.stumpDiameter) / 2;
  let creaseSeed = 611;

  for (const sign of [1, -1]) {
    const endName = sign === 1 ? 'North' : 'South';
    const wicketZ = sign * D.pitchLength / 2;
    const poppingZ = wicketZ - sign * D.poppingCreaseOffset;
    const returnEndZ = wicketZ + sign * D.returnCreaseBehindBowling;
    add(`Crease_Bowling_${endName}`, creaseGeometry('x', wicketZ, -D.bowlingCreaseLength / 2, D.bowlingCreaseLength / 2, creaseSeed++), chalk);
    add(`Crease_Popping_${endName}`, creaseGeometry('x', poppingZ, -D.poppingCreaseLength / 2, D.poppingCreaseLength / 2, creaseSeed++), chalk);
    for (const side of [-1, 1]) {
      add(
        `Crease_Return_${endName}_${side < 0 ? 'West' : 'East'}`,
        creaseGeometry('z', side * D.returnCreaseOffset, Math.min(poppingZ, returnEndZ), Math.max(poppingZ, returnEndZ), creaseSeed++),
        chalk,
      );
    }

    for (let index = 0; index < 3; index++) {
      const mesh = add(`Cricket_Stump_${endName}_${index + 1}`, stump, wood, true);
      mesh.position.set((index - 1) * stumpSpacing, D.pitchTopY, wicketZ);
    }
    for (let index = 0; index < 2; index++) {
      const side = index === 0 ? -1 : 1;
      const mesh = add(`Cricket_Bail_${endName}_${index + 1}`, bail, wood, true);
      // Longer spigots face outwards; the two short tips meet in the middle stump.
      mesh.rotation.z = side * Math.PI / 2;
      mesh.position.set(
        side * D.bailLength / 2,
        D.pitchTopY + D.stumpHeight - D.stumpGrooveDepth + D.bailSpigotRadius,
        wicketZ,
      );
    }
  }

  return group;
}
