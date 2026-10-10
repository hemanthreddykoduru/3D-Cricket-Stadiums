"""Exact evaluated-mesh capture and disposable GLB geometry for export_step34c.

No operators that load/save a blend, change a source modifier, or select a LOD.
All coordinates are Blender metres/Z-up until the glTF exporter converts axes.
"""

from collections import Counter, defaultdict
import hashlib
import json
import re

import bpy
import numpy as np
from mathutils import Matrix


LAYERS = ("stadium", "pitch", "seats", "environment", "roads", "parking")
EMITTERS = {f"NMS_OPT_Seats_{tier}_LOD{lod}"
            for tier in ("Lower", "Upper") for lod in range(3)}
SEAT_COUNT = 27604
MAX_TRIANGLES = 6_000_000
MAX_BATCHES = 250
TRANSFORM_TOLERANCE = 3e-5  # float32 GN Euler/TRS round-trip, not a modelling tolerance


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def enum(owner, name, value):
    choices = {item.identifier for item in owner.bl_rna.properties[name].enum_items}
    require(value in choices, f"Unsupported {owner}.{name}={value!r}: {sorted(choices)}")
    setattr(owner, name, value)


def rna_call(owner, method, **kwargs):
    """Validate enum arguments on collection methods as well as properties."""
    parameters = owner.bl_rna.functions[method].parameters
    for name, value in kwargs.items():
        prop = parameters.get(name)
        if prop is not None and prop.type == 'ENUM':
            choices = {item.identifier for item in prop.enum_items}
            if name == 'socket_type' and choices == {'DEFAULT'}:
                # Interface socket types are context-dependent in Blender 5.2;
                # static RNA exposes DEFAULT, not the registered socket classes.
                registered = getattr(bpy.types, value, None)
                require(isinstance(registered, type) and issubclass(registered, bpy.types.NodeSocket),
                        f'Unregistered socket type: {value}')
            else:
                require(value in choices, f"Unsupported {method}({name}={value!r}): {choices}")
    return getattr(owner, method)(**kwargs)


def socket(sockets, identifier):
    matches = [s for s in sockets if s.identifier == identifier and not s.is_unavailable]
    require(len(matches) == 1, f"Expected one enabled socket {identifier!r}")
    return matches[0]


def array(items, prop, width, dtype=np.float32):
    values = np.empty(len(items) * width, dtype=dtype)
    items.foreach_get(prop, values)
    return values.reshape(-1, width) if width > 1 else values


def effective_materials(obj, mesh):
    """OBJECT overrides (notably the white roof trusses) take precedence."""
    slots = obj.material_slots
    result = [slots[i].material if i < len(slots) else mesh.materials[i]
              for i in range(max(len(slots), len(mesh.materials)))]
    original = obj.original
    for i, slot in enumerate(original.material_slots):
        if slot.link == 'OBJECT' and i < len(result):
            result[i] = slot.material
    return tuple(result)


def category(name, centre):
    """Precinct names win over generic 'pitch', 'roof', 'pavilion', 'access'."""
    name = name.upper()
    if any(word in name for word in ('PARKING', 'PARKED_VEHICLE', '_VEHICLE_')):
        return 'parking', 'parking/vehicle name'
    precinct = 'NMS_31D' in name
    if precinct or name.startswith('ENV_'):
        if any(word in name for word in ('PRACTICE', 'TRAINING', '_FIELD_', '_NET_')):
            return 'environment', 'precinct practice/training name'
        if 'WICKET_SET' in name:
            # Generic wicket IDs span both the bowl and the off-site practice grounds.
            if np.linalg.norm(np.asarray(centre)[:2]) < 120:
                return 'pitch', 'central wicket geometry within 120m of bowl origin'
            return 'environment', 'precinct wicket geometry outside bowl'
        if any(word in name for word in (
                'ROAD', 'ARRIVAL', 'FORECOURT', 'PEDESTRIAN', 'SIDEWALK',
                'MAIN_GENERAL_ENTRY', 'VIP_ENTRY', 'TICKETING_HOLDING',
                'GATE_APRON', '_ACCESS', 'TRANSPORT')):
            return 'roads', 'precinct circulation/arrival name'
        if 'VIP_PLAYERS_PAVILION' in name:
            return 'stadium', 'core players pavilion'
        return 'environment', 'precinct/site/landscape/ancillary building name'
    if any(word in name for word in ('PITCH_', 'WICKET', 'CREASE', 'STEP20_BOUNDARY')):
        return 'pitch', 'core playing field name'
    if any(word in name for word in ('LANDSCAPE', 'GROUND_PAD', 'SITE_LAYOUT', 'TREE_', 'SHRUB_')):
        return 'environment', 'landscape/site name'
    return 'stadium', 'core building/bowl/roof/floodlight/circulation'


