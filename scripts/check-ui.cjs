// Dependency-free regression checks; uses the project's installed TypeScript compiler.
// Run: node scripts/check-ui.cjs [http://localhost:3000]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function loadData(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const context = { exports: {} };
  vm.runInNewContext(outputText, context, { filename: file });
  return context.exports;
}

const { PUBLIC_STADIUMS, getStadiumBySlug, getFeaturedStadiums, searchStadiums, filterStadiums } = loadData('src/data/stadiums.ts');
const { STADIUM_ASSETS } = loadData('src/data/stadiumAssets.ts');
const moteraModel = '/models/narendra-modi-stadium/step34-c-motera.glb';
assert.equal(STADIUM_ASSETS['narendra-modi-stadium'].stadiumModel, moteraModel);
assert.equal(getStadiumBySlug('narendra-modi-stadium').stadiumModel, moteraModel);

assert.ok(PUBLIC_STADIUMS.length > 0);
assert.equal(PUBLIC_STADIUMS.some((venue) => venue.id === 'test-stadium'), false);
assert.ok(getStadiumBySlug('test-stadium'), 'The development route should remain available');
assert.equal(getStadiumBySlug('unknown-stadium'), undefined);
assert.equal(getFeaturedStadiums().some((venue) => venue.id === 'test-stadium'), false);
assert.equal(searchStadiums('test-stadium').length, 0);
assert.equal(searchStadiums('   ').length, 0);
assert.equal(searchStadiums(' WANKHEDE ')[0].slug, 'wankhede-stadium');
assert.equal(searchStadiums('Ahmedabad')[0].slug, 'narendra-modi-stadium');
assert.equal(searchStadiums('gujarat')[0].slug, 'narendra-modi-stadium');
assert.equal(searchStadiums('not-a-real-venue').length, 0);
assert.equal(filterStadiums('').length, PUBLIC_STADIUMS.length, 'Cleared filters must show all public venues');
assert.equal(filterStadiums('  ', 'all', 'all').length, PUBLIC_STADIUMS.length);
assert.equal(filterStadiums('Mumbai', 'Gujarat').length, 0, 'Filters must intersect');
assert.equal(filterStadiums('', 'Gujarat', 'available')[0].slug, 'narendra-modi-stadium');
assert.equal(filterStadiums('Mumbai', 'all', 'available').length, 0);
assert.equal(filterStadiums('Mumbai', 'Maharashtra', 'coming-soon')[0].slug, 'wankhede-stadium');

const ready = filterStadiums('', 'all', 'available');
const profiles = filterStadiums('', 'all', 'coming-soon');
assert.ok(ready.length > 0);
assert.equal(ready.length + profiles.length, PUBLIC_STADIUMS.length);
for (const venue of ready) {
  const asset = STADIUM_ASSETS[venue.id];
  assert.equal(asset?.status, 'available');
  assert.ok(fs.existsSync(path.join(root, 'public', asset.stadiumModel)), `Missing model: ${venue.id}`);
}
assert.ok(fs.statSync(path.join(root, 'public/narendra-modi-stadium.jpg')).size > 0, 'The supplied image must be present');
console.log('PASS: public catalog, search, combined filters, empty/reset cases, model assets, supplied image');

const colors = require('../tailwind.config.js').theme.extend.colors;
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
for (const level of [950, 900, 850, 800, 700]) {
  const surface = colors.surface[level];
  assert.ok(luminance(surface) > 0.7, `Surface ${level} must stay light`);
  for (const role of ['main', 'muted', 'dim']) {
    assert.ok(contrast(colors.ink[role], surface) >= 4.5, `${role} text must pass WCAG AA on surface ${level}`);
  }
}
assert.ok(contrast(colors['on-accent'], colors.accent.DEFAULT) >= 4.5, 'Filled button label contrast');
assert.ok(contrast(colors['on-accent'], colors.accent.hover) >= 4.5, 'Filled button hover contrast');
assert.ok(contrast(colors.accent.DEFAULT, colors.surface[850]) >= 4.5, 'Link contrast');
assert.ok(contrast(colors.line.strong, colors.surface[950]) >= 3, 'Input boundary contrast');
console.log('PASS: light surfaces, text/link/button contrast, input boundaries');

