"""Material-only Motera seat colour correction.

Run the pure-Python check without Blender with::

    python scripts/nms_phase2/match_motera_seat_colours.py --self-test

Run this file from Blender to copy the shared moulded-seat material, build the
instance-origin colour network, and bind only source-material slot 0.
"""

import math
import sys


# Motif and seat-layout constants.  These are intentionally plain Python so the
# same values drive classification tests and the Blender node graph.
CHEVRON_COUNT = 12
PHASE_TURNS = 0.0
UPPER_Z_CUTOFF = 17.0
UPPER_Z0 = 19.835
UPPER_DZ = 0.8
UPPER_RX0 = 76.6132
UPPER_RY0 = 81.5818
UPPER_RX_SLOPE = 1.25
UPPER_RY_SLOPE = 1.1875
MIN_ROW = -5.0
MAX_ROW = 18.5
INNER_GOLDEN_HALF_WIDTH = 2.8
OUTER_ORANGE_HALF_WIDTH = 4.4

ORANGE_HEX = "#ED4D10"
BLUE_HEX = "#153B96"
GOLD_HEX = "#FFC51A"


def _srgb_channel_to_linear(channel):
    """Convert one 0..1 sRGB channel to a linear-light channel."""
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def _hex_to_linear_rgba(value):
    value = value.lstrip("#")
    if len(value) != 6:
        raise ValueError("expected a six-digit RGB hex swatch")
    srgb = [int(value[index:index + 2], 16) / 255.0
            for index in (0, 2, 4)]
    return tuple(_srgb_channel_to_linear(channel) for channel in srgb) + (1.0,)


# Shader default colours are linear RGBA, not raw display/sRGB values.
ORANGE = _hex_to_linear_rgba(ORANGE_HEX)
BLUE = _hex_to_linear_rgba(BLUE_HEX)
GOLD = _hex_to_linear_rgba(GOLD_HEX)


def classify_seat(x, y, z):
    """Return ``orange``, ``gold`` or ``blue`` for one instance origin."""
    if z <= UPPER_Z_CUTOFF:
        return "orange"

    row = round((z - UPPER_Z0) / UPPER_DZ)
    rx = UPPER_RX0 + UPPER_RX_SLOPE * (z - UPPER_Z0)
    ry = UPPER_RY0 + UPPER_RY_SLOPE * (z - UPPER_Z0)
    theta = math.atan2(y / ry, x / rx)
    normalized_turns = theta / math.tau
    cycle_fraction = ((normalized_turns - PHASE_TURNS) * CHEVRON_COUNT) % 1.0
    triangle = 2.0 * abs(cycle_fraction - 0.5)
    centre_row = MIN_ROW + triangle * (MAX_ROW - MIN_ROW)
    distance = abs(row - centre_row)

    if distance <= INNER_GOLDEN_HALF_WIDTH:
        return "gold"
    if distance <= OUTER_ORANGE_HALF_WIDTH:
        return "orange"
    return "blue"


def _upper_point(row, theta):
    z = UPPER_Z0 + UPPER_DZ * row
    rx = UPPER_RX0 + UPPER_RX_SLOPE * (z - UPPER_Z0)
    ry = UPPER_RY0 + UPPER_RY_SLOPE * (z - UPPER_Z0)
    return rx * math.cos(theta), ry * math.sin(theta), z


def _self_test():
    """Small regression check for the shared classification formula."""
    for x, y, z in ((0.0, 0.0, 0.0), (40.0, -20.0, 1.37875),
                    (-90.0, 30.0, 17.0)):
        assert classify_seat(x, y, z) == "orange"

    # The phase seam is a peak, so both sides have the same colour.
    seam_left = _upper_point(18, -1.0e-9)
    seam_right = _upper_point(18, 1.0e-9)
    assert classify_seat(*seam_left) == "gold"
    assert classify_seat(*seam_right) == "gold"

    # One chevron period around the ellipse must repeat exactly.
    sample = _upper_point(10, 0.123)
    repeated = _upper_point(10, 0.123 + math.tau / CHEVRON_COUNT)
    assert classify_seat(*sample) == classify_seat(*repeated)

    # Explicit upper-bowl colour samples: peak/gold, edge/orange, valley/blue.
    assert classify_seat(*_upper_point(18, 0.0)) == "gold"
    assert classify_seat(*_upper_point(10, math.pi / (2.0 * CHEVRON_COUNT))) == "orange"
    assert classify_seat(*_upper_point(0, math.pi / CHEVRON_COUNT)) == "blue"
    print("match_motera_seat_colours: self-test passed")