def mesh_buffers(mesh):
    mesh.calc_loop_triangles()
    uv_names = tuple(layer.name for layer in mesh.uv_layers)
    result = {
        'co': array(mesh.vertices, 'co', 3),
        'vertices': array(mesh.loop_triangles, 'vertices', 3, np.int32),
        'loops': array(mesh.loop_triangles, 'loops', 3, np.int32),
        'normals': array(mesh.corner_normals, 'vector', 3),
        'material_index': array(mesh.loop_triangles, 'material_index', 1, np.int32),
        'uv': {layer.name: array(layer.data, 'uv', 2) for layer in mesh.uv_layers},
        'uv_names': uv_names,
        'active_uv': next((layer.name for layer in mesh.uv_layers if layer.active_render), None),
    }
    require(len(result['normals']) == len(mesh.loops), f"Missing corner normals: {mesh.name}")
    for values in (result['co'], result['normals'], *result['uv'].values()):
        require(np.isfinite(values).all(), f"Nonfinite source mesh data: {mesh.name}")
    incidence = np.bincount(array(mesh.loops, 'edge_index', 1, np.int32), minlength=len(mesh.edges))
    result['topology'] = {
        'boundary_edges': int(np.count_nonzero(incidence == 1)),
        'edges_with_more_than_two_faces': int(np.count_nonzero(incidence > 2)),
        'loose_edges': int(np.count_nonzero(incidence == 0)),
    }
    h = hashlib.sha256()
    for key in ('co', 'vertices', 'loops', 'normals', 'material_index'):
        h.update(key.encode())
        h.update(result[key].tobytes())
    for name in uv_names:
        h.update(name.encode())
        h.update(result['uv'][name].tobytes())
    h.update(json.dumps((uv_names, result['active_uv'])).encode())
    result['fingerprint'] = h.hexdigest()
    return result


def visible_instance(inst, view_layer):
    owner = inst.parent.original if inst.is_instance and inst.parent else inst.object.original
    return owner, owner.visible_get(view_layer=view_layer) and not owner.hide_render and inst.show_self


def position_order(matrices):
    p = matrices[:, :3, 3]
    return np.lexsort((p[:, 2], p[:, 1], p[:, 0]))


