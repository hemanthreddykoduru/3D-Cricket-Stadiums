"""Full, static interchange exports of the saved textured STEP34-C checkpoint.

Run in a NEW Blender 5.2.2 process with --factory-startup --background
--disable-autoexec <STEP34-C.blend> --python-exit-code 1 --python this_script --
--output made --formats fbx obj stl usd usdz. The package root must exist.
--prepare-only validates/rebuilds the disposable scene without exporting files.
No .blend is saved. Failed/partial format folders are retained and never reused.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import sys
import time
import traceback
import zipfile

import bpy
import numpy as np
from mathutils import Matrix

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_step34c import (ROOT, SOURCE, SOURCE_SHA256, all_nodes, load_validate_palette,
                           make_scene, material_audit, polymer_variants, protected_hashes, sha256)
from step34c_meshes import (SEAT_COUNT, array, capture, enum, make_nonseat, make_seats, mesh_buffers,
                           require, socket, validate_seats)

FORMATS = ('fbx', 'obj', 'stl', 'usd', 'usdz')
STEM = 'Narendra_Modi_Stadium_STEP34C'
TRIANGLES, BATCHES = 4_847_635, 91
DISK_RESERVE = 1024 ** 3


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--formats', nargs='+', choices=FORMATS, default=list(FORMATS))
    parser.add_argument('--prepare-only', action='store_true')
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    require(args.output.is_dir() and not args.output.is_symlink(), 'Package root must already exist, without a symlink')
    args.output = args.output.resolve(strict=True)
    require(args.output.is_relative_to(ROOT) and args.output != ROOT, 'Use a package directory inside this workspace')
    require(args.output.relative_to(ROOT).parts[0] not in {'sources', 'public', 'scripts', '.git'}, 'Protected output location')
    require(len(args.formats) == len(set(args.formats)), 'Repeated format requested')
    return args


def triangulate_prototype(mesh):
    """Keep Blender's evaluated source tessellation, rather than exporter diagonals."""
    data = mesh_buffers(mesh)
    loops = data['loops'].reshape(-1)
    result = bpy.data.meshes.new(mesh.name + '_TRIANGLES')
    result.vertices.add(len(data['co']))
    result.vertices.foreach_set('co', data['co'].reshape(-1))
    result.loops.add(len(loops))
    result.loops.foreach_set('vertex_index', data['vertices'].reshape(-1))
    result.polygons.add(len(data['vertices']))
    result.polygons.foreach_set('loop_start', np.arange(len(data['vertices']), dtype=np.int32) * 3)
    result.polygons.foreach_set('loop_total', np.full(len(data['vertices']), 3, dtype=np.int32))
    result.polygons.foreach_set('use_smooth', np.ones(len(data['vertices']), dtype=np.bool_))
    for material in mesh.materials:
        result.materials.append(material)
    result.polygons.foreach_set('material_index', data['material_index'])
    result.update(calc_edges=True)
    normals = data['normals'][loops]
    result.normals_split_custom_set(normals.tolist())
    require(np.min(np.einsum('ij,ij->i', normals, array(result.corner_normals, 'vector', 3))) > 0.99999,
            'Prototype tessellation changed custom normals')
    for name, values in data['uv'].items():
        layer = result.uv_layers.new(name=name)
        layer.data.foreach_set('uv', values[loops].reshape(-1))
        layer.active_render = name == data['active_uv']
    if data['active_uv']:
        result.uv_layers.active_index = list(data['uv']).index(data['active_uv'])
    return result