async function checkRoutes(base) {
  for (const [route, expected] of [
    ['/', 'Beyond'],
    ['/stadiums', 'Choose the ground. See the view.'],
    ['/map', 'Stadiums across India'],
    ['/about', 'A ground in 3D'],
    ['/stadiums/wankhede-stadium', 'No 3D model available'],
    ['/stadiums/narendra-modi-stadium', 'Narendra Modi Stadium 3D viewer'],
  ]) {
    const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(60000) });
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.ok(html.includes(expected), `${route}: missing expected content`);
    assert.ok(!html.includes('Test Stadium'), `${route}: development fixture leaked into discovery`);
    assert.ok(html.includes('Skip to content'), `${route}: missing skip link`);
    assert.ok(html.includes('data-theme="light"'), `${route}: must use the requested light theme`);
    assert.ok(html.includes('safe-area-page') || html.includes('safe-area-home'), `${route}: page needs mobile safe-area gutters`);
    assert.ok(html.includes('min-h-11'), `${route}: interactive layout should retain touch-sized controls`);
    if (route === '/' || route === '/stadiums') {
      assert.ok(html.includes('src="/narendra-modi-stadium.jpg"'), `${route}: supplied image not used`);
    }
    if (route === '/') {
      assert.ok(html.includes('grid-cols-1') && html.includes('sm:grid-cols-2'), 'Home cards must collapse to one column on mobile');
    }
    if (route === '/stadiums') {
      assert.ok(html.includes('grid-cols-1') && html.includes('sm:grid-cols-2'), 'Directory cards must collapse to one column on mobile');
      assert.ok(html.includes('min-w-0'), 'Directory filters must be allowed to shrink on mobile');
    }
    if (route === '/map') {
      assert.ok(html.includes('md:grid-cols-[1.2fr_1fr]'), 'Map content must stack before the desktop split');
      assert.ok(html.includes('overflow-x-hidden'), 'Map list must not create horizontal page overflow');
    }
    if (route === '/about') {
      assert.ok(html.includes('max-w-2xl'), 'About copy needs a readable mobile measure');
    }
    if (route === '/' || route === '/stadiums/narendra-modi-stadium') {
      const cssPaths = [...new Set(Array.from(html.matchAll(/href="([^"]+\.css(?:\?[^"]*)?)"/g), (match) => match[1]))];
      assert.ok(cssPaths.length, 'Home page must load a stylesheet');
      const stylesheets = await Promise.all(cssPaths.map(async (url) => {
        const css = await fetch(new URL(url, base));
        assert.equal(css.status, 200, `Stylesheet ${url}`);
        return css.text();
      }));
      const css = stylesheets.join('\n');
      assert.match(css, /color-scheme:\s*light/, 'Compiled CSS must enable light browser controls');
      assert.ok(!/color-scheme:\s*dark/.test(css), 'No dark browser-control override');
      assert.match(css, /Barlow[ _]Condensed/, 'Display font must be bundled');
      assert.match(css, /Manrope/, 'Body font must be bundled');
      if (route === '/stadiums/narendra-modi-stadium') {
        for (const animation of ['assemble-foundation', 'assemble-tiers', 'assemble-roof', 'trace-roof', 'seat-light-wave', 'field-sweep', 'progress-sweep']) {
          assert.match(css, new RegExp(`@keyframes[^{}]*${animation}`), `Loading animation ${animation} must be bundled`);
        }
        assert.match(css, /@container stadium-loader/, 'Compact loading layout must be bundled');
        assert.ok(css.includes('.md\\:overflow-y-auto'), 'Desktop rail scrolling must be bundled');
        assert.ok(css.includes('.md\\:bottom-24'), 'Desktop rail footer clearance must be bundled');
      }
    }
    if (route === '/stadiums/wankhede-stadium') {
      assert.ok(!html.includes('<canvas'), 'A profile-only venue must not render a WebGL canvas');
      assert.ok(html.includes('Open Narendra Modi Stadium in 3D'), 'A profile-only venue needs a working alternative');
    }
    if (route === '/stadiums/narendra-modi-stadium') {
      assert.ok(html.includes(moteraModel), 'Production page must reference the saved Step34 C model');
      assert.ok(html.includes('Opening the stadium viewer'), 'Loading UI must be present before WebGL starts');
      assert.ok(html.includes('data-loader-art="stadium"'), 'Loading must show the animated stadium illustration');
      assert.ok(!html.includes('Pause animation') && !html.includes('Once ready, drag to rotate'),
        'The loader should not expose extra animation or interaction controls');
      assert.ok(html.includes('aria-busy="true"'), 'Viewer must report its initial loading state');
      assert.ok(html.includes('View from your seat') && html.includes('Seat number'), 'Seat-selection form must be integrated');
      assert.ok(html.includes('md:min-h-[520px]'), 'Viewer must have a mobile-safe minimum height without changing desktop sizing');
      assert.ok(html.includes('env(safe-area-inset-bottom)'), 'Viewer footer/drawers must respect mobile safe areas');
      assert.ok(html.includes('not official ticket seats'), 'Model-derived seat numbering must be labelled honestly');
      for (const hook of ['data-viewer-rail', 'data-viewer-header', 'data-viewer-panels']) {
        assert.ok(html.includes(`${hook}="true"`), `Production viewer is missing ${hook}`);
      }
      assert.ok(html.includes('hidden="" class="pointer-events-none absolute inset-0 z-10"'), 'Model controls must be hidden until ready');
      const progressTag = html.match(/<div[^>]*role="progressbar"[^>]*>/)?.[0];
      assert.ok(progressTag && !progressTag.includes('aria-valuenow'), 'Initial loading must not invent a percentage');
      for (const label of ['Entire stadium', 'Seating']) {
        assert.ok(html.includes(`aria-label="Toggle ${label}"`), `Missing stadium control: ${label}`);
      }
      for (const label of ['Site environment', 'Roads &amp; plazas', 'Parking']) {
        assert.ok(!html.includes(`aria-label="Toggle ${label}"`), `Surrounding-site control still exposed: ${label}`);
      }
    }
    console.log(`PASS: HTTP + server-rendered content ${route}`);
  }
  const image = await fetch(new URL('/narendra-modi-stadium.jpg', base));
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /^image\/jpeg/);
  console.log('PASS: supplied image served as JPEG');
  const model = await fetch(new URL(moteraModel, base), { signal: AbortSignal.timeout(60000) });
  assert.equal(model.status, 200, 'Step34 C model must be served');
  assert.match(model.headers.get('content-type'), /^model\/gltf-binary/);
  assert.equal(model.headers.get('cache-control'), 'public, max-age=31536000, immutable', 'Versioned GLB should be cached for repeat visits');
  const { createHash } = require('node:crypto');
  const servedHash = createHash('sha256');
  for await (const chunk of model.body) servedHash.update(chunk);
  const localHash = createHash('sha256').update(fs.readFileSync(path.join(root, 'public', moteraModel))).digest('hex');
  assert.equal(servedHash.digest('hex'), localHash, 'Server must return the new GLB bytes, not a fallback');
  console.log('PASS: production Step34 C URL, GLB MIME type and full served-file SHA-256');
}

if (process.argv[2]) {
  checkRoutes(process.argv[2]).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