def capture(palette):
    dg = bpy.context.evaluated_depsgraph_get()
    groups, prototypes, records = {}, {}, []
    cache, prototype_cache = {}, {}
    skipped, zero_emitters, source_records = [], Counter(), []
    category_names = defaultdict(set)
    category_counts = Counter()
    seat_emitter_counts, seat_colours = Counter(), Counter()
    seat_triangles = 0
    used_materials = set()
    for inst in dg.object_instances:
        obj = inst.object
        if obj is None:
            continue
        owner, visible = visible_instance(inst, bpy.context.view_layer)
        if not visible:
            if not inst.is_instance:
                skipped.append(owner.name)
            continue
        require(obj.type in {'MESH', 'EMPTY', 'LIGHT', 'CAMERA'},
                f"Uncaptured visible object type {obj.type}: {owner.name}")
        if obj.type != 'MESH':
            continue
        mesh = obj.data
        pointer = mesh.as_pointer()
        if pointer not in cache:
            cache[pointer] = mesh_buffers(mesh)
        data = cache[pointer]
        tris = len(data['vertices'])
        seat_owner = next((n for n in (owner.name, obj.original.name) if n in EMITTERS), None)
        if not tris:
            if seat_owner:
                zero_emitters[seat_owner] += 1
            continue
        mats = effective_materials(obj, mesh)
        for index in np.unique(data['material_index']):
            require(index < len(mats) and mats[index] is not None,
                    f"Missing effective OBJECT material {owner.name} slot {index}")
            used_materials.add(mats[index])
        matrix = np.asarray(inst.matrix_world, dtype=np.float64)
        require(np.isfinite(matrix).all(), f"Nonfinite transform: {owner.name}")
        if seat_owner:
            require(inst.is_instance, f"Unexpected realized/non-instance seat geometry: {seat_owner}")
            require(len(mats) == 3 and tuple(m.name for m in mats) ==
                    (palette.TARGET_MATERIAL, *palette.HARDWARE_SLOTS),
                    f"Seat material/hardware slots changed: {seat_owner}")
            key = data['fingerprint']
            if pointer not in prototype_cache:
                if key not in prototypes:
                    copy = mesh.copy()
                    copy.name = f'WEB34C_CAPTURE_{key[:12]}'
                    # Clearing material slots resets polygon material indices in
                    # Blender and would recolour the hardware. Rebind in place.
                    require(len(copy.materials) == len(mats), 'Prototype slot count changed on copy')
                    for index, material in enumerate(mats):
                        copy.materials[index] = material
                    prototypes[key] = {'mesh': copy, 'triangles': tris, 'materials': mats,
                                       'uv_names': data['uv_names'], 'topology': data['topology'],
                                       'source_mesh_names': set()}
                prototype_cache[pointer] = key
            prototypes[key]['source_mesh_names'].add(mesh.name)
            colour = palette.classify_seat(*matrix[:3, 3])
            records.append((key, colour, matrix.astype(np.float32)))
            seat_emitter_counts[seat_owner] += 1
            seat_colours[colour] += 1
            seat_triangles += tris
            continue
        require(obj.original.name not in palette.SOURCE_OBJECTS,
                f"A hidden seat prototype unexpectedly became visible: {obj.name}")
        linear = matrix[:3, :3]
        determinant = np.linalg.det(linear)
        require(abs(determinant) > 1e-14, f"Singular non-seat transform: {owner.name}")
        world64 = data['co'].astype(np.float64) @ linear.T + matrix[:3, 3]
        world = world64.astype(np.float32)
        normals = data['normals'].astype(np.float64) @ np.linalg.inv(linear)
        lengths = np.linalg.norm(normals, axis=1)
        # A zero normal on a collapsed face is harmless; it is explicitly counted below.
        normals /= np.maximum(lengths[:, None], 1e-30)
        centre = (world64.min(axis=0) + world64.max(axis=0)) * 0.5
        layer, reason = category(owner.name, centre)
        category_names[layer].add(owner.name)
        category_counts[layer] += tris
        slot_report = []
        for index in np.unique(data['material_index']):
            material = mats[index]
            mask = data['material_index'] == index
            vertices, loops = data['vertices'][mask], data['loops'][mask]
            if determinant < 0:
                vertices, loops = vertices[:, [0, 2, 1]], loops[:, [0, 2, 1]]
            triangles = world64[vertices]
            cross = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
            source_nonzero = np.any(cross != 0.0, axis=1)
            rounded_triangles = world[vertices].astype(np.float64)
            rounded_cross = np.cross(rounded_triangles[:, 1] - rounded_triangles[:, 0],
                                     rounded_triangles[:, 2] - rounded_triangles[:, 0])
            # glTF positions are float32. A few Boolean-generated stair slivers
            # become exactly degenerate at that precision; never export them as
            # broken faces or silently remove a meaningful surface.
            rounded_nonzero = np.any(rounded_cross != 0.0, axis=1)
            collapsed = source_nonzero & ~rounded_nonzero
            collapsed_areas = np.linalg.norm(cross[collapsed], axis=1) * 0.5
            maximum_collapsed_area = float(collapsed_areas.max()) if len(collapsed_areas) else 0.0
            require(maximum_collapsed_area <= 1e-6,
                    f'Float32 collapse exceeds one square millimetre: {owner.name}')
            good = source_nonzero & rounded_nonzero
            removed = int(np.count_nonzero(~good))
            precision_removed = int(np.count_nonzero(collapsed))
            v, ls = vertices[good].reshape(-1), loops[good].reshape(-1)
            packed = np.column_stack([world[v], normals[ls],
                                      *(data['uv'][name][ls] for name in data['uv_names'])]).astype(np.float32)
            rounded = packed[:, :3].reshape(-1, 3, 3).astype(np.float64)
            require(np.all(np.any(np.cross(rounded[:, 1] - rounded[:, 0],
                                           rounded[:, 2] - rounded[:, 0]) != 0.0, axis=1)),
                    f"Positive-area geometry collapses at float32 export precision: {owner.name}")
            require(np.all(np.linalg.norm(packed[:, 3:6], axis=1) > 0.99),
                    f"Invalid source normal on a nonzero triangle: {owner.name}")
            key = (layer, material.name, data['uv_names'], data['active_uv'] or '')
            group = groups.setdefault(key, {'parts': [], 'material': material, 'removed': 0,
                                            'precision_removed': 0, 'maximum_collapsed_area': 0.0,
                                            'names': set(), 'evaluated_triangles': 0})
            group['parts'].append(packed)
            group['removed'] += removed
            group['precision_removed'] += precision_removed
            group['maximum_collapsed_area'] = max(group['maximum_collapsed_area'], maximum_collapsed_area)
            group['names'].add(owner.name)
            group['evaluated_triangles'] += int(mask.sum())
            slot_report.append({'slot': int(index), 'effective_material': material.name,
                                'mesh_material': mesh.materials[index].name
                                if index < len(mesh.materials) and mesh.materials[index] else None,
                                'triangles': int(mask.sum()), 'zero_area_removed': removed,
                                'float32_collapsed_removed': precision_removed,
                                'maximum_collapsed_source_area_m2': maximum_collapsed_area})
        source_records.append({'name': owner.name, 'evaluated_object': obj.name,
                               'layer': layer, 'rule': reason, 'triangles': tris,
                               'uv_layers': list(data['uv_names']), 'active_render_uv': data['active_uv'],
                               'topology': data['topology'], 'effective_material_slots': slot_report,
                               'bounds_z_up': [world64.min(axis=0).tolist(), world64.max(axis=0).tolist()]})
    require(len(records) == SEAT_COUNT, f"Expected {SEAT_COUNT} visible true seat instances, got {len(records)}")
    matrices = np.asarray([r[2] for r in records])
    require(len(np.unique(matrices[:, :3, 3], axis=0)) == SEAT_COUNT, 'Duplicate/missing source seat origins')
    require(seat_triangles + sum(category_counts.values()) <= MAX_TRIANGLES, 'Source exceeds 6M rendered triangles')
    require(set(seat_colours) == {'orange', 'blue', 'gold'}, 'Expected all three Motera colours')
    report = {
        'evaluated_nonseat_triangles': sum(category_counts.values()),
        'evaluated_seat_triangles': seat_triangles,
        'evaluated_rendered_triangles': seat_triangles + sum(category_counts.values()),
        'seat_instances': len(records), 'unique_seat_positions': SEAT_COUNT,
        'seat_colour_counts': dict(seat_colours), 'seat_emitter_counts': dict(seat_emitter_counts),
        'empty_seat_evaluations': dict(zero_emitters),
        'source_seat_transform_sha256': hashlib.sha256(matrices[position_order(matrices)].tobytes()).hexdigest(),
        'category_names': {k: sorted(v) for k, v in category_names.items()},
        'category_triangles': dict(category_counts), 'source_objects': source_records,
        'skipped_hidden_objects': sorted(set(skipped)),
        'prototype_geometry': {k: {**{p: v for p, v in info.items() if p not in {'mesh', 'materials', 'source_mesh_names'}},
                                     'source_mesh_names': sorted(info['source_mesh_names']),
                                     'materials': [m.name for m in info['materials']]}
                               for k, info in prototypes.items()},
        'visibility_policy': 'saved current view-layer depsgraph; owner visible_get, !hide_render and instance.show_self',
        'topology_policy': 'report original open/non-manifold architectural shells; no repair or welding tolerance',
    }
    return groups, prototypes, records, used_materials, report


