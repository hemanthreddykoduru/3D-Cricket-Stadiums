"""Reference-led pavilion study; unitless approximate geometry, front at -Y.

G03/G08 inform the gold envelope; G05/G06/G09 inform the local bowl
interruption and interior bands. Counts, levels and curvature are artistic
approximations, not a surveyed inventory or a third general-admission tier.
Importing this module creates no Blender data.
"""

from math import cos, pi, radians, sin


def _sweep(collection, material, name, section_at, reference_ids, smooth=False):
    """Sweep a counterclockwise radial/Z section over the pavilion sector."""
    import bpy

    segments = 64
    vertices = []
    for i in range(segments + 1):
        t = i / segments
        theta = radians(245.0 + 50.0 * t)
        # Sections provide ellipse X/Y radii and Z, not real-world dimensions.
        section = section_at(t)
        vertices.extend((rx * cos(theta), ry * sin(theta), z)
                        for rx, ry, z in section)
    width = len(section)
    faces = []
    for i in range(segments):
        a, b = i * width, (i + 1) * width
        for j in range(width):
            k = (j + 1) % width
            faces.append((a + j, b + j, b + k, a + k))
    faces.append(tuple(range(width)))
    faces.append(tuple(segments * width + j for j in reversed(range(width))))

    mesh = bpy.data.meshes.new(name + "_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    mesh.materials.append(material)
    if smooth:
        for polygon in mesh.polygons[:-2]:
            polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    obj["evidence_class"] = "VISUALLY INFERRED"
    obj["reference_ids"] = reference_ids
    obj["note"] = (
        "Approximate unitless proportions and module count; not real inventory. "
        "Reference-relative front is -Y, not verified geographic orientation."
    )
    return obj


def _band(inner, outer, bottom, top):
    """Constant closed section, with outward winding when swept."""
    return lambda t: (
        (*inner, bottom), (*outer, bottom),
        (*outer, top), (*inner, top),
    )


def _screen_section(t, layer):
    """Broad staggered lens rhythm; deliberately omit perforation/fixings."""
    phase = 2.0 * pi * (5.0 * t + 0.5 * (layer % 2))
    swell = 0.5 - 0.5 * cos(phase)
    radius = 100.8 + 2.5 * swell
    half_height = 0.3 + 1.8 * swell
    center_z = 17.0 + 5.0 * layer + 0.3 * sin(phase)
    # A closed oval cross-section keeps the envelope smooth and editable.
    return tuple(
        (radius + 0.6 * cos(a), radius + 3.0 + 0.6 * cos(a),
         center_z + half_height * sin(a))
        for a in (2.0 * pi * j / 12 for j in range(12))
    )


def build_pavilion(collection, materials):
    """Return meshes linked only to collection using concrete/gold/recess.

    The 245–295 degree sector fits the omitted upper bowl. The shell and
    local field-facing fascia/recess bands occupy Z14–35; four separate
    undulating outer screens occupy approximately Z15–34 and radius100–104.
    Materials are caller-owned plain blockout materials and are not modified.
    No operators, scene setup, seating, fixtures, or assets are created.
    """
    concrete, gold, recess = (materials[key]
                              for key in ("concrete", "gold", "recess"))
    objects = [
        _sweep(collection, concrete, "NMS_Pavilion_Shell",
               _band((82.0, 86.0), (99.0, 103.0), 14.0, 35.0),
               "G03,G05,G06,G08")
    ]

    # Local projecting slab/fascia edges frame three broad dark recesses.
    # These bands do not extend around the stadium or imply known room uses.
    for index, (bottom, top) in enumerate(
        ((14.0, 15.5), (20.3, 21.5), (26.3, 27.5), (33.5, 35.0)), 1
    ):
        objects.append(_sweep(
            collection, concrete, f"NMS_Pavilion_Interior_Fascia_{index:02d}",
            _band((80.0, 84.0), (82.0, 86.0), bottom, top), "G06,G09",
        ))
    for index, (bottom, top) in enumerate(
        ((15.5, 20.3), (21.5, 26.3), (27.5, 33.5)), 1
    ):
        objects.append(_sweep(
            collection, recess, f"NMS_Pavilion_Interior_Recess_{index:02d}",
            _band((81.5, 85.5), (82.0, 86.0), bottom, top), "G06,G09",
        ))

    # Dark exterior lower band is independent of the gold screen envelope.
    objects.append(_sweep(
        collection, recess, "NMS_Pavilion_Exterior_Lower_Recess",
        _band((99.0, 103.0), (99.15, 103.15), 14.5, 16.0), "G03,G08",
    ))
    for layer in range(4):
        objects.append(_sweep(
            collection, gold, f"NMS_Pavilion_Gold_Screen_Layer_{layer + 1:02d}",
            lambda t, layer=layer: _screen_section(t, layer),
            "G03,G08,G10", smooth=True,
        ))
    return objects
