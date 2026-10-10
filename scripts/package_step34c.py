"""Package the pinned textured STEP34-C asset without Blender or dependencies.

  python3 scripts/package_step34c.py init [--output made]
  python3 scripts/package_step34c.py finalize [--output made]
  python3 scripts/package_step34c.py --self-test

Paths are workspace-relative (absolute paths within it also work). Add other
delivery files between init and finalize. Every write is exclusive; a failed
operation can leave a partial new delivery, which is never overwritten.
"""

import argparse
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import struct
import sys


ROOT = Path(__file__).resolve().parent.parent
STEM = 'Narendra_Modi_Stadium_STEP34C'
INPUTS = (
    ('sources/narendra-modi-stadium/detailed/step34-finalization/'
     'step34_C_motera_reference_seat_colours.blend', 'blend/' + STEM + '.blend',
     'b163a586462f280f8f5d1446645c6142e4fe109059366d3b68a6a4823fb8786d'),
    ('public/models/narendra-modi-stadium/step34-c-motera.glb', 'glb/' + STEM + '.glb',
     '06a237422c26586338095995b232af895905ab82cd0d0333ba749db9e8866daa'),
)
EXPECTED = (27604, 4847635, 102)  # seat instances, rendered triangles, images
FINAL_FILES = ('manifest.json', 'SHA256SUMS')
PNG = b'\x89PNG\r\n\x1a\n'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def integer(value, minimum=0):
    return type(value) is int and value >= minimum


def ref(items, index, label):
    require(isinstance(items, list) and integer(index) and index < len(items),
            'Invalid ' + label + ' index: ' + repr(index))
    return items[index]


def local_path(raw):
    path = Path(raw).expanduser()
    path = path if path.is_absolute() else ROOT / path
    require('..' not in path.parts, 'Parent traversal is not allowed')
    relative = path.relative_to(ROOT)  # rejects destinations outside the workspace
    require(relative.parts, 'The workspace itself cannot be a delivery')
    current = ROOT
    for part in relative.parts:
        current = current / part
        require(not current.is_symlink(), 'Symlink refused: ' + str(current))
    return path


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def pinned_inputs():
    records = []
    for source, destination, expected in INPUTS:
        path = local_path(source)
        require(path.is_file(), 'Missing input: ' + source)
        actual = sha256(path)
        require(actual == expected, 'Source SHA256 mismatch: ' + source)
        records.append({'path': source, 'bytes': path.stat().st_size,
                        'sha256': actual, 'copied_to': destination})
    return records


def json_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate JSON property: ' + key)
        result[key] = value
    return result


def read_json(raw):
    return json.loads(raw.decode('utf-8'), object_pairs_hook=json_object)


def parse_glb(raw):
    require(len(raw) >= 28, 'Truncated GLB')
    magic, version, length = struct.unpack_from('<4sII', raw)
    require(magic == b'glTF' and version == 2 and length == len(raw), 'Invalid GLB 2 header')
    chunks, offset = [], 12
    while offset < length:
        require(offset + 8 <= length, 'Truncated GLB chunk header')
        size, kind = struct.unpack_from('<I4s', raw, offset)
        offset += 8
        require(size > 0 and size % 4 == 0 and offset + size <= length, 'Invalid GLB chunk size')
        chunks.append((kind, memoryview(raw)[offset:offset + size]))
        offset += size
    require([kind for kind, _ in chunks] == [b'JSON', b'BIN\0'], 'Expected exactly JSON then BIN chunks')
    document = read_json(bytes(chunks[0][1]))
    require(isinstance(document, dict), 'GLB JSON must be an object')
    return document, chunks[1][1]