def realize_seats(objects, rows):
    """Only the freshly constructed disposable GN trees are changed."""
    for obj, row in zip(objects, rows):
        require(obj.name == row['name'] and len(obj.modifiers) == 1, 'Unexpected disposable seat batch')
        tree = obj.modifiers[0].node_group
        require(tree.name.startswith('WEB34C_') and tree.users == 1, 'Seat GN tree is not disposable/private')
        info = next(n for n in tree.nodes if n.type == 'OBJECT_INFO')
        proto = socket(info.inputs, 'Object').default_value
        proto.data = triangulate_prototype(proto.data)
        prototype = proto.data
        out = next(n for n in tree.nodes if n.type == 'GROUP_OUTPUT')
        link = out.inputs[0].links[0].from_socket
        realize = tree.nodes.new('GeometryNodeRealizeInstances')
        tree.links.new(link, socket(realize.inputs, 'Geometry'))
        tree.links.new(socket(realize.outputs, 'Geometry'), out.inputs[0])
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        evaluated = obj.evaluated_get(dg)
        mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=dg)
        mesh.calc_loop_triangles()
        require(len(mesh.loop_triangles) == row['rendered_triangles'], f'Realization lost seat geometry: {obj.name}')
        require([m.name for m in mesh.materials] == row['material_slots'], 'Seat material slots changed')
        require([u.name for u in mesh.uv_layers] == [u.name for u in prototype.uv_layers], 'Seat UV layers changed')
        require(not prototype.has_custom_normals or mesh.has_custom_normals, 'Seat custom normals disappeared')
        # Both helpers already put all geometry in world space. Avoid an identity
        # mesh.transform(), which needlessly recalculates custom split normals.
        require(obj.matrix_world == Matrix.Identity(4), 'Disposable seat transform was not baked')
        obj.modifiers.clear()
        obj.data = mesh
        row['static_triangles'] = len(mesh.loop_triangles)
        row['static_uv_layers'] = [layer.name for layer in mesh.uv_layers]
        row['static_custom_normals'] = mesh.has_custom_normals


def prepare(report):
    require(bpy.app.background and tuple(bpy.app.version) == (5, 2, 2), 'Requires headless Blender 5.2.2')
    require(Path(bpy.data.filepath).resolve() == SOURCE.resolve() and not bpy.data.is_dirty,
            'Open the exact saved STEP34-C checkpoint in a fresh process')
    report['protected_hashes_before'] = protected_hashes()
    source = bpy.context.scene
    require(source.unit_settings.scale_length == 1.0, 'Expected source metres')
    report['input'] = {'checkpoint': str(SOURCE.relative_to(ROOT)), 'sha256': SOURCE_SHA256,
                       'blender': bpy.app.version_string, 'frame': source.frame_current,
                       'view_layer': bpy.context.view_layer.name}
    palette, polymer, report['palette'] = load_validate_palette()
    groups, prototypes, seats, materials, report['source'] = capture(palette)
    report['materials'] = material_audit(materials)
    audits = {m['name']: m for m in report['materials']['materials']}
    for (_, material, uv_names, _), group in groups.items():
        require(set(audits[material]['named_uv_layers']).issubset(uv_names), f'Missing named UVs: {material}')
    scene = make_scene(source)
    nonseats, report['nonseat_batches'] = make_nonseat(scene, groups)
    seat_objects, report['seat_batches'], error = make_seats(scene, prototypes, seats, polymer_variants(polymer, palette))
    report['seat_rebuild'] = validate_seats(seat_objects, seats)
    report['seat_rebuild']['max_source_decomposition_error'] = error
    require(report['seat_rebuild']['instances'] == SEAT_COUNT, 'Seat count mismatch')
    realize_seats(seat_objects, report['seat_batches'])
    objects = nonseats + seat_objects
    require(len(objects) == BATCHES, f'Expected {BATCHES} visible mesh batches')
    triangles, bounds = 0, []
    for obj in objects:
        require(not obj.modifiers and obj.matrix_world == Matrix.Identity(4), f'Unbaked mesh: {obj.name}')
        require(obj.visible_get() and not obj.hide_render, f'Hidden output batch: {obj.name}')
        mesh = obj.data
        mesh.calc_loop_triangles()
        require(len(mesh.polygons) == len(mesh.loop_triangles), 'Static mesh is not source-tessellated')
        triangles += len(mesh.loop_triangles)
        points = array(mesh.vertices, 'co', 3)
        require(np.isfinite(points).all(), 'Nonfinite output geometry')
        bounds.extend((points.min(axis=0), points.max(axis=0)))
    removed = sum(r['zero_area_removed'] for r in report['nonseat_batches'])
    require(triangles == TRIANGLES == report['source']['evaluated_rendered_triangles'] - removed, 'Full triangle count mismatch')
    require(material_audit(materials) == report['materials'], 'Original source materials changed')
    report['geometry'] = {'triangles': triangles, 'visible_mesh_batches': len(objects), 'seats': SEAT_COUNT,
                          'nonseat_export_degenerate_removed': removed, 'seat_triangles_removed': 0,
                          'material_batches': len(nonseats) + sum(r['material_batches'] for r in report['seat_batches']),
                          'bounds_z_up_metres': [np.min(bounds, axis=0).tolist(), np.max(bounds, axis=0).tolist()],
                          'unit_metres': 1.0, 'up_axis': 'Z', 'transforms_baked': True, 'source_tessellation_preserved': True,
                          'policy': 'full evaluated visible scene; no decimation, proxies, repairs or seat removals'}
    for obj in scene.objects:
        obj.select_set(obj in objects)
    bpy.context.view_layer.objects.active = objects[0]
    require(set(bpy.context.selected_objects) == set(objects), 'Hidden prototype leaked into selection')
    return objects, materials


