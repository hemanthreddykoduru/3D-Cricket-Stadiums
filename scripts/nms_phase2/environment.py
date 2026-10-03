"""Reference-relative NMS environment, in normalized study units, not metres.

Origin and Z-up match the stadium; the pavilion faces -Y. +X is the
practice-ground side in G03/G05, not an asserted geographic bearing.
Call build_environment(parent_collection, materials) inside Blender. Only
that call creates scene data; it returns the created mesh objects. Supplied
materials must contain ground, site, recess and context. FAR is deliberately
empty: the mid-context envelope already provides a restrained horizon.
"""

from math import cos, hypot, pi, sin


def _rounded_zone(cx, cy, rx, ry, count=32):
    """Low-poly fitted oval; not a trace or a surveyed field boundary."""
    return [
        (cx + rx * cos(2 * pi * i / count),
         cy + ry * sin(2 * pi * i / count))
        for i in range(count)
    ]


def build_environment(collection, materials):
    """Create editable NEAR/MID/FAR child collections and return mesh objects.

    Ground is at -1, all near-site overlays remain below the pitch at 0,
    and access/practice footprints stay outside the podium's radius of 132.
    The caller owns scene units, lighting, export and repeated-build cleanup.
    """
    import bpy

    # Resolve the contract before creating any scene data.
    palette = {key: materials[key] for key in ("ground", "site", "recess", "context")}
    zones = {}
    for name in ("NEAR", "MID", "FAR"):
        zone = bpy.data.collections.new(name)
        collection.children.link(zone)
        zones[name] = zone
    objects = []
    common_note = (
        "Normalized study units, not measured metres; reference-relative axes, "
        "not cardinal directions. Coarse interpretation of 2020 photographs; "
        "extent, heights, outlines and present-day condition are unverified. "
    )

    def mesh_object(name, zone, vertices, faces, material, note):
        mesh = bpy.data.meshes.new(name + "_MESH")
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        zones[zone].objects.link(obj)
        obj.data.materials.append(palette[material])
        obj["evidence_class"] = "VISUALLY INFERRED"
        obj["reference_ids"] = "G03,G05,G06,G10"
        obj["approximation_notes"] = common_note + note
        obj["environment_zone"] = zone
        objects.append(obj)
        return obj

    def patch(name, zone, outline, bottom, top, material, note):
        # Consistent winding also keeps the shallow envelope sides outward.
        area = sum(
            x * outline[(i + 1) % len(outline)][1]
            - y * outline[(i + 1) % len(outline)][0]
            for i, (x, y) in enumerate(outline)
        )
        outline = list(outline if area > 0 else reversed(outline))
        count = len(outline)
        vertices = [(x, y, top) for x, y in outline]
        faces = [tuple(range(count))]
        if bottom < top:
            vertices += [(x, y, bottom) for x, y in outline]
            faces.append(tuple(reversed(range(count, count * 2))))
            faces.extend(
                (i, i + count, (i + 1) % count + count, (i + 1) % count)
                for i in range(count)
            )
        return mesh_object(name, zone, vertices, faces, material, note)

    def ribbon(name, points, width):
        vertices = []
        for i, (x, y) in enumerate(points):
            before = points[max(i - 1, 0)]
            after = points[min(i + 1, len(points) - 1)]
            dx, dy = after[0] - before[0], after[1] - before[1]
            scale = width / (2 * hypot(dx, dy))
            vertices.extend(((x - dy * scale, y + dx * scale, -0.82),
                             (x + dy * scale, y - dx * scale, -0.82)))
        faces = [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2)
                 for i in range(len(points) - 1)]
        return mesh_object(
            name, "NEAR", vertices, faces, "recess",
            "Open circulation ribbon outside the podium; no closed road ring, "
            "lane count, traffic direction or surveyed road alignment asserted.",
        )

    patch(
        "ENV_Ground_Pad", "NEAR",
        [(-365, -235), (-120, -265), (245, -245), (330, -110),
         (345, 250), (225, 365), (-185, 375), (-370, 235)],
        -1, -1, "ground",
        "Low-relief presentation crop, not a cadastral boundary. Surface beneath "
        "the entire stadium is below pitch level; structural podium is separate.",
    )
    for name, cx, cy, rx, ry in (
        ("ENV_Practice_Open_Ground_Rear", 170, 30, 30, 39),
        ("ENV_Practice_Open_Ground_Front", 160, -65, 27, 30),
    ):
        patch(
            name, "NEAR", _rounded_zone(cx, cy, rx, ry),
            -1, -0.9, "site",
            "Adjacent rounded open/practice-ground zone on +X, fitted clear of "
            "the podium. Neutral surface does not assert current turf, nets, "
            "wickets or one-to-one correspondence with a facility inventory.",
        )

    ribbon("ENV_Pavilion_Forecourt_Access", [
        (-166, -76), (-152, -112), (-126, -140), (-88, -158),
        (-38, -170), (15, -172), (66, -163), (105, -143),
        (128, -123), (156, -117), (188, -127),
    ], 9)
    ribbon("ENV_Practice_Side_Access", [
        (188, -159), (211, -119), (217, -76), (217, -27),
        (216, 28), (209, 81), (181, 117), (153, 141),
    ], 7)
    ribbon("ENV_Left_Site_Access", [
        (-166, -76), (-170, -26), (-171, 31), (-165, 86),
        (-147, 128), (-118, 158), (-88, 180),
    ], 7)

    # Broad contiguous swaths only: these are NOT individual building blocks.
    for name, outline, height in (
        ("ENV_Urban_Envelope_Left", [
            (-337, -154), (-222, -145), (-193, -74), (-193, 55),
            (-204, 159), (-259, 199), (-345, 149),
        ], 6),
        ("ENV_Urban_Envelope_Rear", [
            (-225, 192), (-156, 171), (-69, 189), (18, 182),
            (110, 198), (151, 219), (119, 235), (-188, 229),
        ], 5),
        ("ENV_Urban_Envelope_Distant_Rear", [
            (-323, 276), (-172, 275), (-12, 289), (146, 299),
            (242, 324), (207, 347), (-164, 350), (-312, 329),
        ], 8),
    ):
        patch(
            name, "MID", outline, -1, height, "context",
            "Abstract contiguous urban-fabric envelope on -X / farther +Y. "
            "Flat aggregate roofscape is not an individual building, parcel "
            "footprint, real building height or detailed skyline reconstruction.",
        )

    patch(
        "ENV_Elevated_Transport_Envelope", "MID",
        [(-327, 231), (269, 281), (268, 288), (-328, 238)],
        7, 9, "context",
        "Coarse elevated linear transport deck behind +Y. Alignment, height, "
        "type and termini unresolved; piers and stations deliberately unmodeled. "
        "The object represents only the broad visible linear silhouette in G03.",
    )
    return objects
