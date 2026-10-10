"""Check the copied native checkpoint and image/container integrity without a render.

blender --factory-startup --background --disable-autoexec made/blend/Narendra_Modi_Stadium_STEP34C.blend
  --python-exit-code 1 --python scripts/check_step34c_delivery.py -- --output made

Open only the delivered copy. This deliberately does not import the large FBX
or render the stadium on a nearly-full system disk. Those gaps stay explicit.
"""

import argparse
import json
from pathlib import Path
import struct
import sys
import zlib

import bpy

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import package_step34c as package


def check_png(path):
    """Check complete PNG chunk CRCs and all non-interlaced decompressed scanlines."""
    raw = path.read_bytes()
    package.require(raw[:8] == package.PNG, 'Not a PNG: ' + str(path))
    offset, compressed, header, ended = 8, bytearray(), None, False
    while offset < len(raw):
        package.require(offset + 12 <= len(raw), 'Truncated PNG chunk')
        length, kind = struct.unpack_from('>I4s', raw, offset)
        package.require(offset + 12 + length <= len(raw), 'Truncated PNG chunk data')
        data = raw[offset + 8:offset + 8 + length]
        crc = struct.unpack_from('>I', raw, offset + 8 + length)[0]
        package.require(zlib.crc32(kind + data) & 0xffffffff == crc, 'PNG chunk CRC mismatch')
        if kind == b'IHDR':
            package.require(header is None and offset == 8 and length == 13, 'Invalid IHDR')
            header = struct.unpack('>IIBBBBB', data)
        elif kind == b'IDAT':
            compressed.extend(data)
        elif kind == b'IEND':
            package.require(length == 0 and offset + 12 == len(raw), 'Invalid IEND/trailing data')
            ended = True
        offset += length + 12
    package.require(ended and header and compressed, 'Incomplete PNG')
    width, height, depth, colour, compression, filtering, interlace = header
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}.get(colour)
    package.require(channels and depth in {1, 2, 4, 8, 16} and width and height, 'Invalid PNG format')
    package.require((compression, filtering, interlace) == (0, 0, 0), 'Unsupported PNG layout')
    stride = (width * channels * depth + 7) // 8 + 1
    expected = stride * height
    package.require(expected < 128 * 1024 ** 2, 'PNG exceeds validation memory allowance')
    decoder = zlib.decompressobj()
    rows = decoder.decompress(bytes(compressed), expected + 1)
    package.require(decoder.eof and not decoder.unused_data and not decoder.unconsumed_tail
                    and len(rows) == expected, 'PNG scanline size/zlib stream mismatch')
    package.require(all(rows[i] <= 4 for i in range(0, len(rows), stride)), 'Invalid PNG row filter')
    return {'width': width, 'height': height, 'bit_depth': depth, 'colour_type': colour}


def run(output):
    inputs, doc, binary, checks = package.load_source()
    package.verify_delivery(output, doc, binary)
    native = output / package.INPUTS[0][1]
    package.require(bpy.app.background and Path(bpy.data.filepath).resolve() == native.resolve(),
                    'Open the delivered native copy in a fresh background Blender process')
    package.require(not bpy.data.is_dirty and not bpy.data.libraries, 'Dirty/externally linked native scene')
    missing, packed = [], 0
    for image in bpy.data.images:
        if image.source not in {'FILE', 'TILED'}:
            continue
        if image.packed_file or image.packed_files:
            packed += 1
        else:
            missing.append(image.name)
    package.require(not missing, 'Native copy contains unpacked image dependencies: ' + repr(missing))
    package.require(not bpy.data.cache_files and not bpy.data.movieclips and not bpy.data.sounds,
                    'Native checkpoint has unaudited cache/media dependencies')
    package.require(all(font.filepath == '<builtin>' for font in bpy.data.fonts), 'External font dependency')
    png_files = sorted((output / 'gltf/textures').glob('*.png')) + sorted((output / 'textures').glob('*.png'))
    package.require(len(png_files) == 204, 'Expected 102 glTF and 102 source texture PNGs')
    images = [{'path': path.relative_to(output).as_posix(), **check_png(path)} for path in png_files]
    report_path = output / 'reports/interchange-export.json'
    interchange = json.loads(report_path.read_text())
    files = []
    for kind, result in interchange['formats'].items():
        if result['status'] != 'passed_structural_checks':
            continue
        path = output / result['path']
        package.require(package.sha256(path) == result['sha256'] and path.stat().st_size == result['bytes'],
                        'Interchange output changed after its container check: ' + kind)
        files.append({'format': kind, 'path': result['path'], 'sha256': result['sha256']})
    package.require(package.pinned_inputs() == inputs, 'Protected originals changed')
    return {'status': 'passed_scoped_checks', 'blender_version': bpy.app.version_string,
            'native_copy': {'path': native.relative_to(output).as_posix(), 'opened': True,
                            'objects': len(bpy.data.objects), 'scenes': len(bpy.data.scenes),
                            'images': len(bpy.data.images), 'packed_file_images': packed,
                            'linked_libraries': 0, 'unpacked_image_dependencies': missing,
                            'saved_or_modified': False},
            'glb_gltf_structure': checks, 'images_checked': len(images), 'png_checks': images,
            'png_scope': 'All chunk CRCs, zlib scanline decompression and filter-byte validity; not rendered pixels',
            'interchange_hashes_still_match': files, 'protected_inputs_unchanged': True,
            'not_performed': ['FBX fresh-import roundtrip (low disk headroom)',
                              'GPU/visual comparison', 'other DCC/renderer/version compatibility',
                              'rights or commercial-license clearance']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='made')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    output = package.local_path(args.output)
    report = run(output)
    with (output / 'reports/delivery-check.json').open('x') as stream:
        json.dump(report, stream, indent=2, sort_keys=True, allow_nan=False)
        stream.write('\n')
    print(json.dumps({'status': report['status'], 'native_copy_opened': True,
                      'png_images_checked': report['images_checked']}), flush=True)


if __name__ == '__main__':
    main()
