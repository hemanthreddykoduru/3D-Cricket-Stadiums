# Narendra Modi Stadium — reference analysis and reconstruction specification

Stadium3D India · Phase 1 only · Research date: 2 October 2026

## Scope and evidence rules

This is an architectural reconstruction brief, not a measured survey, seating map, engineering drawing, or claim of a finished asset. The requested Markdown document is the only repository deliverable. No application code, Blender scene, or GLB is changed by this phase.

- **VERIFIED (V):** expressly documented by the owner, architect, or engineer, or directly visible in the cited photograph. Photographic verification applies to the depicted state, not necessarily the current 2026 configuration.
- **VISUALLY INFERRED (I):** interpretation supported by multiple photographs; dimensions, hidden connections, or exact placement remain unmeasured.
- **UNKNOWN (U):** insufficient evidence. Leave unresolved rather than filling with generic stadium details.
- **RECOMMENDATION (R):** a production decision, not a statement about the real building.

Confidence is scoped to the claimed feature. An authoritative photograph can be high-confidence evidence for an exposed column and poor evidence for compass direction or a concealed room. Perspective photographs are not orthographic drawings. Do not derive real dimensions from uncalibrated pixels.

Target an event-neutral reconstruction of the completed stadium. Use the owner's February 2020 photographs for unobstructed architecture and the architect's later match photographs to cross-check persistence. Do not combine temporary event installations into invented permanent architecture. The older photos do not establish today's landscaping or signage.

## 1. Reference inventory and source URLs

All sources below were accessed during this phase unless explicitly marked otherwise. Actual images were visually inspected, not inferred from filenames. Reference images were inspected in temporary storage outside the repository; no photographs or contact sheets were added to the website or document as embedded assets.

### Primary written sources