def validate_glb(document, binary, expected=EXPECTED):
    """Strict checks for this uncompressed, indexed, GPU-instanced asset profile."""
    def embedded(value):
        if isinstance(value, dict):
            require('uri' not in value, 'Source GLB must not contain any URI')
            for child in value.values():
                embedded(child)
        elif isinstance(value, list):
            for child in value:
                embedded(child)
        elif isinstance(value, float):
            require(math.isfinite(value), 'Nonfinite JSON number')

    embedded(document)
    require(document.get('asset', {}).get('version') == '2.0', 'Expected glTF 2.0')
    buffers = document.get('buffers', [])
    require(len(buffers) == 1, 'Expected a single embedded buffer')
    length = buffers[0].get('byteLength')
    require(integer(length, 1) and 0 <= len(binary) - length <= 3, 'Invalid BIN buffer length/padding')
    require(not any(binary[length:]), 'BIN padding must be zero')
    views = document.get('bufferViews', [])
    for view in views:
        start, size = view.get('byteOffset', 0), view.get('byteLength')
        require(view.get('buffer') == 0 and integer(start) and integer(size, 1)
                and start + size <= length, 'Invalid bufferView bounds')

    accessors, layouts = document.get('accessors', []), []
    widths = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
    components = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}
    for accessor in accessors:
        require('sparse' not in accessor and not accessor.get('normalized', False),
                'Sparse/normalized accessors are outside this asset profile')
        kind, component, count = accessor.get('type'), accessor.get('componentType'), accessor.get('count')
        require(kind in widths and component in components and integer(count, 1), 'Invalid accessor format/count')
        view = ref(views, accessor.get('bufferView'), 'accessor bufferView')
        fmt = struct.Struct('<' + components[component] * widths[kind])
        offset, stride = accessor.get('byteOffset', 0), view.get('byteStride', fmt.size)
        require(integer(offset) and integer(stride, fmt.size), 'Invalid accessor offset/stride')
        require('byteStride' not in view or (stride % 4 == 0 and stride <= 252), 'Invalid explicit byteStride')
        start = view.get('byteOffset', 0) + offset
        require(start % (fmt.size // widths[kind]) == 0
                and offset + (count - 1) * stride + fmt.size <= view['byteLength'], 'Accessor exceeds its bufferView')
        layouts.append((fmt, start, stride, count))

    def rows(index):
        fmt, start, stride, count = ref(layouts, index, 'accessor')
        if stride == fmt.size:
            return fmt.iter_unpack(binary[start:start + count * stride])
        return (fmt.unpack_from(binary, start + i * stride) for i in range(count))

    for index, accessor in enumerate(accessors):
        if accessor['componentType'] == 5126:
            require(all(math.isfinite(v) for row in rows(index) for v in row),
                    'Nonfinite accessor values: ' + str(index))

    images = document.get('images', [])
    for image in images:
        view = ref(views, image.get('bufferView'), 'image bufferView')
        start = view.get('byteOffset', 0)
        data = binary[start:start + view['byteLength']]
        require('byteStride' not in view and image.get('mimeType') == 'image/png', 'Expected embedded PNG image')
        require(len(data) >= 33 and data[:8] == PNG and data[8:16] == b'\0\0\0\rIHDR', 'Invalid PNG header')
        require(all(struct.unpack_from('>II', data, 16)), 'PNG dimensions must be positive')
    for texture in document.get('textures', []):
        ref(images, texture.get('source'), 'texture image')
        if 'sampler' in texture:
            ref(document.get('samplers', []), texture['sampler'], 'texture sampler')

    position_ids, mesh_triangles, primitive_count = set(), [], 0
    for mesh in document.get('meshes', []):
        triangles = 0
        require(mesh.get('primitives'), 'Mesh has no primitives')
        for primitive in mesh['primitives']:
            require(primitive.get('mode', 4) == 4, 'Expected triangle primitives')
            attrs = primitive.get('attributes', {})
            position = ref(accessors, attrs.get('POSITION'), 'POSITION accessor')
            require(position['type'] == 'VEC3' and position['componentType'] == 5126, 'Expected float VEC3 positions')
            position_ids.add(attrs['POSITION'])
            for index in attrs.values():
                require(ref(accessors, index, 'vertex attribute')['count'] == position['count'], 'Mismatched vertex counts')
            indices = ref(accessors, primitive.get('indices'), 'index accessor')
            require(indices['type'] == 'SCALAR' and indices['componentType'] in (5121, 5123, 5125)
                    and indices['count'] % 3 == 0, 'Invalid triangle indices')
            require(all(row[0] < position['count'] for row in rows(primitive['indices'])), 'Triangle index out of bounds')
            if 'material' in primitive:
                ref(document.get('materials', []), primitive['material'], 'material')
            triangles += indices['count'] // 3
            primitive_count += 1
        mesh_triangles.append(triangles)
    require(position_ids, 'No mesh positions')

    nodes, seen = document.get('nodes', []), set()
    scene = ref(document.get('scenes', []), document.get('scene', 0), 'default scene')
    pending = list(scene.get('nodes', []))
    seats = rendered = 0
    while pending:
        index = pending.pop()
        node = ref(nodes, index, 'scene node')
        require(index not in seen, 'Repeated/cyclic scene node')
        seen.add(index)
        for key, width in (('matrix', 16), ('translation', 3), ('rotation', 4), ('scale', 3)):
            if key in node:
                require(isinstance(node[key], list) and len(node[key]) == width
                        and all(type(v) in (int, float) and math.isfinite(v) for v in node[key]), 'Invalid node transform')
        instances = 1
        extension = node.get('extensions', {}).get('EXT_mesh_gpu_instancing')
        if extension is not None:
            require('mesh' in node and node.get('extras', {}).get('stadiumLayer') == 'seats', 'Unexpected non-seat instancing')
            attrs = extension.get('attributes', {})
            translation = ref(accessors, attrs.get('TRANSLATION'), 'instance TRANSLATION')
            instances = translation['count']
            for key, index in attrs.items():
                item = ref(accessors, index, 'instance attribute')
                require(item['count'] == instances, 'Mismatched instance counts')
                if key in ('TRANSLATION', 'ROTATION', 'SCALE'):
                    require(item['componentType'] == 5126 and item['type'] == ('VEC4' if key == 'ROTATION' else 'VEC3'),
                            'Invalid instance transform accessor')
            seats += instances
        if 'mesh' in node:
            rendered += ref(mesh_triangles, node['mesh'], 'mesh') * instances
        pending.extend(node.get('children', []))
    require((seats, rendered, len(images)) == expected,
            'Unexpected seats/triangles/images: ' + repr((seats, rendered, len(images))))
    return {'glb_container': 'GLB 2; JSON + BIN', 'external_uris': 0,
            'instanced_seats': seats, 'rendered_triangles': rendered, 'embedded_png_images': len(images),
            'png_headers_and_positive_dimensions_checked': True, 'buffer_views': len(views),
            'accessor_bounds_checked': len(accessors), 'all_float_accessors_finite': True,
            'position_accessors': len(position_ids), 'positions_checked': sum(accessors[i]['count'] for i in position_ids),
            'positive_position_counts': True, 'finite_position_coordinates': True,
            'triangle_indices_in_bounds': True, 'meshes': len(mesh_triangles), 'primitives': primitive_count,
            'default_scene_nodes': len(seen), 'nodes': len(nodes),
            'materials': len(document.get('materials', [])), 'extensions_used': document.get('extensionsUsed', [])}


def separated_document(document):
    result = copy.deepcopy(document)
    result['buffers'][0]['uri'] = STEM + '.bin'
    for index, image in enumerate(result['images']):
        del image['bufferView']
        image['uri'] = 'textures/image_{:03d}.png'.format(index)
    return result


def image_files(document, binary):
    for index, image in enumerate(document['images']):
        view = document['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        yield 'textures/image_{:03d}.png'.format(index), binary[start:start + view['byteLength']]


def json_bytes(value):
    return (json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False, allow_nan=False) + '\n').encode('utf-8')


def write_new(path, data):
    with path.open('xb') as stream:
        stream.write(data)


def load_source():
    inputs = pinned_inputs()
    raw = local_path(INPUTS[1][0]).read_bytes()
    require(hashlib.sha256(raw).hexdigest() == INPUTS[1][2], 'GLB changed during validation')
    document, binary = parse_glb(raw)
    return inputs, document, binary, validate_glb(document, binary)


def equal_bytes(path, expected):
    path = local_path(path)
    require(path.is_file() and path.stat().st_size == len(expected), 'Missing or wrong-sized file: ' + str(path))
    with path.open('rb') as stream:
        for offset in range(0, len(expected), 4 * 1024 * 1024):
            require(stream.read(4 * 1024 * 1024) == expected[offset:offset + 4 * 1024 * 1024],
                    'Bytes differ: ' + str(path))
        require(not stream.read(1), 'File grew during validation: ' + str(path))


def verify_delivery(output, document, binary):
    for _, destination, expected in INPUTS:
        path = local_path(output / destination)
        require(path.is_file() and sha256(path) == expected, 'Copied source SHA256 mismatch: ' + destination)
    gltf = local_path(output / 'gltf' / (STEM + '.gltf'))
    require(json_bytes(read_json(gltf.read_bytes())) == json_bytes(separated_document(document)),
            'glTF differs beyond permitted URI/image edits')
    equal_bytes(output / 'gltf' / (STEM + '.bin'), binary)
    for uri, data in image_files(document, binary):
        equal_bytes(output / 'gltf' / uri, data)


def provenance(inputs, checks, binary):
    return {'schema_version': 1, 'asset': STEM, 'inputs': inputs,
            'compatibility': {'source_blender_version': '5.2.2',
                              'basis': 'Pinned STEP34-C source, copied byte-for-byte',
                              'blender_open_test_performed': False},
            'structural_checks': checks,
            'conversion': {'source_copy_hashes_match': True, 'gltf_document_matches_permitted_edits': True,
                           'binary_byte_identical': True, 'binary_bytes': len(binary),
                           'binary_sha256': hashlib.sha256(binary).hexdigest(),
                           'extracted_images_byte_identical': checks['embedded_png_images'],
                           'edits': 'Add relative buffer URI; replace each image bufferView with indexed relative PNG URI.',
                           'binary_policy': 'The full BIN chunk, including original trailing padding and now-unused image bytes, '
                                            'is retained for bit-exact geometry. Original bufferViews are preserved.'},
            'validation_scope': 'Pinned hashes, file bytes and GLB/glTF structure; no rendering or Blender execution.'}


def initialize(output):
    require(output.parent.is_dir(), 'Output parent must already exist')
    require(not os.path.lexists(output), 'Refusing existing output: ' + str(output))
    inputs, document, binary, checks = load_source()
    output.mkdir()  # exclusive directory creation after validating all inputs
    for directory in ('blend', 'glb', 'gltf', 'gltf/textures', 'reports'):
        (output / directory).mkdir()
    for source, destination, _ in INPUTS:
        with local_path(source).open('rb') as src, (output / destination).open('xb') as dst:
            shutil.copyfileobj(src, dst, 4 * 1024 * 1024)
    write_new(output / 'gltf' / (STEM + '.gltf'), json_bytes(separated_document(document)))
    write_new(output / 'gltf' / (STEM + '.bin'), binary)
    for uri, data in image_files(document, binary):
        write_new(output / 'gltf' / uri, data)
    verify_delivery(output, document, binary)
    require(pinned_inputs() == inputs, 'Sources changed during packaging')
    write_new(output / 'reports/provenance.json', json_bytes(provenance(inputs, checks, binary)))
    print('Initialized ' + str(output.relative_to(ROOT)) + '; add delivery files, then run finalize.')


def delivery_files(output):
    result = []
    def walk_error(error):
        raise error
    for directory, dirs, files in os.walk(output, followlinks=False, onerror=walk_error):
        for name in dirs + files:
            path = local_path(Path(directory) / name)
            relative = path.relative_to(output).as_posix()
            require(all(ord(c) >= 32 and ord(c) != 127 for c in relative) and '\\' not in relative,
                    'Filename cannot be represented safely in SHA256SUMS: ' + relative)
            if name in dirs:
                require(path.is_dir(), 'Expected directory: ' + relative)
            else:
                require(path.is_file(), 'Not a regular delivery file: ' + relative)
                if relative not in FINAL_FILES:
                    result.append(path)
    return sorted(result)


def finalize(output):
    require(output.is_dir(), 'Delivery directory does not exist')
    require(not any(os.path.lexists(output / name) for name in FINAL_FILES), 'Finalization outputs already exist')
    delivery_files(output)  # refuse all symlinks/special files before reading the package
    inputs, document, binary, checks = load_source()
    verify_delivery(output, document, binary)
    expected_report = provenance(inputs, checks, binary)
    require(json_bytes(read_json((output / 'reports/provenance.json').read_bytes())) == json_bytes(expected_report),
            'Provenance report differs')
    entries = [{'path': path.relative_to(output).as_posix(), 'bytes': path.stat().st_size, 'sha256': sha256(path)}
               for path in delivery_files(output)]
    manifest = {'schema_version': 1, 'asset': STEM, 'provenance': 'reports/provenance.json',
                'excluded_from_inventory': list(FINAL_FILES), 'files': entries}
    sums = ''.join(item['sha256'] + '  ' + item['path'] + '\n' for item in entries).encode('utf-8')
    # Reserve BOTH names exclusively before writing either payload.
    with (output / FINAL_FILES[0]).open('xb') as manifest_file, (output / FINAL_FILES[1]).open('xb') as checksum_file:
        manifest_file.write(json_bytes(manifest))
        checksum_file.write(sums)
    print('Finalized {}: {} delivery files inventoried.'.format(output.relative_to(ROOT), len(entries)))


def self_test():
    import zlib

    def png_chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)

    png = (PNG + png_chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
           + png_chunk(b'IDAT', zlib.compress(b'\0\xff\0\0')) + png_chunk(b'IEND', b''))
    binary = struct.pack('<9f3H2x3f', -1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 2, 3, 4, 5) + png
    document = {
        'asset': {'version': '2.0'}, 'buffers': [{'byteLength': len(binary)}],
        'bufferViews': [{'buffer': 0, 'byteOffset': start, 'byteLength': length}
                        for start, length in ((0, 36), (36, 6), (44, 12), (56, len(png)))],
        'accessors': [{'bufferView': view, 'componentType': component, 'count': count, 'type': kind}
                      for view, component, count, kind in ((0, 5126, 3, 'VEC3'), (1, 5123, 3, 'SCALAR'), (2, 5126, 1, 'VEC3'))],
        'meshes': [{'primitives': [{'attributes': {'POSITION': 0}, 'indices': 1}]}],
        'nodes': [{'mesh': 0, 'extras': {'stadiumLayer': 'seats'},
                   'extensions': {'EXT_mesh_gpu_instancing': {'attributes': {'TRANSLATION': 2}}}}],
        'scenes': [{'nodes': [0]}], 'scene': 0, 'extensionsUsed': ['EXT_mesh_gpu_instancing'],
        'images': [{'bufferView': 3, 'mimeType': 'image/png', 'name': '../../unsafe.png'}],
        'textures': [{'source': 0}],
    }

    def container(doc, data):
        encoded = json_bytes(doc)
        encoded += b' ' * (-len(encoded) % 4)
        data += b'\0' * (-len(data) % 4)
        return (struct.pack('<4sII', b'glTF', 2, 28 + len(encoded) + len(data))
                + struct.pack('<I4s', len(encoded), b'JSON') + encoded
                + struct.pack('<I4s', len(data), b'BIN\0') + data)

    good = container(document, binary)
    parsed, payload = parse_glb(good)
    require(validate_glb(parsed, payload, (1, 1, 1))['positions_checked'] == 3, 'Positive fixture failed')
    converted = separated_document(parsed)
    restored = copy.deepcopy(converted)
    del restored['buffers'][0]['uri']
    restored['images'] = copy.deepcopy(parsed['images'])
    require(restored == document and payload[:len(binary)] == binary, 'Lossless separation failed')
    uri, image_bytes = next(image_files(parsed, payload))
    require(uri == converted['images'][0]['uri'] == 'textures/image_000.png' and image_bytes == png, 'PNG extraction failed')
    malformed = [good[:-1], b'FAIL' + good[4:]]
    for table, field, value in (('images', 'uri', '../external.png'), ('bufferViews', 'byteOffset', -1),
                               ('accessors', 'count', 0), ('nodes', 'children', [0])):
        bad = copy.deepcopy(document)
        bad[table][0][field] = value
        malformed.append(container(bad, binary))
    malformed.extend((container(document, struct.pack('<f', float('nan')) + binary[4:]),
                      container(document, binary[:56] + b'BADIMAGE' + binary[64:]),
                      container(document, binary[:36] + struct.pack('<H', 3) + binary[38:])))
    for raw in malformed:
        try:
            doc, data = parse_glb(raw)
            validate_glb(doc, data, (1, 1, 1))
        except ValueError:
            continue
        raise AssertionError('Malformed GLB was accepted')
    print('PASS: positive GLB, lossless separation/PNG extraction, {} malformed GLBs rejected.'.format(len(malformed)))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('command', nargs='?', choices=('init', 'finalize'))
    parser.add_argument('--output', default='made', help='Workspace-local delivery directory (default: made)')
    parser.add_argument('--self-test', action='store_true', help='Run in-memory GLB checks without creating delivery files')
    args = parser.parse_args()
    if args.self_test:
        require(args.command is None, '--self-test cannot be combined with a command')
        self_test()
    else:
        require(args.command is not None, 'Choose init or finalize, or use --self-test')
        output = local_path(args.output)
        (initialize if args.command == 'init' else finalize)(output)


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, struct.error) as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
