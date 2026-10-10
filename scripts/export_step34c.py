"""Reproduce a texture-preserving web export from the saved STEP34-C checkpoint.

Run from the repository root (choose NEW output/report/optional-preview names):
  /Applications/Blender.app/Contents/MacOS/Blender --background --disable-autoexec \
    sources/narendra-modi-stadium/detailed/step34-finalization/step34_C_motera_reference_seat_colours.blend \
    --python-exit-code 1 --python scripts/export_step34c.py -- \
    --output /existing/folder/step34c.glb --report /existing/folder/step34c.json

Requires Blender 5.2.2 and its bundled NumPy/glTF exporter. Only an ephemeral
in-memory scene is constructed; this script never saves a .blend. Output is
published exclusively after validation; existing paths, including symlinks,
are refused. The original public GLB is a protected input, not a destination.
"""

import argparse
from collections import Counter
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import struct
import sys
import tempfile
import time
import traceback

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

# Blender --python does not guarantee that the script's directory is sys.path[0].
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from step34c_meshes import (EMITTERS, LAYERS, MAX_BATCHES, MAX_TRIANGLES, SEAT_COUNT,
                            TRANSFORM_TOLERANCE, capture, enum, make_nonseat,
                            make_seats, position_order, require, socket, validate_seats)

ROOT = SCRIPT_DIR.parent
SOURCE = ROOT / 'sources/narendra-modi-stadium/detailed/step34-finalization/step34_C_motera_reference_seat_colours.blend'
SOURCE_SHA256 = 'b163a586462f280f8f5d1446645c6142e4fe109059366d3b68a6a4823fb8786d'
PUBLIC_GLB = ROOT / 'public/models/narendra-modi-stadium/stadium.glb'
PUBLIC_SHA256 = '69a67c6b80c7e48f26f4331c4516abcba18300d80f73136aafdce0913aae3003'


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def protected_hashes():
    result = {}
    for path, expected in ((SOURCE, SOURCE_SHA256), (PUBLIC_GLB, PUBLIC_SHA256)):
        require(path.is_file(), f'Missing protected input: {path}')
        actual = sha256(path)
        require(actual == expected, f'Protected input SHA256 mismatch: {path}: {actual}')
        result[str(path.relative_to(ROOT))] = actual
    return result


def new_destination(raw, suffix):
    path = Path(raw).expanduser().absolute()
    require(path.suffix.lower() == suffix, f'Expected {suffix} destination: {path}')
    require(path.parent.is_dir(), f'Destination parent must already exist: {path.parent}')
    require(not os.path.lexists(path), f'Refusing existing output/symlink: {path}')
    path = path.parent.resolve(strict=True) / path.name
    require(not os.path.lexists(path), f'Refusing existing resolved output: {path}')
    require(path not in (SOURCE.resolve(), PUBLIC_GLB.resolve()), 'A protected input cannot be an output')
    return path


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--output', required=True, help='NEW .glb path with an existing parent')
    parser.add_argument('--report', required=True, help='NEW .json path with an existing parent')
    parser.add_argument('--preview', help='Optional NEW .png, 768px aerial using an existing source camera')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    args.output = new_destination(args.output, '.glb')
    args.report = new_destination(args.report, '.json')
    args.preview = new_destination(args.preview, '.png') if args.preview else None
    return args


def value_of(value):
    if isinstance(value, (str, bool, int, float)) or value is None:
        return value
    try:
        return list(value)
    except TypeError:
        return str(value)