| ID | Source and URL | Viewpoint/information | Modeling suitability | Confidence |
|---|---|---|---|---|
| S1 | [Populous: Narendra Modi Stadium](https://populous.com/showcases/narendra-modi-stadium) | Architect's project description and photographic gallery; round open bowl, two distinct tiers, elevated podium, northern spectator approach, LED lighting | Primary conceptual authority; not a measured plan | High for stated design; limited for dimensions not given |
| S2 | [Populous: inauguration, 24 February 2020](https://populous.com/article/populous-designed-stadium-officially-inaugurated-by-world-leaders) | Two large general-admission tiers; pavilion, corporate boxes, practice facilities; design/opening context | Corroborates bowl organization; do not treat the article's illustration as an as-built survey | High for stated organization |
| S3 | [Gujarat Cricket Association: stadium](https://gujaratcricketassociation.com/narendra-modi-stadium/) | Owner's account, aerial imagery, field/site information, entry points, dressing rooms, practice facilities | Primary facility context; published sizes are not construction drawings | High for owner-reported facts |
| S4 | [GCA Stadium Gallery, 12 February 2020](https://gujaratcricketassociation.com/msgallery/gca-stadium-gallery/) | Ten complementary exterior, aerial, interior, field-level and detail photographs | Core photographic set; retain date and limitations | High for depicted visible features |
| S5 | [Walter P Moore: Narendra Modi Stadium Roof Design](https://www.walterpmoore.com/projects/narendra-modi-stadium-roof-design) | Roof engineer: PTFE fiberglass membrane, cantilever, perimeter ring, diagonal pipe columns, structural independence from grandstand | Primary authority for roof system; connection details not provided | High for described system |

### Inspected image inventory

Each direct image URL is paired with its publishing source above. These are analysis references, not cleared distribution assets.

| ID | Source / image URL | Viewpoint | Architectural information | Suitable use / confidence |
|---|---|---|---|---|
| G01 | S4 — [stadium01.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium01.jpg) | Oblique dusk aerial, pavilion side | Roof ring, bowl lighting, gold-toned pavilion frontage and neighborhood | Massing/lighting cross-check; high visible form, weak surface colors at dusk |
| G02 | S4 — [stadium02.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium02.jpg) | Interior from seating toward opposite end | Two-tier section, orange lower seating, patterned blue/orange/yellow upper seating, central wicket area | High for bowl and color organization; perspective not metric |
| G03 | S4 — [stadium03.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium03.jpg) | Elevated pavilion exterior | Gold-toned undulating screens, white pavilion mass, perimeter truss, driveway, planting, adjacent grounds, distant viaduct | High for pavilion identity and site relationships in 2020 |
| G04 | S4 — [stadium04.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium04.jpg) | Field level at night | Discrete roof-edge light arrays, boundary rope, lower bowl, opening/sight-screen zone | High for lighting location and pitch-level silhouette; glare hides fixture detail |
| G05 | S4 — [stadium05.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium05.jpg) | Near-overhead | Roof opening, radial roof bays, bowl/field outlines, pavilion seat interruption, site circulation, adjacent open grounds | Best plan reference; high topology, medium proportions; north and lens calibration unverified |
| G06 | S4 — [stadium06.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium06.jpg) | Opposite-side oblique aerial toward pavilion interior | V-like diagonal columns, exposed stand structure, elevated podium, pavilion interior, roof ring and lights | High for opposite exterior; hazy and not a surveyed rear elevation |
| G07 | S4 — [stadium07.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium07.jpg) | Elevated interior along wicket area | Radial aisles, portals, sight screens, boundary separation, player shelters, pitch square | High for visible organization; shelter positions may be movable |
| G08 | S4 — [stadium08.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium08.jpg) | Ground-level pavilion exterior | Curved/perforated-looking gold-toned screens, white structure, glazing, practice-net framing | High for screen shape; medium for inferred fabrication/material |
| G09 | S4 — [stadium09.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium09.jpg) | Player shelter close-up | Framed curved canopy, linked orange seats, fence, pavilion interior behind | High for photographed shelter; not proof of fixed present-day position |
| G10 | S4 — [stadium10.jpg](https://gujaratcricketassociation.com/wp-content/uploads/2020/02/stadium10.jpg) | Pavilion flank and paved forecourt | Screen-to-open-structure transition, diagonal supports, plaza pattern, landscaping, site poles | High local detail; does not establish complete side elevation |
| P58 | S1 — [entrance image](https://populous.com/uploads/2018/08/0_N58_cropped_1920x1080-1200x675-c-center.jpg) | Gate 1 approach | Angular gateway, sign beam, stair/ramp context, open facade with diagonal steel; temporary banners/crowds | High visible gateway; medium permanence of signs; cardinal location unknown |
| P60 | S1 — [match bowl image](https://populous.com/uploads/2018/08/0_N60_cropped_1920x1080-1200x675-c-center.jpg) | Wide interior | Large screen, tier separation, roof underside, pitch and end structures | High permanent massing; do not model ceremony layout |
| P61 | S1 — [oblique match interior](https://populous.com/uploads/2018/08/0_N61_cropped_1920x1080-1200x675-c-center.jpg) | Alternate bowl angle | Screen placement relative to upper tier, field perimeter and roof edge | High visible features; exact screen coordinates unknown |
| P62 | S1 — [empty seating bowl](https://populous.com/uploads/2018/08/0_N62_cropped_1920x1080-1200x675-c-center.jpg) | Lower seating beneath an overhang | Individual seat silhouettes, concrete underside, guardrails, color pattern, screen and glazed band | High seat/overhang appearance; useful cross-check against G02/G07 |
| P64 | S1 — [roof/interior cross-check](https://populous.com/uploads/2018/08/0_N64_cropped_1920x1080-1200x675-c-center.jpg) | Wide event interior | Roof light array and upper-tier rim; opposing end mass | High silhouette; airshow/event content excluded |
| P63 | S1 — [crowd close-up](https://populous.com/uploads/2018/08/0_N63_cropped_1920x1080-1200x675-c-center.jpg) | Crowd and flag | Most architecture obscured | Reject as a geometry reference; illustrates why filenames alone are insufficient |

### Secondary discovery and access limitations

- [Wikipedia overview](https://en.wikipedia.org/wiki/Narendra_Modi_Stadium) was read to discover the roof-engineer citation. It is not the authority for dimensions, capacities, bearings or current events in this brief.
- The older cited engineer URL `/projects/motera-cricket-stadium-roof-design` returned 404. The working S5 URL was located in the engineer's sitemap and read directly. Failed URLs are not evidence.
- Search integration requests returned cancellation. Research continued through the public primary-source pages and their linked galleries, not fabricated search results.
- No georeferenced survey, current satellite baseline, complete four-sided elevation set, or approved seating plan was obtained. The six-view specification below explicitly records those limits.

## 2. Architectural analysis and evidence classification

### A. Overall form, proportions and orientation

| Characteristic | Class / evidence | Reconstruction consequence |
|---|---|---|
| Round, open stadium bowl, continuous curved perimeter | V — S1/S2, G03/G05/G06 | A broad cricket bowl, not four rectangular football stands |
| Large horizontal footprint relative to height; roof reads as a thin crown above exposed structure | I — G03/G06/G10 | Match silhouette in multiple views; no invented height/diameter ratio |
| Pavilion sector differs markedly from the repetitive open exterior | V — G03/G06/G08 | Preserve asymmetric pavilion mass and frontage |
| Elevated pedestrian podium separates fans from traffic underneath | V — S1; visible in G06 | Model real vertical separation, not an asphalt ring on an empty plane |
| Principal spectator approach from the north via a rising ramp | V — S1 | Reserve northern approach in eventual geographic alignment; do not assign P58 to north without corroboration |
| Exact north-up rotation, pitch bearing, footprint axes and local datum | U | Use reference-relative cameras initially; do not label guessed compass directions as verified |

Published measurements, retained with attribution rather than inferred: S1 describes a ramp ascending **12 metres**; S3 reports a **63-acre** site and **180 yards × 150 yards** field; S5 describes a **30-metre roof cantilever**. These establish context only. Site area is not stadium footprint, field size is not a match boundary, and cantilever projection is not total roof width. No other exact building dimensions are established here.

### B. Seating bowl and concourses

- **V — S1/S2, G02/G07:** two large general-admission tiers. Do not build three uniform concentric tiers.
- **V — G06/G09:** pavilion interior has its own stacked glazed/floor bands and seating configuration; it is not simply the ordinary bowl repeated around the ring. **U:** exact pavilion level/seat allocation.
- **V — G02/G05/G07/P62:** predominantly orange lower seating; upper seating has dark blue areas with orange/yellow angular wave/chevron-like patterns, pale radial aisles and repeated portals. **I:** exact pattern boundaries reconstructed across image perspectives. Do not alternate generic blue/white/orange wedges.
- **V — G02/G07:** pronounced horizontal tier break/overhang and local glazed accommodation bands. **U:** complete concourse floor plans, heights and room functions.
- **V — G07/P62:** curved rows, separate seat shells, stairs, railings and substantial openings interrupt the seating. **U:** exact rows, block boundaries, aisle counts and seat counts. No real seat identifiers can be assigned.
- **I — G02/G05/G07:** lower bowl and playing-field outlines are rounded but should not be assumed perfectly circular or described by one unverified ellipse. Trace separate reference curves.

### C. Roof

- **V — S5:** translucent circular PTFE fiberglass tensile membrane, cantilevered from a perimeter steel ring; large diagonal pipe columns; roof structurally separate from cast-in-place concrete grandstand.
- **V — S5:** built perimeter ring uses a bi-chord arrangement rather than the concept's tri-chord proposal. S5 uses both tension-ring and compression-ring terminology in its prose; follow its visible built configuration, not a newly invented engineering explanation.
- **V — G03/G05/G06:** pale annular canopy with a large open center, radial bay/seam rhythm, shallow shaped panels, exposed perimeter triangulation and a thin inner edge. Not a dome, flat thick disk, or arbitrary futuristic roof.
- **V — G02/G04/G07:** roof covers the outer seating zone while substantial lower seating remains open to sky. The existing description “fully roofed seating bowl” is not supported.
- **I — G03/G06/G10:** roof/column silhouette can be reconstructed from repeated bays with site-specific curvature and variation. **U:** exact bay count, steel diameters, panel prestress, connection/anchor geometry and detailed deflection profile.

### D. Exterior, entrances and materials

- **V — G06/G10/P58:** tall pale diagonal tubes form repeated V-like outlines around open grandstand structure. Exposed concrete rakers, landings and concourse edges remain visible behind them. A solid cylindrical wall with vertical fins is not an adequate substitute.
- **V — G03/G08/G10:** pavilion frontage has stacked gold/bronze-toned undulating lens-like screen elements over a white/light-colored mass, with dark glazing at lower levels. **I:** perforated/mesh-like metal appearance in G08; do not assert alloy or exact panel construction.
- **V — P58:** an angular entry portal with inclined supports and a broad sign beam exists at the photographed Gate 1. **U:** its surveyed location, all other gateway shapes and current sign specification. S3 reports four entry points; this is not a license to clone four identical gates or equate entries with bowl tunnels.
- **V — G03/G06/G10:** exterior terraces, access routes, glazed openings and areas beneath the elevated platform contribute strongly to the massing. **U:** unseen service openings and circulation routes.
- **I — G08/G10/P62:** plausible visible palette is rough concrete, painted pale steel, translucent off-white roof, bronze-toned screens, dark glass and matte molded seats. PBR roughness and color values will be calibrated artistic approximations, not surveyed material properties.

### E. Floodlighting — distinguish field lighting from site poles

- **V — G04/G06/P60/P64:** primary bowl lighting is arranged as many discrete fixtures along the inner roof edge; S1 explicitly identifies LED lighting.
- **I — combined roof/field/exterior views:** the current stadium does not require the conventional freestanding field-floodlight towers used by the generic predecessor asset. Do not add four/six giant floodlight towers around the bowl.
- **V — G10/P58:** separate lighting/utility poles exist in the surrounding site. These are not proof of bowl floodlight towers. **U:** exact equipment functions for every pole, pole counts, heights and fixture photometry.
- **R:** represent visible roof fixtures with instances and a controlled emissive material; use a small presentation-light rig, not one shadow-casting real-time light per fixture. Do not replace the discrete assembly with an unsupported continuous neon tube.

### F. Pitch, boundary and field

- **V — G02/G05/G07:** a central rectangular wicket preparation area with parallel strips sits in a broad rounded grass outfield. Lower stands wrap the field; there are no football goals or athletics-track lanes.
- **V — G04/G07/P60:** boundary rope/advertising elements are inside the spectator barrier; a perimeter working/circulation strip separates the field and seating.
- **I — G02/G07/P60:** wicket area appears approximately central, with aligned end sight-screen zones. **U:** exact strip positions, current active pitch, pitch bearing and match boundary distances.
- **V — G02/G07:** visible mowing and turf-tone variation; **U:** exact current pattern. Model grass appearance with materials, not millions of blades.
- **R:** wickets/creases may later use separately cited Laws of Cricket dimensions, but those dimensions are not surveyed venue measurements and are not established by this document. Do not infer a permanent boundary from a particular match setup.

### G. Interior details and sightlines

- **V — P60/P61/P62:** large rectangular display screens are associated with the upper bowl. **U:** exact total count, surveyed positions, dimensions and current support arrangements. Images from different angles do not automatically prove different screens.
- **V — G07/G09:** small framed covered player shelters and end sight-screen structures are visible. **I:** shelters are movable equipment (wheels visible in G09), so positions should not be treated as permanent architecture.
- **V — S2/S3/S5:** four team dressing rooms and corporate-box accommodation are documented. **U:** internal room arrangement, player-route geometry and which visible door leads to which facility. Do not fabricate interiors.
- **V — S1/S2:** unobstructed sightlines were a stated design objective. **R:** keep columns outside the bowl and preserve upper/lower overhang geometry; do not claim a reconstructed demo seat has a verified real-world sightline.
- **V — G06/G09:** pavilion has distinctive glazing and exposed structural relationships. **U:** full hidden floor-by-floor configuration.

### H. Surrounding site

- **V — G03/G05/G06/G10:** paved forecourts, curving perimeter access roads, planting islands, fencing and changes between ground and podium levels are visible.
- **V — G03/G05:** adjacent rounded open/practice-ground areas and rectilinear building masses sit beside the stadium. S2/S3/S5 describe practice facilities. **U:** one-to-one mapping of every visible field to the published facility inventory and their current condition.
- **V — G03/G05/G06:** dense low-rise urban fabric, some larger distant buildings, tree concentrations and an elevated linear transport structure occur in the surroundings. **U:** precise infrastructure identification/alignment, cadastral limits and present-day building changes.
- **V — S3:** the stadium is in Motera near the Sabarmati River. **U:** river visibility and exact alignment from the proposed viewer cameras; do not place a decorative river next to the stadium without geographic evidence.
- **I — G03/G05/G10:** wider terrain appears broadly low-relief; deliberate podium/ramp grades remain important. **U:** terrain survey, drainage grading and flood levels.
- **U:** verified parking-bay counts, live occupancy and detailed parking circulation. Patterned paved areas are not automatically car parks. Do not fill plazas with invented parking stalls.

## 3. Six-view reconstruction specification

### Coordinate convention and coverage limitations

**R:** define “front” as the gold-screen pavilion exterior in G03, “rear” as the opposite side in G06, and “left/right” as seen by a person facing that front. These are production labels, not official entrances or compass directions. The P58 gateway is a separate reference, not assumed to coincide with the pavilion front. Preserve a separate eventual geographic-north transform.

The front/rear relationship is **I**, based on the matching pavilion interior and overhead image. Side coverage is partial, not complete surveyed elevations. Front/rear and side camera positions must be solved against the same plan before detailed geometry is approved.

| View / references | Recognizable features and required geometry | Can be simplified | Material/texture treatment | Must not be invented |
|---|---|---|---|---|
| **1. Aerial** — G01/G03/G05/G06 | Distinct field, lower bowl, upper bowl, open annular roof, pavilion interruption, podium outline; separate adjacent grounds and circulation | Roof connections, distant buildings, individual far seats | Seat-color pattern, mowing, paving, road surfaces | Exact north, roof diameter, repeated perfect-circle assumption, unknown parking plan |
| **2. Front exterior** — G03/G08/G10 | White pavilion mass; stacked undulating gold-toned screens; dark lower glazing; roof crown; flank transitions; curved access/landscape zone | Behind-screen rooms, hidden fixings, distant street clutter | Screen perforation/mesh at distance, glass tint, concrete weathering | Full golden facade around the entire stadium, ornate extra entrances, unverified room layouts |
| **3. Rear exterior** — G06, cross-check P58 | Open concrete grandstand backs; giant diagonal tubes; perimeter bi-chord truss; elevated podium and undercroft | Deep unviewed service interiors and hidden stairs | Dark recesses and restrained concrete variation | A cloned front pavilion, a solid vertical-fin cylinder, unsupported back gates |
| **4. Left side** — G05 plus pavilion flank evidence G03/G10 | Continuous roof/column rhythm; transition from pavilion to open bowl; evidence-matched podium silhouette | Unresolved local service details as low-detail massing | Shared pale steel/concrete; glazing only where supported | Mirroring a fully detailed opposite side; invented ramps or neighboring landmarks. Complete side elevation remains U |
| **5. Right side** — G03/G05/G08 | Pavilion flank, open-frame transition, adjacent practice/open-ground relationship where registration supports it | Practice nets away from camera, nearby building massing | Net alpha treatment only near view; ground texture farther away | Assigning G08 to an exact compass side; duplicating adjacent grounds symmetrically. Full side profile remains U |
| **6. Interior / pitch level** — G04/G07/P60/P62 | Two dominant tiers, pavilion exception, tier overhang, aisles/portals, roof underside/rim lamps, end sight-screen masses, field/barrier separation | Seats beyond useful pixel size; hidden concourse interiors | Seat pattern at distance, roof membrane variation, turf, neutral screen content | Real seat IDs, exact boundary distance, fixed dugout locations, event flags/stages, football features |

For the side views, coarse continuity of the verified ring is acceptable as **I**; detailed claims about unseen local features are not. Do not sign off exact side elevations merely because the model looks plausible.

### Blockout acceptance gate (for a later phase, not executed here)

1. Establish separate reference curves for field edge, lower tier, upper tier, inner roof edge, outer roof ring and podium perimeter. Solve cameras against G05 plus oblique views; do not trace perspective distortion as plan geometry.
2. Build two main seating masses with the correct inter-tier void and a separate pavilion sector. Any local extra floor band must not become a third full seating tier.
3. Include thin roof canopy, outer truss silhouette, diagonal column envelope, gold-screen pavilion mass and podium/approach level separation.
4. Include central wicket-area placeholder, end openings, site access ribbons and adjacent open-ground masses. Every unmeasured dimension remains explicitly approximate.
5. Compare all six cameras plus the P58 entrance detail independently. Silhouette, tier break, roof coverage and pavilion differentiation must agree across views before seats or small fittings are added.
6. Hold geographic alignment and unsupported side detail open until a lawful georeferenced source/current photograph is available. This brief supports a reference-led approximate blockout, not a survey-accurate 2026 digital twin.

## 4. Separate environment specification

### Extent: cinematic context, not an entire city

**R:** let D be the eventual reference-calibrated maximum outer roof diameter. Use a stadium-centered extent of roughly **1.5D radius** for the near site, **1.5D–3D** for mid context, and **3D–6D** only for far skyline/background where camera framing needs it. These are adjustable production/LOD zones, not measured site boundaries or real-world distance claims. The near zone includes the stadium itself and must expand locally to retain a visible entrance or practice ground. No precise metric diameter is assigned here.

Aerial cameras should retain a credible surrounding site, while pitch views need only the skyline that clears the roof. Crop/fade outside this controlled extent rather than invent a whole urban grid. Keep all geographic placements reference-relative until aligned to a verified map.

| Zone | Elements / evidence status | Representation | Limits |
|---|---|---|---|
| **NEAR** | Podium edge, ramps, stairs, undercroft, front driveway and planted islands — V existence, I unmeasured shapes | Detailed silhouette geometry; shared paving materials; explicit grade transitions | Essential identity; no arbitrary symmetric road ring |
| **NEAR** | Gate visible in P58 — V photographed form, U registered location | Separate gateway asset after location resolution | No cloned gate set or invented gate numbering |
| **NEAR** | Trees, low planting, site poles, fences — V presence, U exact inventories | Instanced vegetation and poles; simplified fence panels; selective close detail | Do not imply exact tree species or surveyed placement |
| **NEAR/MID** | Adjacent practice/open grounds — V photographed outlines, U current condition | Simplified ground surfaces and perimeter edges; nets only in evidenced locations | Bare 2020 areas are not proof of current turf state |
| **MID** | Access-road continuation, supported parking areas, nearby building footprints — V/I by visible source; parking identification partly U | Low-detail roads, curbs, building masses; instanced trees; sparse neutral vehicles only if warranted | No occupancy counts, private interiors or fictional street names |
| **MID/FAR** | Elevated linear infrastructure in G03 — V presence, U exact route/type | Simplified deck and repeated supports once aligned | Do not construct a detailed station from assumption |
| **FAR** | Urban roofscape and distant larger buildings — V presence, I silhouette | Coarse background masses, grouped vegetation, atmospheric fade | No full city, fabricated landmark towers or copied satellite texture |
| **OUT OF SCOPE** | River edge, future sports-enclave proposals, unseen development | Omit until relevant geographic/date evidence exists | “Nearby” does not imply visible from the stadium |

**R:** terrain should be a modest graded site surface, not a perfectly empty plane or dramatic hills. Use authored ground variation and source-supported hardscape/softscape boundaries. Ground materials must remain independent of stadium presentation lighting.

## 5. Web optimization priorities and asset segmentation

### HIGH priority — identity must survive all LODs

- Two-tier bowl section and exceptional pavilion configuration (V).
- Open annular membrane roof with thin edges, outer truss and diagonal support silhouette (V).
- Gold-toned undulating pavilion screens and open exposed remainder of facade (V).
- Orange lower seating and blue/orange/yellow upper pattern (V visible colors; I exact reconstruction).
- Large rounded cricket field, central wicket zone, end openings and roof-edge lighting (V).
- Elevated podium and credible immediate site context (V existence; I reconstructed extent).

### MEDIUM priority — realism in common camera views

- Radial aisles, portal recesses, selected railings and concourse depth.
- Roof radial bays, visible membrane shaping, repeated lamp housings.
- Major screens, glazing, movable player-shelter representations and sight screens.
- Source-matched gateway, paths, practice nets, nearby building masses and vegetation.

### LOW priority — simplify or omit

- Hidden rooms, bolts, seats' underside fasteners, small drainage fittings and unseen services.
- Distant fences, individual paving joints, background window frames and tree leaves.
- Temporary event branding, spectators, banners, ceremony stages and equipment.
- Exact fixture counts or repeated objects where not supported by evidence. Low priority is not permission to invent.

### Segmentation and real-time approach (R)

| Asset/component | Keep separate for | Efficient representation |
|---|---|---|
| Bowl/structure by spatial sector | Culling, inspection and future stand highlighting | Merge static compatible surfaces within sectors, not one enormous mesh or one object per step |
| Roof membrane, perimeter truss, diagonal supports | Material treatment, roof visibility and independent LOD | Shared bay geometry where justified; retain visible silhouette geometry |
| Pavilion mass and gold screen modules | Distinctive asymmetry and view-dependent detail | Reusable curved screen modules; simplify perforations with authored materials at distance |
| Lower and upper seating sectors | Color pattern, instancing and distance LOD | Linked seat prototypes in Blender; deliberate runtime instancing or baked sector batches after export validation |
| Pitch square, outfield, boundary and markings | Independent material resolution and neutral event state | Low-poly surfaces, original/licensed textures; no grass-blade field |
| Screens and roof fixtures | Emissive control and neutral presentation | Shared housing meshes/materials; avoid one real-time light per fixture |
| Gates, site props, terrain/roads, buildings, trees | Lazy loading, culling and environment toggle | Spatial batches, shared materials and instanced props |

- **Stadium export:** future `stadium.glb` contains structural podium, bowl, pavilion, roof, playing field and essential interior detail.
- **Environment export:** future `environment.glb` contains terrain beyond the structural podium, site roads/plazas, standalone gates, neighboring masses, practice grounds and vegetation. Avoid duplicating podium geometry in both.
- Use one shared origin and documented axes/units. Blender Z-up to glTF Y-up conversion must be tested later; both exports must preserve alignment.
- Keep lights/cameras for presentation separate from architectural meshes. Future DAY/SUNSET/NIGHT rigs are artistic setups, not verified venue photometry.
- Blender linked geometry alone does not guarantee browser instancing. Validate exporter support for GPU instancing or intentionally assemble runtime instances; otherwise use efficient static sector batches.
- Seat density is a visual approximation, never proof of capacity or real seating availability. Future interaction must say **DEMO SEATING** and keep synthetic IDs separate from factual stadium data.
- Use LOD for seats, truss secondary members, screen perforations, railings, trees and background masses. Do not remove defining diagonal supports or the pavilion screen silhouette at normal overview distances.
- Use shared opaque materials where possible; bound transparency for glass/netting. Preserve the roof's soft translucent appearance with a glTF-compatible approximation rather than a glass-like roof.
- Defer numerical triangle, texture and draw-call budgets until a representative silhouette-preserving scene is profiled on desktop and mobile. File size alone is not evidence of performance. Measure actual draw calls, memory, loading and frame timing later.

## 6. Recommended Blender collection structure

**R — proposed only; no collections created in this phase.** Collections are organizational labels, not claims about the building's real naming system.

```text
NMS_STADIUM
  NMS_STRUCTURE
    PODIUM
    CONCRETE_BOWL
    PAVILION
    EXTERIOR_CIRCULATION
  NMS_SEATING
    LOWER_TIER
    UPPER_TIER
    PAVILION_SEATING
    AISLES_AND_PORTALS
  NMS_ROOF
    MEMBRANE
    PERIMETER_RING
    DIAGONAL_COLUMNS
    SECONDARY_MEMBERS
  NMS_PITCH
    OUTFIELD
    WICKET_AREA
    BOUNDARY
    MARKINGS_AND_WICKETS
  NMS_DETAILS
    PAVILION_SCREENS
    GLAZING
    DISPLAY_SCREENS
    ROOF_LIGHT_FIXTURES
    SIGHT_SCREENS
    PLAYER_SHELTERS
NMS_ENVIRONMENT
  TERRAIN
  ROADS
  PLAZAS_AND_ACCESS
  GATES
  PARKING
  PRACTICE_GROUNDS
  BUILDINGS
  TREES
  SITE_PROPS
NMS_LIGHTING
  DAY
  SUNSET
  NIGHT
NMS_REFERENCE_CAMERAS
  AERIAL
  FRONT_PAVILION
  REAR
  LEFT
  RIGHT
  INTERIOR
```

The earlier requested `MIDDLE_TIER` collection must not force an invented third general-admission tier. Omit it or reserve an empty organizational placeholder until a specific pavilion sublevel is evidenced. Likewise `PARKING` can remain empty until actual parking areas are identified. Keep external reference photography outside export collections and outside publicly served folders; this phase stores links only in the repository.

## 7. Known unknowns, conflicts and next evidence to obtain

| Gap/conflict | Required handling / next evidence |
|---|---|
| Geographic north, actual pitch bearing and camera registration | Obtain a lawful north-referenced site plan or current map. Register pavilion, neighboring grounds and access roads as multiple control points; do not assume photo top is north |
| Existing repository coordinate mismatch | Phase 0's coordinates differ materially from the secondary overview's location. Neither is accepted as a survey; independently verify before using the app data for geographic placement |
| Complete left/right exterior coverage | Obtain additional dated oblique/ground-level side photographs. Current sources support broad ring continuity, not detailed four-sided elevations |
| Exact dimensions and levels | Seek published plans/sections or surveyed data. Otherwise label fitted proportions approximate; keep verified source dimensions separate |
| Roof bay counts, connections and panel cut patterns | Seek engineer detail imagery/drawings; retain only visible major structure until then |
| Capacity differences | S2 and S4 historically report 110,000; S1 distinguishes 132,000 extended capacity and also lists 110,000 in project facts; S3 says over 1.3 lakh; S5 lists 132,000. Record context/date, not an exact modeled seat count |
| 2020 versus 2021 completion/opening wording | S1/S2/S3 support 2020 opening/redevelopment; S5 uses completed/opened 2021. Do not collapse the different project/inauguration contexts into a new unsupported chronology |
| Current venue configuration | No exhaustive 2026 condition survey. Later architect photos corroborate persistent bowl/roof features but not every site detail |
| Seating/block map | No approved seat/row/block data. No precise real-seat interaction, prices, tickets or availability |
| Screens, gates, shelters and service rooms | Visible existence is stronger than exact coordinates/counts/functions. Seek corroboration before detailed placement |
| Parking and surrounding geography | Need current mapped areas and site access confirmation; do not turn all patterned paving into parking |
| Pavilion screen material and exact color | Shape/color family visible; alloy, coating and calibrated PBR properties unknown |

## 8. Licensing and source-use notes

- GCA pages state **All Rights Reserved**; Populous and Walter P Moore carry copyright notices. No blanket permission to republish their photographs, video frames or drawings was established.
- This document links to sources and records architectural observations. It does not authorize downloading images into `public/`, mapping photographs onto geometry, redistributing reference boards or incorporating logos/event artwork into the web experience.
- Temporary local image inspection is for this analysis only; no third-party image is shipped with this deliverable. A later reusable texture or public reference gallery needs an explicit license record, author credit, permitted uses and attribution terms.
- Do not assume a Wikimedia image is reusable merely because Wikipedia links it. Inspect each file's specific license and restrictions before any future asset use. No such asset was approved here.
- Public visibility does not settle rights to reproduce architecture, trademarks or artwork. Obtain appropriate legal/rights review before commercial release where needed; do not show a “Licensed 3D” badge without evidence.
- Original downloaded model provenance/license remains unknown. Do not redistribute, overwrite or rebrand it as a Narendra Modi reconstruction.

## 9. Existing assets that must not be reused as the production reconstruction

Based on Phase 0's inspected files and this phase's references:

1. `public/models/narendra-modi-stadium/stadium.glb` and its `.blend`: unsupported three-tier ring, simplified generic facade and plaza; not a reference-approved reconstruction. Preserve as prior work, but do not refine it on the assumption its proportions or architecture are correct.
2. `scripts/build_narendra_modi.py`: do not use its fixed three-tier, tunnel-count, seat-color or roof assumptions as an architectural specification. Source-supported roof-ring lighting does not validate the rest of that generator.
3. `public/models/procedural-stadium/` and `scripts/build_stadium.py`: generic bowl/tower approach is not the target stadium. Do not import its architectural shapes into the final model.
4. `Full stadium.blend`, `public/Full stadium.glb`, and `public/models/test-stadium/stadium.glb`: identity and license unverified; original scene has missing image references and exported meshes are large. Preserve originals untouched; do not treat them as present-day Narendra Modi geometry.
5. `src/data/stadiumArchitectures.ts`: its Narendra Modi three-tier/tower assumptions are not evidence. Existing React architecture remains reusable separately from these physical assumptions.

This does not prohibit later reuse of generic, rights-cleared technical utilities or properly validated common props. It prohibits passing unverified geometry off as this stadium.

## 10. Phase 1 outcome and handoff

**Confidently known:** round open cricket bowl with two main seating tiers; distinct pavilion; patterned seating; thin PTFE membrane roof, perimeter ring and diagonal steel columns independent of concrete stands; roof-edge lighting; elevated podium; gold-toned pavilion screens; nonempty urban/practice-ground surroundings.

**Visually inferred:** fitted proportions/curvature, detailed screen modulation, unmeasured sector geometry, broad terrain character and reference-relative site layout. These must remain labeled approximations.

**Still unknown:** survey geometry, exact geographic alignment, complete side elevations, real seating map, full screen/gate inventories, concealed spaces and current site condition.

**First future blockout:** field/wicket mass, two-tier bowl and void, separate pavilion sector, shaped roof opening/canopy, perimeter truss/diagonal envelope, gold-screen mass, podium/ramp levels, access ribbons and adjacent open grounds. No tiny seat detail, invented floodlight towers, or three-tier generic generator.

**Stop condition:** Phase 1 ends with this specification. No modeling, exports, source-asset alterations or website integration have been performed. Before claiming geographic or side-elevation accuracy in Phase 2, resolve the corresponding evidence gaps above.