TARGET_MATERIAL = "MAT_NMS_Seats_MoteraReference"
SOURCE_MATERIAL = "HF27_Molded_Blue"
SOURCE_OBJECTS = tuple("NMS_OPT_LOD{}_SOURCE".format(index) for index in range(3))
HARDWARE_SLOTS = ("HF27_Galvanized", "HF27_Mounting_Hardware")
NODE_TAG = "nms_motera_colour_node_v1"


def _enum_identifier(node, property_name, wanted):
    """Return a requested enum id only after checking the live RNA enum."""
    enum_items = node.bl_rna.properties[property_name].enum_items
    identifiers = {item.identifier for item in enum_items}
    if wanted not in identifiers:
        raise RuntimeError(
            "{} does not support {}={!r}; available={!r}".format(
                type(node).__name__, property_name, wanted, sorted(identifiers)
            )
        )
    return wanted


def _tagged_node(nodes, node_type, label, location):
    node = nodes.new(type=node_type)
    node.label = label
    node.location = location
    node[NODE_TAG] = True
    return node


def _math_node(nodes, operation, label, location, first=None, second=None):
    node = _tagged_node(nodes, "ShaderNodeMath", label, location)
    node.operation = _enum_identifier(node, "operation", operation)
    if first is not None:
        node.inputs[0].default_value = first
    if second is not None:
        node.inputs[1].default_value = second
    return node


def _rgb_node(nodes, label, colour, location):
    node = _tagged_node(nodes, "ShaderNodeRGB", label, location)
    node.outputs[0].default_value = colour
    return node


def _mix_node(nodes, label, location):
    node = _tagged_node(nodes, "ShaderNodeMixRGB", label, location)
    node.blend_type = _enum_identifier(node, "blend_type", "MIX")
    return node


def _base_colour_socket(principled):
    # The identifier is stable across Blender UI translations; the index 0
    # fallback covers older builds whose RNA did not expose identifiers.
    for socket in principled.inputs:
        if socket.identifier == "Base Color":
            return socket
    for socket in principled.inputs:
        if socket.name == "Base Color":
            return socket
    return principled.inputs[0]


