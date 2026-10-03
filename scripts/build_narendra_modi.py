# Run: /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/build_narendra_modi.py
# Procedural Narendra Modi Stadium, Ahmedabad (meters): 3-tier near-circular bowl with a suite band,
# one continuous roof ring carrying an LED floodlight ring (no towers), vertical-fin facade, 8 tunnels.
# Exports public/models/narendra-modi-stadium/{stadium.glb,stadium.blend}. Stands are separate named meshes.
import bpy, bmesh, math, os
from mathutils import Matrix

A, B, N = 74.0, 70.0, 144
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public/models/narendra-modi-stadium"))
os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.data.collections.new("NarendraModiStadium"); bpy.context.scene.collection.children.link(col)

def mat(name, rgb, rough=0.8, emit=0, alpha=1):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.diffuse_color = (*rgb, alpha)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = rough
    b.inputs["Alpha"].default_value = alpha
    if emit: b.inputs["Emission Color"].default_value = (*rgb, 1); b.inputs["Emission Strength"].default_value = emit
    return m
M = {k: mat(k, *v) for k, v in {
    "grass": ((0.07, 0.33, 0.07),), "grass2": ((0.10, 0.40, 0.09),), "pitch": ((0.62, 0.52, 0.34),),
    "white": ((0.92, 0.92, 0.92),), "concrete": ((0.6, 0.6, 0.62),), "asphalt": ((0.12, 0.12, 0.13),),
    "blue": ((0.04, 0.18, 0.65),), "orange": ((0.95, 0.42, 0.04),), "roof": ((0.93, 0.94, 0.96), 0.35),
    "steel": ((0.35, 0.36, 0.4), 0.4), "led": ((1, 1, 0.92), 0.5, 10), "glass": ((0.5, 0.7, 0.85), 0.1, 0, 0.35),
    "board": ((0.02, 0.02, 0.05), 0.3, 1.5),
}.items()}
SEATS = [M["blue"], M["white"], M["orange"]]

def obj(name, bm, mats):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new(name, me); col.objects.link(o); return o
def pt(d, th): return ((A + d) * math.cos(th), (B + d) * math.sin(th))
TUNNELS = [(k * math.pi / 4 - .04, k * math.pi / 4 + .04) for k in range(8)]
STANDS = [("East", -math.pi / 4, math.pi / 4), ("North", math.pi / 4, 3 * math.pi / 4),
          ("West", 3 * math.pi / 4, 5 * math.pi / 4), ("South", 5 * math.pi / 4, 7 * math.pi / 4)]

def loft(name, profile, mats, mat_of=lambda s, j: 0, gaps=(), span=(0, 2 * math.pi)):
    bm = bmesh.new(); rings = {}
    for i in range(N + 1):
        th = 2 * math.pi * i / N
        rings[i] = [bm.verts.new((*pt(d, th), z)) for d, z in profile]
    for i in range(N):
        th = 2 * math.pi * (i + .5) / N
        if not span[0] <= th < span[1] or any(a <= th <= b for a, b in gaps): continue
        for j in range(len(profile) - 1):
            f = bm.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][j + 1], rings[i][j + 1]))
            f.material_index = mat_of(int(i / (N / 24)), j)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj(name, bm, mats)

def stairs(d0, z0, rows, run, rise):
    p = [(d0, z0)]
    for _ in range(rows): p += [(p[-1][0], p[-1][1] + rise), (p[-1][0] + run, p[-1][1] + rise)]
    return p

def flat_up(o):  # point ground faces up
    b = bmesh.new(); b.from_mesh(o.data)
    bmesh.ops.reverse_faces(b, faces=[f for f in b.faces if f.normal.z < 0]); b.to_mesh(o.data); b.free()

# ---- field ----
bm = bmesh.new(); R = 16
for r in range(R):
    k0, k1 = r / R, (r + 1) / R
    v0 = [bm.verts.new((A * k0 * math.cos(2 * math.pi * i / N), B * k0 * math.sin(2 * math.pi * i / N), 0)) for i in range(N)]
    v1 = [bm.verts.new((A * k1 * math.cos(2 * math.pi * i / N), B * k1 * math.sin(2 * math.pi * i / N), 0)) for i in range(N)]
    c = bm.verts.new((0, 0, 0))
    for i in range(N):
        j = (i + 1) % N
        f = bm.faces.new((v1[i], v1[j], v0[j], v0[i])) if r else bm.faces.new((v1[i], v1[j], c))
        f.material_index = r % 2
flat_up(obj("Outfield", bm, [M["grass"], M["grass2"]]))
flat_up(loft("Apron", [(0.3, -0.01), (6, -0.01)], [M["grass2"]]))
loft("BoundaryRope", [(0, 0), (0, .08), (.3, .08), (.3, 0)], [M["white"]])
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((0, 0, .02)) @ Matrix.Diagonal((20.12, 3.05, .04, 1)))
obj("Pitch", bm, [M["pitch"]])
bm = bmesh.new()  # creases + 30-yard circle + stumps
for sx in (-1, 1):
    for x, w, y, h in ((sx * 9.0, .05, 0, 3.05), (sx * 10.06, .05, 0, 3.05)):
        bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((x, y, .05)) @ Matrix.Diagonal((w, h, .02, 1)))
    for dy in (-1.3, 0, 1.3):
        bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=.02, radius2=.02, depth=.71,
                              matrix=Matrix.Translation((sx * 10.06, dy * .17, .38)))
