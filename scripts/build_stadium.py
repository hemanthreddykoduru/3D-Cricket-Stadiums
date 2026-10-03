# Run: /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/build_stadium.py
# Procedural cricket stadium (meters). Exports GLB + .blend. Edit constants to reshape.
import bpy, bmesh, math, os

A, B = 70.0, 62.0          # boundary half-axes (x long, y short)
N = 120                    # segments around the oval
OUT = os.path.join(os.path.dirname(bpy.data.filepath or __file__), "..", "public/models/procedural-stadium")
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public/models/procedural-stadium"))
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
col = bpy.data.collections.new("Stadium"); bpy.context.scene.collection.children.link(col)

def mat(name, rgb, rough=0.8, emit=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*rgb, 1); b.inputs["Emission Strength"].default_value = emit
    return m

M = {k: mat(k, *v) for k, v in {
    "grass": ((0.08, 0.35, 0.08),), "grass2": ((0.11, 0.42, 0.10),), "pitch": ((0.62, 0.52, 0.34),),
    "rope": ((1, 1, 1),), "concrete": ((0.55, 0.55, 0.57),), "seat_blue": ((0.05, 0.2, 0.7),),
    "seat_white": ((0.9, 0.9, 0.9),), "seat_orange": ((0.9, 0.4, 0.05),), "roof": ((0.85, 0.87, 0.9), 0.4),
    "steel": ((0.3, 0.3, 0.33), 0.4), "light": ((1, 1, 0.9), 0.5, 8), "board": ((0.02, 0.02, 0.05), 0.3, 1.5),
}.items()}
SEATS = [M["seat_blue"], M["seat_white"], M["seat_orange"]]

def obj(name, bm_or_mesh, mats):
    me = bpy.data.meshes.new(name)
    bm_or_mesh.to_mesh(me); bm_or_mesh.free()
    for m in mats: me.materials.append(m)
    o = bpy.data.objects.new(name, me); col.objects.link(o)
    for p in me.polygons: p.use_smooth = False
    return o

def pt(d, th):  # point on offset oval
    return ((A + d) * math.cos(th), (B + d) * math.sin(th))

def loft(name, profile, mats, mat_of=lambda i, s: 0, gaps=()):
    """Sweep profile [(d, z), ...] around the oval; gaps = list of (th0, th1) left open (tunnels)."""
    bm = bmesh.new()
    rings = []
    for i in range(N + 1):
        th = 2 * math.pi * i / N
        rings.append([bm.verts.new((*pt(d, th), z)) for d, z in profile])
    for i in range(N):
        th = 2 * math.pi * (i + .5) / N
        if any(a <= th <= b for a, b in gaps): continue
        sector = int(i / (N / 12))
        for j in range(len(profile) - 1):
            f = bm.faces.new((rings[i][j], rings[i + 1][j], rings[i + 1][j + 1], rings[i][j + 1]))
            f.material_index = mat_of(sector, j)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj(name, bm, mats)

def stairs(d0, z0, rows, run, rise):
    p = [(d0, z0)]
    for _ in range(rows):
        p += [(p[-1][0], p[-1][1] + rise), (p[-1][0] + run, p[-1][1] + rise)]
    return p

# --- ground: striped outfield (alternating radial rings), pitch, rope ---
bm = bmesh.new()
rings = 14
for r in range(rings):
    k0, k1 = r / rings, (r + 1) / rings
    vs0 = [bm.verts.new((A * k0 * math.cos(2 * math.pi * i / N), B * k0 * math.sin(2 * math.pi * i / N), 0)) for i in range(N)]
    vs1 = [bm.verts.new((A * k1 * math.cos(2 * math.pi * i / N), B * k1 * math.sin(2 * math.pi * i / N), 0)) for i in range(N)]
    for i in range(N):
        j = (i + 1) % N
        f = bm.faces.new((vs1[i], vs1[j], vs0[j], vs0[i])) if r else bm.faces.new((vs1[j], vs1[i], bm.verts.new((0, 0, 0))))
        f.material_index = r % 2
obj("Outfield", bm, [M["grass"], M["grass2"]])

bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
bmesh.ops.scale(bm, vec=(20.12, 3.05, 0.04), verts=bm.verts); bmesh.ops.translate(bm, vec=(0, 0, 0.02), verts=bm.verts)
obj("Pitch", bm, [M["pitch"]])