def _build_colour_network(material):
    """Replace only this script's colour network and keep roughness untouched."""
    tree = material.node_tree
    nodes, links = tree.nodes, tree.links
    principled = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
    if principled is None:
        raise RuntimeError("{} has no Principled BSDF node".format(material.name))

    base_colour = _base_colour_socket(principled)
    for node in list(nodes):
        if node.get(NODE_TAG):
            nodes.remove(node)
    for link in list(links):
        if link.to_node == principled and link.to_socket == base_colour:
            links.remove(link)

    def connect(output, input_socket):
        links.new(output, input_socket)

    object_info = _tagged_node(nodes, "ShaderNodeObjectInfo", "Motera instance origin", (-1050, 80))
    separate = _tagged_node(nodes, "ShaderNodeSeparateXYZ", "Motera XYZ", (-850, 80))
    connect(object_info.outputs[0], separate.inputs[0])

    z_delta = _math_node(nodes, "SUBTRACT", "z - upper z0", (-650, 220), second=UPPER_Z0)
    connect(separate.outputs[2], z_delta.inputs[0])
    row_div = _math_node(nodes, "DIVIDE", "upper row value", (-470, 220), second=UPPER_DZ)
    connect(z_delta.outputs[0], row_div.inputs[0])
    row = _math_node(nodes, "ROUND", "seat row", (-290, 220))
    connect(row_div.outputs[0], row.inputs[0])

    upper = _math_node(nodes, "GREATER_THAN", "upper tier mask", (-290, -80), second=UPPER_Z_CUTOFF)
    connect(separate.outputs[2], upper.inputs[0])

    rx_mul = _math_node(nodes, "MULTIPLY", "rx slope", (-470, 20), second=UPPER_RX_SLOPE)
    connect(z_delta.outputs[0], rx_mul.inputs[0])
    rx = _math_node(nodes, "ADD", "ellipse rx", (-290, 20), second=UPPER_RX0)
    connect(rx_mul.outputs[0], rx.inputs[0])
    ry_mul = _math_node(nodes, "MULTIPLY", "ry slope", (-470, -180), second=UPPER_RY_SLOPE)
    connect(z_delta.outputs[0], ry_mul.inputs[0])
    ry = _math_node(nodes, "ADD", "ellipse ry", (-290, -180), second=UPPER_RY0)
    connect(ry_mul.outputs[0], ry.inputs[0])

    x_over_rx = _math_node(nodes, "DIVIDE", "x / rx", (-80, -20))
    connect(separate.outputs[0], x_over_rx.inputs[0])
    connect(rx.outputs[0], x_over_rx.inputs[1])
    y_over_ry = _math_node(nodes, "DIVIDE", "y / ry", (-80, -180))
    connect(separate.outputs[1], y_over_ry.inputs[0])
    connect(ry.outputs[0], y_over_ry.inputs[1])

    theta = _math_node(nodes, "ARCTAN2", "atan2(y / ry, x / rx)", (120, -80))
    connect(y_over_ry.outputs[0], theta.inputs[0])
    connect(x_over_rx.outputs[0], theta.inputs[1])
    turns = _math_node(nodes, "DIVIDE", "normalised turns", (300, -80), second=math.tau)
    connect(theta.outputs[0], turns.inputs[0])
    phase = _math_node(nodes, "SUBTRACT", "phase turns", (480, -80), second=PHASE_TURNS)
    connect(turns.outputs[0], phase.inputs[0])
    cycle = _math_node(nodes, "MULTIPLY", "chevron cycles", (660, -80), second=CHEVRON_COUNT)
    connect(phase.outputs[0], cycle.inputs[0])
    fraction = _math_node(nodes, "FLOORED_MODULO", "positive cycle fraction", (840, -80), second=1.0)
    connect(cycle.outputs[0], fraction.inputs[0])
    triangle_delta = _math_node(nodes, "SUBTRACT", "fraction - half", (1020, -80), second=0.5)
    connect(fraction.outputs[0], triangle_delta.inputs[0])
    triangle_abs = _math_node(nodes, "ABSOLUTE", "triangle absolute", (1200, -80))
    connect(triangle_delta.outputs[0], triangle_abs.inputs[0])
    triangle = _math_node(nodes, "MULTIPLY", "triangle wave", (1380, -80), second=2.0)
    connect(triangle_abs.outputs[0], triangle.inputs[0])

    row_span = _math_node(nodes, "SUBTRACT", "motif row span", (1020, 180),
                          first=MAX_ROW, second=MIN_ROW)
    centre_offset = _math_node(nodes, "MULTIPLY", "motif row offset", (1200, 180))
    connect(triangle.outputs[0], centre_offset.inputs[0])
    connect(row_span.outputs[0], centre_offset.inputs[1])
    centre = _math_node(nodes, "ADD", "motif centre row", (1380, 180), second=MIN_ROW)
    connect(centre_offset.outputs[0], centre.inputs[0])
    row_delta = _math_node(nodes, "SUBTRACT", "row from motif", (1560, 180))
    connect(row.outputs[0], row_delta.inputs[0])
    connect(centre.outputs[0], row_delta.inputs[1])
    row_distance = _math_node(nodes, "ABSOLUTE", "motif row distance", (1740, 180))
    connect(row_delta.outputs[0], row_distance.inputs[0])
    # Shader Math exposes LESS_THAN rather than LESS_EQUAL; the tiny margin
    # keeps the intended inclusive half-width at floating-point boundaries.
    inner = _math_node(nodes, "LESS_THAN", "gold mask", (1920, 180),
                       second=INNER_GOLDEN_HALF_WIDTH + 1.0e-6)
    connect(row_distance.outputs[0], inner.inputs[0])
    outer = _math_node(nodes, "LESS_THAN", "orange edge mask", (1920, 40),
                       second=OUTER_ORANGE_HALF_WIDTH + 1.0e-6)
    connect(row_distance.outputs[0], outer.inputs[0])

    blue = _rgb_node(nodes, "deep saturated blue", BLUE, (1380, -380))
    orange = _rgb_node(nodes, "vivid vermilion orange", ORANGE, (1380, -500))
    gold = _rgb_node(nodes, "golden yellow", GOLD, (1380, -620))
    edge_mix = _mix_node(nodes, "blue + orange chevron edge", (2100, 40))
    connect(outer.outputs[0], edge_mix.inputs[0])
    connect(blue.outputs[0], edge_mix.inputs[1])
    connect(orange.outputs[0], edge_mix.inputs[2])
    gold_mix = _mix_node(nodes, "gold centre over edge", (2280, 40))
    connect(inner.outputs[0], gold_mix.inputs[0])
    connect(edge_mix.outputs[0], gold_mix.inputs[1])
    connect(gold.outputs[0], gold_mix.inputs[2])
    seat_mix = _mix_node(nodes, "lower orange / upper motif", (2460, 40))
    connect(upper.outputs[0], seat_mix.inputs[0])
    connect(orange.outputs[0], seat_mix.inputs[1])
    connect(gold_mix.outputs[0], seat_mix.inputs[2])
    connect(seat_mix.outputs[0], base_colour)

    material["nms_motera_shader_version"] = 1
    material["nms_motera_source_material"] = SOURCE_MATERIAL


