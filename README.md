# 3D-Cricket-Stadiums

## Model-based seat view

Open `/stadiums/narendra-modi-stadium`, choose a pavilion/tier, then a row and seat.
Selecting a seat switches automatically to its eye-level view, facing the pitch.
Drag on the stadium to look around without leaving the selected seat. Focus the
canvas (click it or use Tab) to look with the arrow keys. **View from seat**
recentres the view toward the pitch; panning and zooming stay off in seat mode.
Use **Return to overview** or a camera preset to restore orbit controls. On mobile,
open **Seats** in the viewer footer; the drawer closes when a seat is selected.

- `src/lib/seats.ts` maps the active GLB's 27,604 unique polymer seat instances
  into 16 pavilion/tier groups. Rows follow model elevation; seats follow angle.
- Pavilion A–H and row/seat numbers are **model-derived, not official ticket labels**.
  No official seating chart or surveyed sightline mapping is included.
- `src/lib/camera.ts` derives the camera from each instance's eye position
  (1.15 metres above its local base). Seat mode uses a 65° vertical field of view
  and keeps the eye fixed. It does not fly through the roof to reach the seat.
- Seat selection does not edit Blender files or GLB geometry/materials. The
  stadium-only visibility and obsolete-pitch-surface exclusions remain active.

## Field and wicket presentation

The web viewer replaces the saved model's flat field surfaces and overlapping
study rings with a deterministic, lightweight cricket-field presentation:

- Mown green turf with patch variation and fine grass bump, plus a raised off-white
  boundary rope and a grass run-off margin. Small dots mark a 30-yard fielding circle.
- A prepared wicket square and rolled-clay strip with subtle granular wear,
  foot scuffs, bowling/popping/return creases, and two sets of three wooden stumps
  and two bails. Wickets are 20.12 m apart; stumps are 0.7112 m tall.
- **Pitch view** now frames the prepared square for inspecting the wickets.
  Overview, top-down and the existing seat look-around remain available.

Turf, square and strip meet through matching geometry openings, rather than
stacked ground planes. Distant views adapt the near clipping plane to the empty
space before the stadium; close-ups and seat views retain their close near plane.
This prevents high-view depth interference from breaking up the pitch. The square
uses restrained green/olive variation and the clay has only light crease-end wear.

These are model-based visual details, not a surveyed match-day boundary layout.
`src/lib/outfield.ts` and `src/lib/cricket-pitch.ts` generate geometry/textures
locally without downloads. `StadiumScene.tsx` mounts and disposes the detail;
the GLB, Blender checkpoint, stadium architecture and seat coordinates are unchanged.

## Animated stadium loader

The loading screen uses a self-contained SVG stadium: foundation, seating tiers and
roof assemble on entry, then a seating-light wave, roof trace, field-light sweep and
gentle float continue while the real model loads. No additional images, videos,
WebGL canvas or animation dependencies are downloaded for the illustration.

The status text follows the real opening, loading and preparing phases. Only measured
resource progress shows a percentage; opening/preparing stay indeterminate. The
animation runs automatically, while reduced-motion preferences show a complete static
stadium. The loader still disappears only when the real scene is ready, with a
five-second minimum display window so the stadium assembly is perceivable on fast
local loads. This holds the loader UI only; it does not delay model fetching or
invent progress.

### Checks

With dependencies and the local stadium assets present:

```sh
node scripts/check-seats.cjs
node scripts/check-field.cjs
node scripts/check-model.cjs --asset
node scripts/check-loading.cjs
node scripts/check-ui.cjs http://127.0.0.1:3001
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

These cover real-model seat coordinates, deterministic numbering, selector
transitions, camera mathematics, mobile drawer state, loading and HTTP delivery.
The demand-rendered canvas caps device pixel ratio at 1.35, caches static shadows
at 1024², excludes individual seat meshes from the shadow-caster list, and wakes
only for camera/input/visibility changes. The generated field textures now use
3,366,912 base-level bytes instead of 7,741,440; broad turf colour is 512² while
fine grass bump detail remains 512². The protected GLB remains byte-identical
at 63,596,848 bytes and still maps all 27,604 seats.
Loader checks include actual phase state, pause/resume without freezing progress,
SVG ID isolation, bundled animation styles and reduced-motion rules. To visually
check motion, reload the viewer and use Pause/Resume; also compare a narrow screen
and the browser's reduced-motion setting.
Native input-handler checks cover anchored mouse/touch/keyboard look-around,
pitch limits, pointer cancellation, recentering, compass updates and cleanup.
Layout checks cover the shared header/panel flow and single desktop scrollbar.
Field checks cover wicket dimensions, crease placement, surface/rope heights,
non-overlapping seams, normalized UVs, texture and geometry budgets, model scoping,
master visibility and resource cleanup. Camera checks cover distant depth precision
and returning from top-down to pitch without stale clipping planes.
`node scripts/bench-viewer.cjs` records warm CPU setup for GLB parse, generated
field creation, bounds and seat mapping on the local machine; it deliberately does
not claim browser FPS or GPU render time. Network delivery remains model-size
bound, so a production CDN/server should serve the GLB with caching and transport
compression where supported.
They do not replace browser/GPU visual testing. Manually compare a lower-tier and
upper-tier seat, drag and use arrow keys, repeat a selection, and return to overview
on desktop and mobile. At a short desktop height, scroll the left rail: the expanded
seat header must not overlap the selector, and the layers must remain reachable
above the footer. Also check the native selects and canvas in fullscreen Tab order.
Use **Pitch view** to inspect both sets of stumps and crease markings, and compare
the turf and boundary from top-down and a lower-tier seat. GPU texture/shadow
appearance still needs this live browser check.
The next step for matching real ticket numbers is an authoritative pavilion,
row and seat map; do not relabel model sectors as official stands without it.