def materialize_textures(root, objects, report):
    """Write original packed bytes, then rebind copied materials/images only."""
    materials = {m for obj in objects for m in obj.data.materials if m}
    audit = material_audit(materials)
    images = {n.image.name: n.image for m in materials for n in all_nodes(m.node_tree) if n.type == 'TEX_IMAGE'}
    directory = root / 'textures'
    directory.mkdir()  # Exclusive: never mix textures from an earlier export.
    copies, records = {}, []
    for index, (name, image) in enumerate(sorted(images.items())):
        packed = [p.packed_file for p in image.packed_files] or [image.packed_file]
        require(len(packed) == 1 and packed[0], f'Expected one packed texture: {name}')
        data = bytes(packed[0].data)
        extension = '.png' if data.startswith(b'\x89PNG\r\n\x1a\n') else '.jpg' if data.startswith(b'\xff\xd8\xff') else None
        require(extension, f'Unsupported original packed image encoding: {name}; refusing to transcode')
        digest = hashlib.sha256(data).hexdigest()
        safe = re.sub(r'[^A-Za-z0-9_]', '_', Path(name).stem)[:30]
        path = directory / f'{index:03d}_{safe}_{digest[:12]}{extension}'
        with path.open('xb') as stream:
            stream.write(data)
        copy = bpy.data.images.load(str(path), check_existing=False)
        copy.colorspace_settings.name = image.colorspace_settings.name
        enum(copy, 'alpha_mode', image.alpha_mode)
        require(tuple(copy.size) == tuple(image.size) and sha256(path) == digest, f'Texture copy changed: {name}')
        copies[name] = copy
        records.append({'image': name, 'path': str(path.relative_to(root)), 'sha256': digest, 'bytes': len(data)})
    trees = {}

    def rebind(tree):
        for node in tree.nodes:
            if node.type == 'TEX_IMAGE':
                node.image = copies[node.image.name]
            elif node.type == 'GROUP' and node.node_tree:
                original = node.node_tree
                if original not in trees:
                    trees[original] = original.copy()
                    rebind(trees[original])
                node.node_tree = trees[original]

    clones = {}
    for material in materials:
        clones[material] = material.copy()
        rebind(clones[material].node_tree)
    for obj in objects:
        for index, material in enumerate(list(obj.data.materials)):
            obj.data.materials[index] = clones[material]
    required = {name for row in audit['materials'] for key in ('base_colour_images', 'roughness_images', 'normal_images') for name in row[key]}
    report['textures'] = {'original_packed_bytes': True, 'files': records, 'required_connected_images': sorted(required),
                          'material_audit_before_path_rebinding': audit}