def _validate_source_slots(bpy, source_material):
    sources = []
    allowed_slot0 = {source_material.name, TARGET_MATERIAL}
    for object_name in SOURCE_OBJECTS:
        obj = bpy.data.objects.get(object_name)
        if obj is None or not hasattr(obj.data, "materials"):
            raise RuntimeError("missing source mesh object {!r}".format(object_name))
        slots = obj.data.materials
        if len(slots) < 3:
            raise RuntimeError("{} must have three material slots".format(object_name))
        if slots[0] is None or slots[0].name not in allowed_slot0:
            raise RuntimeError(
                "{} slot0 is {!r}; expected {!r} or {!r}".format(
                    object_name, slots[0].name if slots[0] else None,
                    source_material.name, TARGET_MATERIAL,
                )
            )
        for index, expected_name in enumerate(HARDWARE_SLOTS, 1):
            if slots[index] is None or slots[index].name != expected_name:
                raise RuntimeError(
                    "{} slot{} must remain {}".format(object_name, index, expected_name)
                )
        sources.append(obj)
    return sources


def _get_or_copy_target(bpy, source_material):
    target = bpy.data.materials.get(TARGET_MATERIAL)
    if target is None:
        target = source_material.copy()
        target.name = TARGET_MATERIAL
        created = True
    else:
        if target is source_material:
            raise RuntimeError("target material aliases the rollback source")
        created = False
    source_material.use_fake_user = True
    target.use_fake_user = True
    target["nms_motera_source_material"] = SOURCE_MATERIAL
    return target, created


def apply_motera_material():
    """Apply the material correction in the connected Blender process."""
    import bpy

    source = bpy.data.materials.get(SOURCE_MATERIAL)
    if source is None:
        raise RuntimeError("missing source material {!r}".format(SOURCE_MATERIAL))
    sources = _validate_source_slots(bpy, source)
    target, created = _get_or_copy_target(bpy, source)
    _build_colour_network(target)

    changes = []
    for obj in sources:
        slots = obj.data.materials
        before = slots[0].name
        slots[0] = target
        changes.append((obj.name, before, slots[0].name,
                        slots[1].name, slots[2].name))

    action = "copied" if created else "reused"
    print("[nms motera] {} {} from {}".format(action, target.name, source.name))
    for object_name, before, after, galvanized, hardware in changes:
        print("[nms motera] {} slot0 {} -> {}; slot1={}; slot2={}".format(
            object_name, before, after, galvanized, hardware
        ))
    print("[nms motera] source rollback material kept with fake user: {}".format(source.name))
    return target


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        _self_test()
    else:
        apply_motera_material()