def make_nonseat(scene, groups):
    objects, report = [], []
    for sequence, (key, group) in enumerate(sorted(groups.items())):
        layer, material_name, uv_names, active_uv = key
        data = np.concatenate(group.pop('parts'))
        count = len(data) // 3
        require(count + group['removed'] == group['evaluated_triangles'], 'Non-seat triangle accounting mismatch')
        if not count:
            report.append({'layer': layer, 'material': material_name, 'triangles': 0,
                           'duplicate_topology_faces_preserved': 0,
                           'zero_area_removed': group['removed'],
                           'float32_collapsed_removed': group['precision_removed'],
                           'maximum_collapsed_source_area_m2': group['maximum_collapsed_area'],
                           'source_names': sorted(group['names'])})
            continue
        # Exact full-corner tuple sharing retains every position, normal and UV seam.
        unique, inverse = np.unique(data, axis=0, return_inverse=True)
        # Blender validation deletes faces with equal vertex sets, regardless of
        # winding. Keep the first shared face; isolate only subsequent copies.
        faces = inverse.reshape(-1, 3)
        _, first = np.unique(np.sort(faces, axis=1), axis=0, return_index=True)
        duplicates = np.ones(count, dtype=np.bool_)
        duplicates[first] = False
        preserved = int(duplicates.sum())
        if preserved:
            extra = data.reshape(count, 3, -1)[duplicates].reshape(-1, data.shape[1])
            faces[duplicates] = np.arange(len(unique), len(unique) + len(extra)).reshape(-1, 3)
            unique = np.concatenate((unique, extra))
        name = f'WEB34C_{layer.upper()}_{sequence:03d}_{re.sub("[^A-Za-z0-9_]", "_", material_name)[:30]}'
        mesh = bpy.data.meshes.new(name)
        mesh.vertices.add(len(unique))
        mesh.vertices.foreach_set('co', unique[:, :3].reshape(-1))
        mesh.loops.add(len(inverse))
        mesh.loops.foreach_set('vertex_index', inverse.astype(np.int32))
        mesh.polygons.add(count)
        mesh.polygons.foreach_set('loop_start', np.arange(count, dtype=np.int32) * 3)
        mesh.polygons.foreach_set('loop_total', np.full(count, 3, dtype=np.int32))
        mesh.polygons.foreach_set('use_smooth', np.ones(count, dtype=np.bool_))
        mesh.update(calc_edges=True)
        mesh.materials.append(group['material'])
        mesh.normals_split_custom_set_from_vertices(unique[:, 3:6].tolist())
        for i, uv_name in enumerate(uv_names):
            uv = mesh.uv_layers.new(name=uv_name)
            uv.data.foreach_set('uv', data[:, 6 + i * 2:8 + i * 2].reshape(-1))
        if active_uv:
            mesh.uv_layers[active_uv].active_render = True
            mesh.uv_layers.active_index = list(uv_names).index(active_uv)
        repaired = mesh.validate()
        require(not repaired and len(mesh.polygons) == count,
                f'Disposable mesh required validation repair: {name} ({count} -> {len(mesh.polygons)} triangles)')
        actual_positions = array(mesh.vertices, 'co', 3)[array(mesh.loops, 'vertex_index', 1, np.int32)]
        require(np.array_equal(actual_positions, data[:, :3]), f"Position round-trip changed: {name}")
        for i, uv_name in enumerate(uv_names):
            require(np.array_equal(array(mesh.uv_layers[uv_name].data, 'uv', 2), data[:, 6 + i * 2:8 + i * 2]),
                    f"UV round-trip changed: {name}/{uv_name}")
        dots = np.einsum('ij,ij->i', array(mesh.corner_normals, 'vector', 3), data[:, 3:6])
        minimum_dot = float(dots.min())
        require(minimum_dot > 0.99999, f"Custom corner normals changed: {name}: {minimum_dot}")
        obj = bpy.data.objects.new(name, mesh)
        scene.collection.objects.link(obj)
        obj['stadiumLayer'] = layer
        obj['geometryPolicy'] = 'exact evaluated world-space triangles, UVs and corner normals'
        objects.append(obj)
        report.append({'name': name, 'layer': layer, 'material': material_name,
                       'triangles': count, 'vertices': len(unique), 'zero_area_removed': group['removed'],
                       'duplicate_topology_faces_preserved': preserved,
                       'float32_collapsed_removed': group['precision_removed'],
                       'maximum_collapsed_source_area_m2': group['maximum_collapsed_area'],
                       'source_names': sorted(group['names']), 'uv_layers': list(uv_names),
                       'active_render_uv': active_uv or None, 'positions_exact': True, 'uvs_exact': True,
                       'minimum_normal_dot': minimum_dot,
                       'corner_data_sha256': hashlib.sha256(data.tobytes()).hexdigest(),
                       'bounds_z_up': [unique[:, :3].min(axis=0).tolist(), unique[:, :3].max(axis=0).tolist()]})
        print(f'WEB34C batch {name}: {count} triangles ({group["removed"]} export-degenerate removed; '
              f'{preserved} duplicate topology faces preserved)', flush=True)
    return objects, report