def tagged_graph(material, palette):
    """Type + authored tag/label identify the saved network, never node names."""
    tree = material.node_tree
    nodes = [n for n in tree.nodes if n.get(palette.NODE_TAG)]
    keys = [(n.type, n.label) for n in nodes]
    require(len(keys) == len(set(keys)), 'Duplicate tagged colour-node identity')
    graph = []
    for node in nodes:
        inputs = []
        for index, s in enumerate(node.inputs):
            if s.is_linked:
                links = [(link.from_node.type, link.from_node.label,
                          list(link.from_node.outputs).index(link.from_socket)) for link in s.links]
                inputs.append((index, 'links', links))
            elif hasattr(s, 'default_value'):
                inputs.append((index, 'value', value_of(s.default_value)))
        entry = {'type': node.type, 'label': node.label, 'inputs': inputs, 'mute': node.mute}
        for prop in ('operation', 'blend_type', 'use_clamp'):
            if hasattr(node, prop):
                entry[prop] = getattr(node, prop)
        if node.type == 'RGB':
            entry['rgba'] = list(node.outputs[0].default_value)
        graph.append(entry)
    principled = [n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED']
    require(len(principled) == 1, 'Expected one source seat Principled shader')
    base = socket(principled[0].inputs, 'Base Color')
    links = [(l.from_node.type, l.from_node.label, list(l.from_node.outputs).index(l.from_socket))
             for l in base.links]
    return {'nodes': sorted(graph, key=lambda v: (v['type'], v['label'])), 'base_colour_links': links}


def load_validate_palette():
    path = SCRIPT_DIR / 'nms_phase2/match_motera_seat_colours.py'
    # A non-__main__ module name cannot take the script's apply_motera_material branch.
    spec = importlib.util.spec_from_file_location('step34c_readonly_palette', path)
    palette = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(palette)
    palette._self_test()
    source = bpy.data.materials.get(palette.TARGET_MATERIAL)
    require(source is not None and source.node_tree is not None, 'Missing saved Motera polymer material')
    require(source.get('nms_motera_shader_version') == 1, 'Unrecognised saved Motera shader version')
    for name in palette.SOURCE_OBJECTS:
        obj = bpy.data.objects.get(name)
        require(obj is not None, f'Missing source prototype: {name}')
        require(tuple(s.material.name if s.material else None for s in obj.material_slots) ==
                (palette.TARGET_MATERIAL, *palette.HARDWARE_SLOTS), f'Source hardware/polymer slots changed: {name}')
    require(EMITTERS.issubset({o.name for o in bpy.context.scene.objects}), 'Missing source seat emitter')
    # Rebuild the known formula only on a disposable copy, then compare the saved
    # graph's complete tagged wiring, constants and linear swatches to it.
    reference = source.copy()
    try:
        palette._build_colour_network(reference)
        saved, expected = tagged_graph(source, palette), tagged_graph(reference, palette)
        require(saved == expected, 'Saved tagged seat-colour graph differs from classification formula/constants/swatches')
    finally:
        bpy.data.materials.remove(reference)
    colours = {name: list(getattr(palette, name.upper())) for name in ('orange', 'blue', 'gold')}
    return palette, source, {'formula_script': str(path.relative_to(ROOT)), 'formula_sha256': sha256(path),
                            'self_test': 'passed', 'saved_tagged_graph_matches': True,
                            'tagged_graph_sha256': hashlib.sha256(json.dumps(saved, sort_keys=True).encode()).hexdigest(),
                            'linear_rgba': colours,
                            'srgb_hex': {name: getattr(palette, name.upper() + '_HEX') for name in colours}}


def principled_other_inputs(material):
    p = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    return [(s.identifier, value_of(s.default_value) if hasattr(s, 'default_value') else None,
             [(l.from_node.type, l.from_node.label, l.from_socket.identifier) for l in s.links])
            for s in p.inputs if s.identifier != 'Base Color']


def polymer_variants(source, palette):
    result = {}
    before = principled_other_inputs(source)
    for name in ('orange', 'blue', 'gold'):
        material = source.copy()
        material.name = f'WEB34C_SEATS_POLYMER_{name.upper()}'
        p = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        base = socket(p.inputs, 'Base Color')
        for link in list(base.links):
            material.node_tree.links.remove(link)
        base.default_value = getattr(palette, name.upper())
        require(principled_other_inputs(material) == before, 'A non-colour polymer shader input changed')
        result[name] = material
    return result


def all_nodes(tree, visited=None):
    visited = set() if visited is None else visited
    if tree.as_pointer() in visited:
        return
    visited.add(tree.as_pointer())
    for node in tree.nodes:
        yield node
        if node.type == 'GROUP' and node.node_tree:
            yield from all_nodes(node.node_tree, visited)


def linked_images(input_socket, visited=None):
    visited = set() if visited is None else visited
    images = set()
    for link in input_socket.links:
        node = link.from_node
        if node.as_pointer() in visited:
            continue
        visited.add(node.as_pointer())
        if node.type == 'TEX_IMAGE' and node.image:
            images.add(node.image.name)
        for s in node.inputs:
            images.update(linked_images(s, visited))
    return images


def shader_signature(material):
    """Include non-colour shader defaults and wiring in the preservation check."""
    rows = []
    for node in all_nodes(material.node_tree):
        row = {'type': node.type, 'label': node.label, 'mute': node.mute,
               'inputs': [(s.identifier, value_of(s.default_value) if hasattr(s, 'default_value') else None,
                           [(l.from_node.type, l.from_node.label, l.from_socket.identifier) for l in s.links])
                          for s in node.inputs]}
        for prop in ('operation', 'blend_type', 'uv_map', 'attribute_name', 'layer_name',
                     'interpolation', 'projection', 'extension', 'space'):
            if hasattr(node, prop):
                row[prop] = getattr(node, prop)
        if node.type == 'RGB':
            row['rgba'] = list(node.outputs[0].default_value)
        if node.type == 'VALUE':
            row['value'] = node.outputs[0].default_value
        rows.append(row)
    return hashlib.sha256(json.dumps(rows, sort_keys=True, default=str).encode()).hexdigest()


def material_audit(materials):
    """Read-only packed-image and texture-path gate; original materials are retained."""
    images, rows = {}, []
    for material in sorted(materials, key=lambda m: m.name):
        require(material.node_tree is not None, f'Material has no node tree: {material.name}')
        refs, uv_names = set(), set()
        for node in all_nodes(material.node_tree):
            if node.type == 'TEX_IMAGE':
                require(node.image is not None, f'Missing texture on material {material.name}')
                image = node.image
                packed = list(image.packed_files)
                files = [p.packed_file for p in packed] or ([image.packed_file] if image.packed_file else [])
                require(files and all(p.size > 0 for p in files), f'Missing/empty packed image: {image.name}')
                require(min(image.size[:]) > 0, f'Invalid packed image dimensions: {image.name}')
                require(image.source in {'FILE', 'GENERATED'},
                        f'Unsupported tiled/movie texture: {image.name}/{image.source}')
                refs.add(image.name)
                if image.name not in images:
                    images[image.name] = {'name': image.name, 'size': list(image.size),
                                          'colour_space': image.colorspace_settings.name,
                                          'packed_bytes': sum(p.size for p in files),
                                          'packed_sha256': [hashlib.sha256(bytes(p.data)).hexdigest() for p in files]}
            elif node.type == 'UVMAP' and node.uv_map:
                uv_names.add(node.uv_map)
        shaders = [n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED']
        require(len(shaders) == 1, f'Expected one baked Principled shader: {material.name}')
        shader = shaders[0]
        rows.append({'name': material.name, 'images': sorted(refs), 'named_uv_layers': sorted(uv_names),
                     'shader_graph_sha256': shader_signature(material),
                     'base_colour_images': sorted(linked_images(socket(shader.inputs, 'Base Color'))),
                     'roughness_images': sorted(linked_images(socket(shader.inputs, 'Roughness'))),
                     'normal_images': sorted(linked_images(socket(shader.inputs, 'Normal')))})
    return {'materials': rows, 'packed_images': sorted(images.values(), key=lambda v: v['name']),
            'packed_image_count': len(images), 'missing_packed_images': 0,
            'policy': 'original connected materials/images retained; only copied polymer Base Color links replaced'}


def export_options(path):
    import io_scene_gltf2
    props = bpy.ops.export_scene.gltf.get_rna_type().properties
    options = {
        'filepath': str(path), 'export_format': 'GLB', 'check_existing': True,
        'use_selection': True, 'use_active_scene': True, 'use_visible': False,
        'use_renderable': False, 'export_apply': True,
        'export_materials': 'EXPORT', 'export_image_format': 'AUTO',
        'export_texcoords': True, 'export_normals': True, 'export_tangents': False,
        'export_vertex_color': 'MATERIAL', 'export_all_vertex_colors': False,
        'export_gn_mesh': True, 'export_gpu_instances': True,
        'export_cameras': False, 'export_lights': False, 'export_animations': False,
        'export_skins': False, 'export_morph': False, 'export_yup': True,
        'export_extras': True, 'export_attributes': False,
        'export_draco_mesh_compression_enable': False,
        'export_meshopt_compression_enable': False,
        'export_unused_images': False, 'export_unused_textures': False,
        'export_keep_originals': False,
    }
    for name, value in options.items():
        require(name in props, f'glTF exporter missing required option: {name}')
        if props[name].type == 'ENUM':
            # export_format's dynamic callback has no static RNA enum_items.
            choices = ({item[0] for item in io_scene_gltf2.get_format_items(None, bpy.context)}
                       if name == 'export_format' else {item.identifier for item in props[name].enum_items})
            require(value in choices, f'Unsupported exporter enum {name}={value!r}: {choices}')
    return options


def read_glb(path):
    raw = path.read_bytes()
    require(len(raw) >= 20, 'Truncated GLB header')
    magic, version, length = struct.unpack_from('<4sII', raw)
    require(magic == b'glTF' and version == 2 and length == len(raw), 'Invalid GLB 2 header')
    chunks, offset = [], 12
    while offset < len(raw):
        require(offset + 8 <= len(raw), 'Truncated GLB chunk header')
        size, kind = struct.unpack_from('<I4s', raw, offset)
        offset += 8
        require(size % 4 == 0 and offset + size <= len(raw), 'Invalid GLB chunk length')
        chunks.append((kind, raw[offset:offset + size]))
        offset += size
    require([c[0] for c in chunks] == [b'JSON', b'BIN\x00'], 'Expected JSON and embedded BIN GLB chunks')
    return json.loads(chunks[0][1]), chunks[1][1]


def write_glb_exclusive(path, document, binary):
    encoded = json.dumps(document, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode('utf-8')
    encoded += b' ' * ((-len(encoded)) % 4)
    size = 12 + 8 + len(encoded) + 8 + len(binary)
    require(size < 2 ** 32, 'GLB exceeds 32-bit container limit')
    with path.open('xb') as stream:
        stream.write(struct.pack('<4sII', b'glTF', 2, size))
        stream.write(struct.pack('<I4s', len(encoded), b'JSON'))
        stream.write(encoded)
        stream.write(struct.pack('<I4s', len(binary), b'BIN\x00'))
        stream.write(binary)


def accessor(document, binary, index):
    info = document['accessors'][index]
    require('sparse' not in info and not info.get('normalized', False), 'Unsupported sparse/normalized instance accessor')
    width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[info['type']]
    dtype = np.dtype({5126: '<f4', 5125: '<u4', 5123: '<u2', 5121: '<u1'}[info['componentType']])
    view = document['bufferViews'][info['bufferView']]
    require(view['buffer'] == 0, 'External buffer in GLB')
    offset = view.get('byteOffset', 0) + info.get('byteOffset', 0)
    stride = view.get('byteStride', width * dtype.itemsize)
    end = offset + max(0, info['count'] - 1) * stride + width * dtype.itemsize
    require(stride >= width * dtype.itemsize and end <= len(binary), 'Invalid accessor bounds')
    result = np.ndarray((info['count'], width), dtype=dtype, buffer=binary, offset=offset,
                        strides=(stride, dtype.itemsize))
    require(np.isfinite(result).all(), 'Nonfinite GLB accessor data')
    return result


def trs_matrix(translation=(0, 0, 0), rotation=(0, 0, 0, 1), scale=(1, 1, 1)):
    x, y, z, w = rotation
    return np.asarray(Matrix.LocRotScale(Vector(translation), Quaternion((w, x, y, z)), Vector(scale)), dtype=np.float64)


def validate_glb(document, binary, source_report, seat_records, batches, nonseat_batches, materials, palette):
    require(not document.get('cameras') and not document.get('animations') and not document.get('skins'),
            'Unexpected camera/animation/skin in GLB')
    forbidden = {'KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_meshopt_compression',
                 'KHR_texture_basisu', 'EXT_texture_webp', 'KHR_lights_punctual'}
    require(not forbidden.intersection(document.get('extensionsUsed', [])), 'GLB has decoder-dependent compression or lights')
    require('EXT_mesh_gpu_instancing' in document.get('extensionsUsed', []), 'Seat GPU instancing was not exported')
    require(len(document.get('buffers', [])) == 1 and 'uri' not in document['buffers'][0], 'GLB has external buffers')
    require(document['buffers'][0]['byteLength'] <= len(binary), 'GLB binary buffer truncated')
    for image in document.get('images', []):
        require('bufferView' in image and 'uri' not in image, f'Texture was not embedded: {image.get("name")}')
        require(image.get('mimeType') in {'image/png', 'image/jpeg'}, 'Texture requires a nonstandard image decoder')
        require(document['bufferViews'][image['bufferView']]['byteLength'] > 0, 'Empty embedded image')
    exported_materials = {m.get('name'): m for m in document.get('materials', [])}
    material_checks = []
    for row in materials['materials']:
        if row['name'] == 'MAT_NMS_Seats_MoteraReference':
            continue  # replaced exclusively by three copies, retaining other shader inputs
        require(row['name'] in exported_materials, f'Material disappeared: {row["name"]}')
        mat = exported_materials[row['name']]
        pbr = mat.get('pbrMetallicRoughness', {})
        if row['base_colour_images']:
            require('baseColorTexture' in pbr, f'Baked Base Color connection lost: {row["name"]}')
        if row['roughness_images']:
            require('metallicRoughnessTexture' in pbr, f'Baked roughness connection lost: {row["name"]}')
        if row['normal_images']:
            require('normalTexture' in mat, f'Baked normal connection lost: {row["name"]}')
        material_checks.append({'name': row['name'], 'connected_texture_slots_preserved': True})
    palette_materials = {}
    for colour, rgba in palette['linear_rgba'].items():
        name = f'WEB34C_SEATS_POLYMER_{colour.upper()}'
        require(name in exported_materials, f'Seat colour material missing: {name}')
        pbr = exported_materials[name].get('pbrMetallicRoughness', {})
        require('baseColorTexture' not in pbr and np.allclose(pbr.get('baseColorFactor', [1, 1, 1, 1]), rgba,
                                                            rtol=0, atol=1e-6), 'Seat colour swatch changed in GLB')
        palette_materials[name] = colour
    expected_groups = {r['name']: r for r in batches}
    expected_nonseats = {r['name']: r for r in nonseat_batches if r['triangles']}
    rendered_triangles, draw_batches, colour_counts = 0, 0, Counter()
    layer_counts, layer_triangles = Counter(), Counter()
    seat_matrices, seen, propagated = [], set(), []
    nodes = document.get('nodes', [])
    scene = document['scenes'][document.get('scene', 0)]

    def walk(index, parent_matrix, parent_layer=None):
        nonlocal rendered_triangles, draw_batches
        require(index not in seen, 'Repeated/cyclic node in exported scene')
        seen.add(index)
        node = nodes[index]
        local = (np.asarray(node['matrix'], dtype=np.float64).reshape(4, 4).T if 'matrix' in node
                 else trs_matrix(node.get('translation', (0, 0, 0)), node.get('rotation', (0, 0, 0, 1)),
                                 node.get('scale', (1, 1, 1))))
        world = parent_matrix @ local
        name = node.get('name', '')
        extras = node.setdefault('extras', {})
        layer = extras.get('stadiumLayer', parent_layer)
        if layer is None:
            layer = next((s for s in LAYERS if name.startswith(f'WEB34C_{s.upper()}_')), None)
        if 'mesh' in node:
            require(name.startswith('WEB34C_') and layer in LAYERS, f'Unexpected unclassified mesh: {name}')
            if extras.get('stadiumLayer') != layer:
                extras['stadiumLayer'] = layer
                propagated.append(name)
            mesh = document['meshes'][node['mesh']]
            primitives = mesh['primitives']
            tri_count = 0
            for primitive in primitives:
                require(primitive.get('mode', 4) == 4 and 'indices' in primitive, 'Only indexed triangle surfaces expected')
                require('NORMAL' in primitive['attributes'] and 'POSITION' in primitive['attributes'], 'Lost normals/positions')
                count = document['accessors'][primitive['indices']]['count']
                require(count % 3 == 0 and 'material' in primitive, 'Bad triangle indices/material')
                tri_count += count // 3
                mat = document['materials'][primitive['material']]
                texture_infos = []
                def textures(value):
                    if isinstance(value, dict):
                        for k, v in value.items():
                            if k.endswith('Texture') and isinstance(v, dict) and 'index' in v:
                                texture_infos.append(v)
                            textures(v)
                    elif isinstance(value, list):
                        for v in value:
                            textures(v)
                textures(mat)
                for info in texture_infos:
                    uv = info.get('extensions', {}).get('KHR_texture_transform', {}).get('texCoord', info.get('texCoord', 0))
                    require(f'TEXCOORD_{uv}' in primitive['attributes'], f'Material texture UV missing on {name}')
            extension = node.get('extensions', {}).get('EXT_mesh_gpu_instancing')
            instances = 1
            if extension:
                require(layer == 'seats', f'Unexpected non-seat instancing: {name}')
                attrs = extension['attributes']
                require('TRANSLATION' in attrs, 'Missing seat instance positions')
                translations = accessor(document, binary, attrs['TRANSLATION'])
                instances = len(translations)
                rotations = accessor(document, binary, attrs['ROTATION']) if 'ROTATION' in attrs else np.tile((0, 0, 0, 1), (instances, 1))
                scales = accessor(document, binary, attrs['SCALE']) if 'SCALE' in attrs else np.ones((instances, 3))
                require(len(rotations) == len(scales) == instances, 'Mismatched instance accessor counts')
                colour_names = {palette_materials[m['name']] for p in primitives
                                if (m := document['materials'][p['material']]).get('name') in palette_materials}
                require(len(colour_names) == 1, f'Unexpected seat polymer palette in {name}')
                colour = colour_names.pop()
                colour_counts[colour] += instances
                expected = expected_groups.get(name)
                require(expected is not None, f'Unrecognised exported seat batch: {name}')
                require(instances == expected['instances'] and tri_count == expected['triangles_per_instance'] and
                        colour == expected['colour'], f'Seat geometry/count/palette changed: {name}')
                seat_matrices.extend(world @ trs_matrix(t, r, s) for t, r, s in zip(translations, rotations, scales))
            else:
                require(layer != 'seats', 'Seat geometry was realized or prototype leaked into export')
                expected = expected_nonseats.pop(name, None)
                require(expected is not None, f'Unexpected non-seat batch: {name}')
                require(tri_count == expected['triangles'],
                        f'Non-seat triangle count changed: {name}: {expected["triangles"]} -> {tri_count}')
            rendered_triangles += tri_count * instances
            draw_batches += len(primitives)
            layer_counts[layer] += 1
            layer_triangles[layer] += tri_count * instances
        for child in node.get('children', []):
            walk(child, world, layer)

    for root in scene['nodes']:
        walk(root, np.eye(4))
    require(not expected_nonseats, f'Non-seat batches disappeared: {sorted(expected_nonseats)}')
    want = np.asarray([r[2] for r in seat_records], dtype=np.float64)
    # glTF uses X, Z, -Y; both prototype vertices and instance TRS are converted.
    conversion = np.asarray(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)), dtype=np.float64)
    want = conversion @ want @ conversion.T
    got = np.asarray(seat_matrices)
    require(len(got) == SEAT_COUNT, f'Exported visual seat count changed: {len(got)}')
    unique = len(np.unique(got[:, :3, 3], axis=0))
    require(unique == SEAT_COUNT, f'Exported unique seat positions changed: {unique}')
    want, got = want[position_order(want)], got[position_order(got)]
    transform_error = float(np.max(np.abs(want - got)))
    require(transform_error <= TRANSFORM_TOLERANCE, f'GLB world seat transforms changed by {transform_error}')
    require(dict(colour_counts) == source_report['seat_colour_counts'], 'Exported seat colour counts changed')
    require(rendered_triangles == source_report['expected_exported_triangles'],
            f'Exported rendered triangle count changed: {source_report["expected_exported_triangles"]} -> {rendered_triangles}')
    require(rendered_triangles <= MAX_TRIANGLES and draw_batches <= MAX_BATCHES, 'Exported geometry/material-batch budget exceeded')
    return {'rendered_triangles': rendered_triangles, 'material_batches': draw_batches,
            'visual_seat_count': len(got), 'unique_seat_positions': unique,
            'seat_colour_counts': dict(colour_counts), 'max_world_transform_abs_error': transform_error,
            'nodes': len(nodes), 'meshes': len(document['meshes']), 'materials': len(exported_materials),
            'embedded_images': len(document.get('images', [])), 'extensions_used': document.get('extensionsUsed', []),
            'layer_mesh_nodes': dict(layer_counts), 'layer_rendered_triangles': dict(layer_triangles),
            'material_checks': material_checks, 'stadium_layer_extras_propagated': propagated}


def preview_camera(source_scene):
    candidates = sorted((o for o in source_scene.objects if o.type == 'CAMERA' and 'AERIAL' in o.name.upper()),
                        key=lambda o: o.name)
    require(candidates, '--preview requires an existing source camera with AERIAL in its name')
    return candidates[0]


def make_scene(source):
    require(bpy.context.window is not None, 'Background Blender has no context window for scene isolation')
    scene = bpy.data.scenes.new('WEB34C_DISPOSABLE_EXPORT')
    scene.world = source.world
    scene.unit_settings.scale_length = 1.0
    enum(scene.unit_settings, 'system', 'METRIC')
    # Keep the saved frame; never reevaluate the original LODs at another frame.
    scene.frame_set(source.frame_current)
    bpy.context.window.scene = scene
    return scene


def render_preview(scene, source_scene, camera, destination, temporary):
    scene.collection.objects.link(camera)
    scene.camera = camera
    for obj in source_scene.objects:
        if obj.type == 'LIGHT':
            scene.collection.objects.link(obj)
    # Dynamic render-engine RNA under-reports engines. The saved enum value is
    # tried directly; Blender's TypeError is the authoritative supported list.
    try:
        scene.render.engine = source_scene.render.engine
    except TypeError as error:
        raise RuntimeError(f'Saved preview render engine unavailable: {error}') from error
    if hasattr(scene, 'cycles'):
        scene.cycles.samples = 16
        scene.cycles.use_denoising = True
    for attr in ('view_transform', 'look'):
        # OCIO enums are dynamic (static RNA reports only NONE). Copy the
        # observed saved setting and let Blender validate it in this context.
        try:
            setattr(scene.view_settings, attr, getattr(source_scene.view_settings, attr))
        except TypeError as error:
            raise RuntimeError(f'Saved preview colour setting unavailable: {error}') from error
    scene.view_settings.exposure = source_scene.view_settings.exposure
    scene.view_settings.gamma = source_scene.view_settings.gamma
    scene.render.resolution_x = 768
    scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    enum(scene.render.image_settings, 'file_format', 'PNG')
    enum(scene.render.image_settings, 'color_mode', 'RGBA')
    scene.render.film_transparent = source_scene.render.film_transparent
    scene.render.filepath = str(temporary)
    require(not temporary.exists(), 'Preview staging output already exists')
    result = bpy.ops.render.render(write_still=True)
    require('FINISHED' in result and temporary.is_file(), 'Aerial preview render failed')
    with temporary.open('rb') as source, destination.open('xb') as output:
        shutil.copyfileobj(source, output)
    return {'path': str(destination), 'source_camera': camera.name, 'resolution': [768, 512],
            'engine': scene.render.engine, 'samples_if_cycles': 16,
            'scope': 'small render of rebuilt exact geometry, saved world/lights/camera; no visual verdict'}


def run(args, report):
    require(bpy.app.background, 'This exporter must run in a NEW headless Blender process')
    require(tuple(bpy.app.version) == (5, 2, 2), f'Expected Blender 5.2.2, got {bpy.app.version_string}')
    require(Path(bpy.data.filepath).name == SOURCE.name and Path(bpy.data.filepath).resolve() == SOURCE.resolve(),
            f'Open the exact SAVED source checkpoint before running: {SOURCE}')
    require(not bpy.data.is_dirty, 'Source has unsaved changes; start a fresh background process from the saved file')
    report['protected_hashes_before'] = protected_hashes()
    source_scene = bpy.context.scene
    require(abs(source_scene.unit_settings.scale_length - 1.0) < 1e-9,
            'Source is not one metre per Blender unit; refusing an implicit scale change')
    camera = preview_camera(source_scene) if args.preview else None
    report['input'] = {'checkpoint': SOURCE.name, 'sha256': SOURCE_SHA256,
                       'blender_version': bpy.app.version_string, 'frame': source_scene.frame_current,
                       'view_layer': bpy.context.view_layer.name, 'objects': len(bpy.data.objects),
                       'materials': len(bpy.data.materials), 'images': len(bpy.data.images),
                       'unit_scale_metres': source_scene.unit_settings.scale_length}
    palette, polymer, report['palette'] = load_validate_palette()
    groups, prototypes, seats, used_materials, report['source'] = capture(palette)
    report['materials'] = material_audit(used_materials)
    source_material_state = json.dumps(report['materials'], sort_keys=True)
    audit_by_material = {row['name']: row for row in report['materials']['materials']}
    for (_, material_name, uv_names, _), group in groups.items():
        required_uv = set(audit_by_material[material_name]['named_uv_layers'])
        require(required_uv.issubset(uv_names),
                f'Material {material_name} needs missing UV layers {required_uv - set(uv_names)} on {sorted(group["names"])}')
    variants = polymer_variants(polymer, palette)
    scene = make_scene(source_scene)
    nonseat_objects, report['nonseat_batches'] = make_nonseat(scene, groups)
    seat_objects, report['seat_batches'], decomposition_error = make_seats(scene, prototypes, seats, variants)
    report['seat_rebuild'] = validate_seats(seat_objects, seats)
    report['seat_rebuild']['max_source_decomposition_error'] = decomposition_error
    removed = sum(row['zero_area_removed'] for row in report['nonseat_batches'])
    nonseat_triangles = sum(row['triangles'] for row in report['nonseat_batches'])
    seat_triangles = sum(row['rendered_triangles'] for row in report['seat_batches'])
    require(nonseat_triangles + removed == report['source']['evaluated_nonseat_triangles'], 'Non-seat surfaces lost')
    require(seat_triangles == report['source']['evaluated_seat_triangles'], 'Seat geometry changed')
    expected = nonseat_triangles + seat_triangles
    report['source']['expected_exported_triangles'] = expected
    material_batches = len(nonseat_objects) + sum(r['material_batches'] for r in report['seat_batches'])
    require(expected <= MAX_TRIANGLES and material_batches <= MAX_BATCHES, 'Pre-export budget rejected')
    require(len(used_materials) + 3 <= MAX_BATCHES, 'Pre-export material count rejected')
    require(json.dumps(material_audit(used_materials), sort_keys=True) == source_material_state,
            'An original material/packed image was modified during construction')
    report['geometry'] = {'nonseat_triangles': nonseat_triangles, 'seat_rendered_triangles': seat_triangles,
                          'rendered_triangles': expected, 'material_batches': material_batches,
                           'nonseat_zero_area_at_export_precision_removed': removed,
                           'nonseat_duplicate_topology_faces_preserved': sum(row['duplicate_topology_faces_preserved'] for row in report['nonseat_batches']),
                          'nonseat_float32_collapsed_triangles_removed': sum(row['float32_collapsed_removed'] for row in report['nonseat_batches']),
                          'maximum_collapsed_source_area_m2': max(row['maximum_collapsed_source_area_m2'] for row in report['nonseat_batches']),
                          'seat_triangles_removed': 0, 'original_material_texture_state_unchanged': True,
                          'policy': 'no proxies, decimation, LOD choice changes, seat removals, or shell repairs'}
    report['limits'] = {'max_rendered_triangles': MAX_TRIANGLES, 'max_material_batches': MAX_BATCHES,
                        'missing_packed_textures_allowed': 0,
                        'float32_trs_absolute_tolerance': TRANSFORM_TOLERANCE,
                        'origin_and_uv_rebuild': 'bit-exact float32', 'normal_minimum_dot': 0.99999}
    for obj in scene.objects:
        obj.select_set(False)
    for obj in nonseat_objects + seat_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = seat_objects[0]
    with tempfile.TemporaryDirectory(prefix='.step34c-export-', dir=args.output.parent) as directory:
        temporary = Path(directory)
        staging = temporary / 'export.glb'
        options = export_options(staging)
        report['export_options'] = {**options, 'filepath': '<new temporary GLB; validated before exclusive publish>'}
        require(not staging.exists(), 'Refusing to overwrite even a staging GLB')
        start = time.monotonic()
        result = bpy.ops.export_scene.gltf(**options)
        require('FINISHED' in result and staging.is_file(), 'glTF export failed')
        report['export_seconds'] = time.monotonic() - start
        document, binary = read_glb(staging)
        report['glb_validation'] = validate_glb(document, binary, report['source'], seats,
                                              report['seat_batches'], report['nonseat_batches'], report['materials'], report['palette'])
        document['asset'].setdefault('extras', {}).update({
            'source_checkpoint': SOURCE.name, 'source_sha256': SOURCE_SHA256,
            'visual_seat_count': SEAT_COUNT, 'seat_colour_counts': report['source']['seat_colour_counts'],
            'unit_metres': 1.0, 'up_axis': '+Y',
            'geometry_policy': 'saved evaluated geometry with export-degenerate non-seat faces excluded; original baked textures and fixed Motera polymer variants',
            'export_degenerate_nonseat_triangles_removed': removed,
            'overlapping_nonseat_faces_preserved': report['geometry']['nonseat_duplicate_topology_faces_preserved'],
        })
        report['protected_hashes_after_export'] = protected_hashes()
        if args.preview:
            report['preview'] = render_preview(scene, source_scene, camera, args.preview, temporary / 'aerial.png')
        # GLB JSON metadata is patched only while publishing to a NEW file. The
        # staging GLB is read-only after export; no existing GLB is overwritten.
        write_glb_exclusive(args.output, document, binary)
        report['output'] = {'path': str(args.output), 'bytes': args.output.stat().st_size,
                            'sha256': sha256(args.output), 'asset_extras': document['asset']['extras']}
    report['validation_scope'] = {
        'automated': 'source/hash/palette, evaluated triangles, seat geometry/TRS/counts, object material overrides, '
                     'packed textures/UVs/normals, GLB structure/instancing/material paths/budgets',
        'not_performed': 'visual comparison, browser GPU/runtime benchmark, independent Khronos validator',
        'texture_note': 'glTF may repack roughness/metallic channels; embedded image count need not equal source image count',
        'precision_note': 'world-space non-seat positions are rounded once to glTF float32; no tolerance-based geometry simplification',
    }


def main():
    args = parse_args()
    report = {'status': 'running', 'script': 'scripts/export_step34c.py',
              'source_checkpoint': SOURCE.name, 'source_sha256': SOURCE_SHA256}
    started = time.monotonic()
    failure = None
    try:
        run(args, report)
        report['status'] = 'passed_automated_checks'
    except Exception as error:
        failure = error
        report['status'] = 'failed'
        report['error'] = str(error)
        report['traceback'] = traceback.format_exc()
    finally:
        try:
            report['protected_hashes_after'] = protected_hashes()
        except Exception as error:
            report['status'] = 'failed'
            report['protected_input_error'] = str(error)
            failure = failure or error
        report['total_seconds'] = time.monotonic() - started
        # x mode protects the report even if another process creates its path mid-run.
        with args.report.open('x', encoding='utf-8') as output:
            json.dump(report, output, indent=2, sort_keys=True, allow_nan=False)
            output.write('\n')
    if failure is not None:
        raise RuntimeError(f'STEP34-C export failed; report: {args.report}') from failure
    print(json.dumps({'status': report['status'], 'output': report['output'],
                      'report': str(args.report)}, sort_keys=True), flush=True)


if __name__ == '__main__':
    main()