def export_operator(kind, path):
    options = {'filepath': str(path), 'check_existing': True}
    if kind == 'fbx':
        import addon_utils
        require(addon_utils.enable('io_scene_fbx', default_set=False, persistent=False) is not None, 'Bundled FBX addon unavailable')
        op = bpy.ops.export_scene.fbx
        options.update(use_selection=True, use_visible=True, object_types={'MESH'}, global_scale=1.0,
                       apply_unit_scale=True, apply_scale_options='FBX_SCALE_UNITS', axis_forward='Y', axis_up='Z',
                       use_mesh_modifiers=False, mesh_smooth_type='OFF', use_triangles=False,
                       bake_anim=False, path_mode='RELATIVE', embed_textures=False, use_custom_props=True)
    elif kind == 'obj':
        op = bpy.ops.wm.obj_export
        options.update(export_selected_objects=True, apply_modifiers=False, apply_transform=True, global_scale=1.0,
                       forward_axis='Y', up_axis='Z', export_uv=True, export_normals=True, export_materials=True,
                       export_pbr_extensions=True, export_triangulated_mesh=False, path_mode='RELATIVE', export_animation=False)
    elif kind == 'stl':
        op = bpy.ops.wm.stl_export
        options.update(export_selected_objects=True, apply_modifiers=False, ascii_format=False, use_batch=False,
                       global_scale=1.0, use_scene_unit=True, forward_axis='Y', up_axis='Z')
    else:
        op = bpy.ops.wm.usd_export
        options.update(selected_objects_only=True, export_animation=False, export_uvmaps=True, rename_uvmaps=False,
                       export_normals=True, export_materials=True, export_subdivision='IGNORE', use_instancing=False,
                       evaluation_mode='VIEWPORT', generate_preview_surface=True, generate_materialx_network=False,
                       export_textures_mode='NEW', overwrite_textures=False, relative_paths=True,
                       convert_orientation=False, convert_scene_units='METERS', meters_per_unit=1.0,
                       export_armatures=False, export_shapekeys=False, convert_world_material=False,
                       export_lights=False, export_cameras=False, export_curves=False, export_points=False,
                       export_volumes=False, triangulate_meshes=False, usdz_downscale_size='KEEP')
    props = op.get_rna_type().properties
    for name, value in options.items():
        require(name in props, f'{kind}: required exporter option unavailable: {name}')
        if props[name].type == 'ENUM':
            choices = {item.identifier for item in props[name].enum_items}
            require((value if isinstance(value, set) else {value}).issubset(choices), f'{kind}: invalid {name}={value!r}: {choices}')
    return op, options