def make_seats(scene, prototypes, records, materials):
    groups = defaultdict(list)
    for key, colour, matrix in records:
        groups[key, colour].append(matrix)
    objects, report = [], []
    max_error = 0.0
    for (key, colour), matrices in sorted(groups.items()):
        matrices = np.asarray(matrices, dtype=np.float32)
        matrices = matrices[position_order(matrices)]
        name = f'WEB34C_SEATS_{key[:12]}_{colour.upper()}'
        geometry = prototypes[key]
        mesh = geometry['mesh'].copy()
        mesh.name = name + '_PROTOTYPE'
        mesh.materials[0] = materials[colour]
        require(tuple(m.name for m in mesh.materials[1:]) == ('HF27_Galvanized', 'HF27_Mounting_Hardware'),
                'Hardware material slots changed')
        require(mesh_buffers(mesh)['fingerprint'] == key, 'Prototype geometry/UV/normals changed')
        proto = bpy.data.objects.new(mesh.name, mesh)
        scene.collection.objects.link(proto)
        proto['stadiumLayer'] = 'seats'
        proto.hide_render = True
        proto.hide_viewport = True
        proto.hide_set(True)
        rotations, scales = [], []
        for matrix in matrices:
            location, rotation, scale = Matrix(matrix.tolist()).decompose()
            recomposed = np.asarray(Matrix.LocRotScale(location, rotation, scale), dtype=np.float64)
            error = float(np.max(np.abs(recomposed - matrix)))
            max_error = max(max_error, error)
            require(error <= TRANSFORM_TOLERANCE, 'A seat has shear/non-TRS transform; refusing approximation')
            rotations.append(tuple(rotation.to_euler()))
            scales.append(tuple(scale))
        points = bpy.data.meshes.new(name)
        points.vertices.add(len(matrices))
        points.vertices.foreach_set('co', matrices[:, :3, 3].reshape(-1))
        for attr_name, values in (('seat_rotation', rotations), ('seat_scale', scales)):
            attr = rna_call(points.attributes, 'new', name=attr_name, type='FLOAT_VECTOR', domain='POINT')
            attr.data.foreach_set('vector', np.asarray(values, dtype=np.float32).reshape(-1))
        obj = bpy.data.objects.new(name, points)
        scene.collection.objects.link(obj)
        obj['stadiumLayer'] = 'seats'
        obj['visualSeatCount'] = len(matrices)
        obj['seatColour'] = colour
        obj['sourceGeometrySha256'] = key
        tree = bpy.data.node_groups.new(name + '_GN', 'GeometryNodeTree')
        rna_call(tree.interface, 'new_socket', name='Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
        rna_call(tree.interface, 'new_socket', name='Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
        inp, out = tree.nodes.new('NodeGroupInput'), tree.nodes.new('NodeGroupOutput')
        info = tree.nodes.new('GeometryNodeObjectInfo')
        enum(info, 'transform_space', 'ORIGINAL')
        socket(info.inputs, 'Object').default_value = proto
        socket(info.inputs, 'As Instance').default_value = True
        instance = tree.nodes.new('GeometryNodeInstanceOnPoints')
        tree.links.new(inp.outputs[0], socket(instance.inputs, 'Points'))
        tree.links.new(socket(info.outputs, 'Geometry'), socket(instance.inputs, 'Instance'))
        for attr_name, destination in (('seat_rotation', 'Rotation'), ('seat_scale', 'Scale')):
            attr = tree.nodes.new('GeometryNodeInputNamedAttribute')
            enum(attr, 'data_type', 'FLOAT_VECTOR')
            socket(attr.inputs, 'Name').default_value = attr_name
            # Attribute has several typed sockets; use the enabled vector socket.
            output = next(s for s in attr.outputs if s.type == 'VECTOR' and not s.is_unavailable)
            tree.links.new(output, socket(instance.inputs, destination))
        tree.links.new(socket(instance.outputs, 'Instances'), out.inputs[0])
        modifier = rna_call(obj.modifiers, 'new', name='Exact saved seat geometry instances', type='NODES')
        modifier.node_group = tree
        objects.append(obj)
        used_slots = sorted(set(int(p.material_index) for p in mesh.polygons))
        report.append({'name': name, 'geometry_sha256': key, 'colour': colour,
                       'instances': len(matrices), 'triangles_per_instance': geometry['triangles'],
                       'rendered_triangles': len(matrices) * geometry['triangles'],
                       'material_batches': len(used_slots), 'material_slots': [m.name for m in mesh.materials],
                       'used_material_slots': used_slots})
    return objects, report, max_error


def validate_seats(objects, records):
    """Audit the newly evaluated GN graph, not just the points used to build it."""
    expected = defaultdict(list)
    for geometry, colour, matrix in records:
        expected[geometry, colour].append(matrix)
    actual = defaultdict(list)
    names = {o.name for o in objects}
    cache = {}
    bpy.context.view_layer.update()
    for inst in bpy.context.evaluated_depsgraph_get().object_instances:
        if not inst.is_instance or not inst.parent or inst.parent.original.name not in names:
            continue
        obj = inst.object
        if obj.type != 'MESH' or not len(obj.data.polygons):
            continue
        key = obj.data.as_pointer()
        if key not in cache:
            cache[key] = mesh_buffers(obj.data)['fingerprint']
        owner = inst.parent.original
        require(cache[key] == owner['sourceGeometrySha256'], 'Evaluated seat prototype geometry changed')
        actual[cache[key], owner['seatColour']].append(np.asarray(inst.matrix_world, dtype=np.float32))
    require(actual.keys() == expected.keys(), 'Rebuilt seat geometry/palette groups changed')
    errors, origins = [], []
    for key in expected:
        want, got = np.asarray(expected[key]), np.asarray(actual[key])
        require(len(want) == len(got), f'Rebuilt seat count changed for {key}')
        want, got = want[position_order(want)], got[position_order(got)]
        require(np.array_equal(want[:, :3, 3], got[:, :3, 3]), 'Rebuilt world seat origins changed')
        error = float(np.max(np.abs(want - got)))
        require(error <= TRANSFORM_TOLERANCE, f'Rebuilt seat transform changed by {error}')
        errors.append(error)
        origins.append(got[:, :3, 3])
    origins = np.concatenate(origins)
    require(len(origins) == len(np.unique(origins, axis=0)) == SEAT_COUNT, 'Rebuilt unique seat count changed')
    return {'instances': len(origins), 'unique_positions': len(np.unique(origins, axis=0)),
            'world_origins_bit_exact': True, 'max_transform_abs_error': max(errors),
            'float32_trs_tolerance': TRANSFORM_TOLERANCE,
            'geometry_fingerprints_exact': True, 'groups': len(actual)}