loft("Apron", [(0.25, -0.01), (5.5, -0.01)], [M["grass2"]])
loft("BoundaryRope", [(0.0, 0.0), (0.0, 0.08), (0.25, 0.08), (0.25, 0.0)], [M["rope"]])

# --- seating bowl: lower tier, concourse, upper tier, 4 tunnels at the axes ---
gaps = [(a - .05, a + .05) for a in (0, math.pi / 2, math.pi, 3 * math.pi / 2)]
seat_mat = lambda s, j: s % 3 if j % 2 == 1 else 0  # treads colored by sector, risers alternate
def tier(name, d0, z0, rows):
    p = stairs(d0, z0, rows, 0.85, 0.42)
    o = loft(name, p, SEATS + [M["concrete"]], lambda s, j: (s % 3) if j % 2 == 1 else 3, gaps)
    return p[-1]
d1, z1 = tier("LowerTier", 5, 0.5, 22)
loft("Concourse", [(d1, z1), (d1 + 4, z1), (d1 + 4, z1 - 0.6)], [M["concrete"]])
d2, z2 = tier("UpperTier", d1 + 6, z1 + 4, 24)

# --- outer facade + back wall ---
loft("Facade", [(d2 + 0.3, 0), (d2 + 0.3, z2 + 2)], [M["concrete"]])
loft("FacadeInner", [(d2 + 0.3, z2 + 2), (d2 + 0.3, 0)], [M["concrete"]])

# --- roof canopy (cantilever) + columns ---
zr = z2 + 8
loft("Roof", [(d1 + 8, zr - 4), (d2 + 3, zr), (d2 + 3, zr + .5), (d1 + 8, zr - 3.5)], [M["roof"]])
bm = bmesh.new()
for i in range(0, N, 5):
    th = 2 * math.pi * i / N; x, y = pt(d2 + .6, th)
    bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=.5, radius2=.35, depth=zr - 1,
                          matrix=__import__("mathutils").Matrix.Translation((x, y, (zr - 1) / 2)))
obj("Columns", bm, [M["steel"]])

# --- 6 floodlight towers ---
from mathutils import Matrix, Vector
bm_t, bm_l = bmesh.new(), bmesh.new()
for k in range(6):
    th = math.pi / 6 + k * math.pi / 3; x, y = pt(d2 + 8, th); h = 55
    bmesh.ops.create_cone(bm_t, cap_ends=True, segments=10, radius1=1.0, radius2=.5, depth=h,
                          matrix=Matrix.Translation((x, y, h / 2)))
    for r in range(3):
        for c in range(6):
            m = Matrix.Translation((x, y, h + 1 + r * 1.6)) @ Matrix.Rotation(th + math.pi, 4, 'Z') @ Matrix.Translation((0, (c - 2.5) * 1.5, 0))
            bmesh.ops.create_cube(bm_l, size=1, matrix=m @ Matrix.Diagonal((.3, 1.2, 1.2, 1)))
obj("FloodlightTowers", bm_t, [M["steel"]]); obj("FloodlightLamps", bm_l, [M["light"]])

# --- scoreboards + sight screens ---
bm = bmesh.new()
for sx in (-1, 1):
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((sx * (A + 3), 0, 14)) @ Matrix.Diagonal((.6, 24, 10, 1)))
obj("Scoreboards", bm, [M["board"]])
bm = bmesh.new()
for sx in (-1, 1):
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((sx * (A - 3), 0, 4)) @ Matrix.Diagonal((.4, 20, 8, 1)))
obj("SightScreens", bm, [M["seat_white"]])

# --- lighting, sun ---
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", 'SUN')); sun.data.energy = 4
sun.rotation_euler = (math.radians(50), 0, math.radians(30)); col.objects.link(sun)

for n in ("Outfield","Apron"):
    b=bmesh.new(); b.from_mesh(bpy.data.objects[n].data); bmesh.ops.reverse_faces(b, faces=[f for f in b.faces if f.normal.z<0]); b.to_mesh(bpy.data.objects[n].data); b.free()
    ns=[p.normal.z for p in bpy.data.objects[n].data.polygons]; print("NORMALZ",n,min(ns),max(ns))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "stadium.blend"))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "stadium.glb"), export_format='GLB', export_apply=True)
print("DONE", OUT)