def validate_output(kind, path, root, expected, textures, result):
    """Container/geometry/path checks; independent reimports remain a separate gate."""
    require(path.is_file() and path.stat().st_size > 84, f'Missing/truncated {kind} output')
    with path.open('rb') as stream:
        header = stream.read(84)
    references, digests, meshes, triangles = set(), set(), 0, 0
    checks = result.setdefault('validation', {})
    if kind == 'stl':
        triangles = struct.unpack_from('<I', header, 80)[0]
        require(path.stat().st_size == 84 + 50 * triangles, 'Binary STL length/triangle mismatch')
        checks['scope'] = 'full geometry only; unitless STL coordinates are metres/Z-up; not 3D-print certified'
    elif kind == 'obj':
        counts = {'v': 0, 'vt': 0, 'vn': 0, 'o': 0, 'f': 0}
        libraries = []
        with path.open(encoding='utf-8') as stream:
            for line in stream:
                fields = line.split()
                if not fields:
                    continue
                if fields[0] in counts:
                    counts[fields[0]] += 1
                if fields[0] == 'f':
                    require(len(fields) == 4 and all(len(v.split('/')) == 3 and v.split('/')[-1] for v in fields[1:]),
                            'OBJ lost triangulation or corner normals')
                elif fields[0] == 'mtllib':
                    libraries.append(fields[1:])
        require(libraries == [[path.with_suffix('.mtl').name]], 'OBJ material library missing/unexpected')
        with path.with_suffix('.mtl').open(encoding='utf-8') as stream:
            for line in stream:
                fields = line.split()
                if fields and (fields[0].startswith('map_') or fields[0] in {'bump', 'disp', 'norm', 'refl'}):
                    references.add(fields[-1])
        triangles, meshes = counts['f'], counts['o']
        require(counts['vn'] > 0 and counts['vt'] > 0, 'OBJ lacks normals/UVs')
        checks['obj_records'] = counts
    elif kind == 'fbx':
        require(header.startswith(b'Kaydara FBX Binary  \x00\x1a\x00'), 'Invalid binary FBX magic')
        from io_scene_fbx.parse_fbx import parse
        document, version = parse(str(path))
        settings = next(e for e in document.elems if e.id == b'GlobalSettings')
        properties = next(e for e in settings.elems if e.id == b'Properties70')
        units = {e.props[0].decode(): e.props[-1] for e in properties.elems}
        require(units['UnitScaleFactor'] == 100.0 and units['UpAxis'] == 2 and units['UpAxisSign'] == 1,
                'FBX metre/Z-up metadata mismatch')
        objects = next(e for e in document.elems if e.id == b'Objects')
        for entry in objects.elems:
            children = {e.id: e for e in entry.elems}
            if entry.id == b'Geometry' and entry.props[-1] == b'Mesh':
                indices = np.asarray(children[b'PolygonVertexIndex'].props[0])
                require(len(indices) % 3 == 0, 'FBX index tally is not triangular')
                indices = indices.reshape(-1, 3)
                require(np.all(indices[:, :2] >= 0) and np.all(indices[:, 2] < 0), 'FBX polygon termination mismatch')
                require(b'LayerElementNormal' in children, 'FBX mesh lost normals')
                triangles += len(indices)
                meshes += 1
            elif entry.id in {b'Texture', b'Video'}:
                references.add(children[b'RelativeFilename'].props[0].decode())
        checks['fbx_version'] = version
        checks['fbx_unit_scale_factor_cm'] = units['UnitScaleFactor']
    else:
        from pxr import Sdf, Usd, UsdGeom
        if kind == 'usdz':
            with zipfile.ZipFile(path) as archive:
                members = archive.infolist()
                require(members and Path(members[0].filename).suffix in {'.usd', '.usdc', '.usda'}, 'USDZ root layer missing')
                require(len({m.filename for m in members}) == len(members), 'Duplicate USDZ members')
                require(all(m.compress_type == zipfile.ZIP_STORED and not Path(m.filename).is_absolute() and
                            '..' not in Path(m.filename).parts for m in members), 'Invalid USDZ archive paths/compression')
                require(archive.testzip() is None, 'USDZ CRC failure')
                checks['usdz_members'] = [m.filename for m in members]
        else:
            require(header.startswith((b'PXR-USDC', b'#usda')), 'Invalid USD layer header')
        stage = Usd.Stage.Open(str(path))
        require(stage is not None and UsdGeom.GetStageUpAxis(stage) == 'Z' and UsdGeom.GetStageMetersPerUnit(stage) == 1.0,
                'USD stage/units/orientation mismatch')
        for prim in stage.Traverse():
            if prim.IsA(UsdGeom.Mesh):
                mesh = UsdGeom.Mesh(prim)
                counts = np.asarray(mesh.GetFaceVertexCountsAttr().Get())
                require(np.all(counts == 3) and len(mesh.GetNormalsAttr().Get() or []) > 0, 'USD lost triangles/normals')
                triangles += len(counts)
                meshes += 1
            for attr in prim.GetAttributes():
                if attr.GetTypeName() != Sdf.ValueTypeNames.Asset:
                    continue
                asset = attr.Get()
                if not asset or not asset.path:
                    continue
                require(not Path(asset.path).is_absolute() and asset.resolvedPath, f'USD texture is absolute/unresolved: {asset}')
                if kind == 'usdz':
                    require(asset.resolvedPath.startswith(str(path) + '['), 'USDZ texture escapes package')
                    references.add(asset.resolvedPath[len(str(path)) + 1:-1])
                else:
                    references.add(asset.path)
        checks['material_scope'] = 'Blender USD Preview Surface subset; no MaterialX or target-engine/visual equivalence claim'
    require(triangles == expected['triangles'], f'{kind}: expected {expected["triangles"]} triangles, got {triangles}')
    if kind != 'stl':
        require(meshes == expected['visible_mesh_batches'], f'{kind}: expected full visible mesh batch count, got {meshes}')
        for reference in sorted(references):
            require(not Path(reference).is_absolute(), f'Absolute texture reference: {reference}')
            if kind == 'usdz':
                with zipfile.ZipFile(path) as archive:
                    digests.add(hashlib.sha256(archive.read(reference)).hexdigest())
            else:
                texture = (path.parent / reference.replace('\\', '/')).resolve(strict=True)
                require(texture.is_relative_to(root), f'Texture escapes package: {reference}')
                digests.add(sha256(texture))
        covered = {r['image'] for r in textures['files'] if r['sha256'] in digests}
        missing = sorted(set(textures['required_connected_images']) - covered)
        checks['texture_coverage'] = {'references': sorted(references), 'byte_exact_source_images_referenced': sorted(covered),
                                      'missing_required_connected_images': missing,
                                      'scope': 'file references and original bytes, not shader or appearance equivalence'}
        require(not missing, f'{kind}: connected baked textures missing/changed: {missing}')
    checks.update(triangles=triangles, visible_mesh_batches=meshes if kind != 'stl' else None)
    result.update(path=str(path.relative_to(root)), bytes=path.stat().st_size, sha256=sha256(path))