for i in range(72):
    th = 2 * math.pi * i / 72
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((27.4 * math.cos(th), 27.4 * math.sin(th), .03)) @
                          Matrix.Rotation(th + math.pi / 2, 4, 'Z') @ Matrix.Diagonal((1.2, .06, .02, 1)))
obj("FieldMarkings", bm, [M["white"]])

# ---- bowl: lower tier / concourse / suite band / middle tier / concourse / upper tier ----
def tier(name, d0, z0, rows, rise, span, run=0.85):
    p = stairs(d0, z0, rows, run, rise)
    loft(name, p, SEATS + [M["concrete"]], lambda s, j: s % 3 if j % 2 else 3, TUNNELS, span); return p[-1]
tops = {}
for st, t0, t1 in STANDS:
    span = (t0 % (2 * math.pi), (t1 - 1e-6) % (2 * math.pi) or 2 * math.pi)
    spans = [span] if span[0] < span[1] else [(0, span[1]), (span[0], 2 * math.pi)]
    for k, sp in enumerate(spans):
        s = "" if k == 0 else "_b"
        d1, z1 = tier(f"{st}Stand_Lower{s}", 6, .6, 20, .42, sp)
        loft(f"{st}Stand_Concourse1{s}", [(d1, z1), (d1 + 4, z1), (d1 + 4, z1 - .6)], [M["concrete"]], span=sp)
        # suite band: glazed boxes (front glass + roof slab) between lower and middle tier
        loft(f"{st}Stand_Suites{s}", [(d1 + 4, z1), (d1 + 4, z1 + 4.5), (d1 + 9, z1 + 4.5)], [M["glass"], M["concrete"]],
             lambda sc, j: j, TUNNELS, sp)
        d2, z2 = tier(f"{st}Stand_Middle{s}", d1 + 9, z1 + 4.5, 14, .45, sp)
        loft(f"{st}Stand_Concourse2{s}", [(d2, z2), (d2 + 4, z2), (d2 + 4, z2 - .6)], [M["concrete"]], span=sp)
        d3, z3 = tier(f"{st}Stand_Upper{s}", d2 + 6, z2 + 3.5, 22, .52, sp)
        tops = (d3, z3)
d3, z3 = tops

# ---- facade: back wall + vertical fins ----
loft("FacadeWall", [(d3 + .4, 0), (d3 + .4, z3 + 3)], [M["concrete"]])
bm = bmesh.new()
for i in range(0, N, 2):
    th = 2 * math.pi * i / N; x, y = pt(d3 + 1.2, th)
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((x, y, (z3 + 5) / 2)) @ Matrix.Rotation(th, 4, 'Z') @ Matrix.Diagonal((.5, 1.2, z3 + 5, 1)))
obj("FacadeFins", bm, [M["white"]])

# ---- roof: one continuous cantilever ring, underside trusses, LED floodlight ring ----
zr = z3 + 9
loft("Roof", [(d2 + 4, zr - 5), (d3 + 4, zr), (d3 + 4, zr + .6), (d2 + 4, zr - 4.4)], [M["roof"]])
bm = bmesh.new()
for i in range(0, N, 3):
    th = 2 * math.pi * i / N
    x0, y0 = pt(d2 + 4, th); x1, y1 = pt(d3 + 3.6, th)
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, zr - 3.3)) @
                          Matrix.Rotation(th, 4, 'Z') @ Matrix.Diagonal((math.hypot(x1 - x0, y1 - y0) * .9, .5, .5, 1)) @ Matrix.Rotation(0, 4, 'Z'))
obj("RoofTrusses", bm, [M["steel"]])
bm = bmesh.new()
for i in range(N):
    th = 2 * math.pi * (i + .5) / N; x, y = pt(d2 + 5, th)
    for k in range(2):
        bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((x, y, zr - 5.4 - k * 1.1)) @ Matrix.Rotation(th, 4, 'Z') @ Matrix.Diagonal((.6, 1.6, .5, 1)))
obj("LEDFloodlightRing", bm, [M["led"]])

# ---- pavilion/clubhouse (west), scoreboards, tunnels' ground, outer plaza ----
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((-(A + 4), 0, 5)) @ Matrix.Diagonal((8, 34, 10, 1)))
obj("Clubhouse", bm, [M["glass"]])
bm = bmesh.new()
for sy in (-1, 1):
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((0, sy * (B + 4), 16)) @ Matrix.Diagonal((26, .6, 9, 1)))
obj("Scoreboards", bm, [M["board"]])
loft("Plaza", [(d3 + 1, -.05), (d3 + 30, -.05)], [M["asphalt"]])  # ring road
flat_up(bpy.data.objects["Plaza"])

sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN')); sun.data.energy = 4
sun.rotation_euler = (math.radians(50), 0, math.radians(30)); col.objects.link(sun)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "stadium.blend"))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "stadium.glb"), export_format='GLB', export_apply=True)
print("DONE", OUT, "tris", sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'))