def main():
    args = parse_args()
    reports = args.output / 'reports'
    require(not reports.is_symlink(), 'Refusing symlinked reports directory')
    reports.mkdir(exist_ok=True)
    report_path = reports / 'interchange-export.json'
    report = {'status': 'running', 'script': 'scripts/export_step34c_interchange.py',
              'formats': {kind: {'status': 'not_attempted'} for kind in args.formats},
              'validation_scope': 'structural checks only; independent fresh-process roundtrips and visual/target-engine checks not performed'}
    started, failure = time.monotonic(), None
    # Hold an exclusively created report file throughout: no late overwrite race.
    with report_path.open('x', encoding='utf-8') as stream:
        try:
            for kind in args.formats:
                require(not os.path.lexists(args.output / kind), f'Refusing existing format directory: {kind}')
            if not args.prepare_only and any(kind != 'stl' for kind in args.formats):
                require(not os.path.lexists(args.output / 'textures'), 'Refusing existing shared textures directory')
            objects, source_materials = prepare(report)
            if args.prepare_only:
                for result in report['formats'].values():
                    result['status'] = 'prepared_only_not_exported'
            else:
                if any(kind != 'stl' for kind in args.formats):
                    materialize_textures(args.output, objects, report)
                    require(material_audit(source_materials) == report['materials'], 'Original source texture/material state changed')
                for kind, result in report['formats'].items():
                    export_started = time.monotonic()
                    try:
                        # Conservative planning allowance, including temporary USDZ
                        # staging. Never fill the user's nearly-full system disk.
                        free = shutil.disk_usage(args.output).free
                        bytes_per_triangle = {'fbx': 140, 'obj': 250, 'stl': 50, 'usd': 140, 'usdz': 240}[kind]
                        estimate = TRIANGLES * bytes_per_triangle + 128 * 1024 ** 2
                        result['disk_preflight'] = {'free_bytes': free, 'reserve_bytes': DISK_RESERVE,
                                                    'estimated_peak_extra_bytes': estimate,
                                                    'estimate_is_not_a_measured_file_size': True}
                        if free < DISK_RESERVE + estimate:
                            result.update(status='deferred_disk_space',
                                          reason='Conservative export allowance would encroach on the 1 GiB free-space reserve')
                            continue
                        directory = args.output / kind
                        directory.mkdir()
                        path = directory / f'{STEM}.{kind}'
                        op, options = export_operator(kind, path)
                        result['operator'] = op.idname()
                        result['operator_options'] = {k: sorted(v) if isinstance(v, set) else v for k, v in options.items()}
                        outcome = op(**options)
                        result['operator_result'] = sorted(outcome)
                        require(outcome == {'FINISHED'}, f'{kind}: export did not finish: {outcome}')
                        validate_output(kind, path, args.output, report['geometry'], report.get('textures', {}), result)
                        result['status'] = 'passed_structural_checks'
                    except Exception as error:
                        result.update(status='failed', error=str(error), traceback=traceback.format_exc())
                        failure = failure or error
                    finally:
                        result['seconds'] = time.monotonic() - export_started
            deferred = any(r['status'] == 'deferred_disk_space' for r in report['formats'].values())
            report['status'] = ('failed' if failure else 'prepared_only' if args.prepare_only else
                                'partial_space_limited' if deferred else 'passed_structural_checks')
        except Exception as error:
            failure = error
            report.update(status='failed', error=str(error), traceback=traceback.format_exc())
            for result in report['formats'].values():
                if result['status'] == 'not_attempted':
                    result.update(status='failed_preflight', error=str(error))
        finally:
            try:
                report['protected_hashes_after'] = protected_hashes()
            except Exception as error:
                failure = failure or error
                report.update(status='failed', protected_input_error=str(error))
            report['total_seconds'] = time.monotonic() - started
            json.dump(report, stream, indent=2, sort_keys=True, allow_nan=False)
            stream.write('\n')
    if failure:
        raise RuntimeError(f'Interchange export failed; see {report_path}') from failure
    print(json.dumps({'status': report['status'], 'report': str(report_path)}), flush=True)


if __name__ == '__main__':
    main()
