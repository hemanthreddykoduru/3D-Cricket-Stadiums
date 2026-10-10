"""Run in factory-startup background Blender; never loads or saves a source file."""

from pathlib import Path
import sys

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from step34c_meshes import array, make_nonseat


def batch(data, material):
    return {('stadium', material.name, ('UVMap', 'DetailUV'), 'DetailUV'): {
        'parts': [data[:3], data[3:]], 'material': material, 'removed': 0,
        'precision_removed': 0, 'maximum_collapsed_area': 0.0,
        'names': {'fixture'}, 'evaluated_triangles': len(data) // 3,
    }}


def check(scene, label, data, preserved, vertices):
    material = bpy.data.materials.new(label)
    original = data.copy()
    objects, rows = make_nonseat(scene, batch(data, material))
    assert len(objects) == len(rows) == 1
    mesh = objects[0].data
    before = len(mesh.polygons)
    normals_before = array(mesh.corner_normals, 'vector', 3)
    assert not mesh.validate(), f'{label}: Blender repaired the disposable mesh'
    assert len(mesh.polygons) == before == len(data) // 3
    assert len(mesh.vertices) == vertices
    indices = array(mesh.loops, 'vertex_index', 1, np.int32)
    assert np.array_equal(array(mesh.vertices, 'co', 3)[indices], data[:, :3])
    assert np.array_equal(array(mesh.polygons, 'loop_start', 1, np.int32), np.arange(before) * 3)
    assert np.all(array(mesh.polygons, 'loop_total', 1, np.int32) == 3)
    assert tuple(layer.name for layer in mesh.uv_layers) == ('UVMap', 'DetailUV')
    for i, layer in enumerate(mesh.uv_layers):
        assert np.array_equal(array(layer.data, 'uv', 2), data[:, 6 + i * 2:8 + i * 2])
    normals = array(mesh.corner_normals, 'vector', 3)
    assert np.array_equal(normals, normals_before)
    minimum_dot = float(np.einsum('ij,ij->i', normals, data[:, 3:6]).min())
    assert minimum_dot > 0.99999
    assert mesh.uv_layers.active.name == 'DetailUV' and mesh.uv_layers['DetailUV'].active_render
    assert len(mesh.materials) == 1 and mesh.materials[0] == material
    assert np.all(array(mesh.polygons, 'material_index', 1, np.int32) == 0)
    assert np.array_equal(data, original), 'Input corner data changed'
    assert rows[0]['triangles'] == before
    assert rows[0]['duplicate_topology_faces_preserved'] == preserved
    print(f'PASS {label}: {before} triangles, {vertices} vertices, {preserved} duplicate faces preserved; '
          f'validation unchanged, exact oriented positions/UVs/material, minimum normal dot {minimum_dot:.9f}')
    return indices.reshape(-1, 3)


def main():
    assert bpy.app.background, 'Run this fixture in a new background Blender process'
    print(f'Blender {bpy.app.version_string}: Step34 C non-seat regression')
    # Confirm the exporter validation failure independently of the batching helper.
    raw = bpy.data.meshes.new('raw_duplicate_fixture')
    raw.from_pydata([(0, 0, 0), (1, 0, 0), (0, 1, 0)], [], [(0, 1, 2), (0, 1, 2)])
    assert len(raw.polygons) == 2 and raw.validate() and len(raw.polygons) == 1
    print('PASS baseline reproduction: shared-index duplicate triangles validate from 2 to 1')

    corners = np.array([
        [0, 0, 0, 0.1, 0.2, 1, 0.1, 0.2, 0.2, 0.3],
        [1, 0, 0, 0.2, -0.1, 1, 0.9, 0.2, 0.8, 0.3],
        [0, 1, 0, -0.1, 0.1, 1, 0.1, 0.9, 0.2, 0.7],
        [1, 1, 0, 0.2, 0.1, 1, 0.9, 0.9, 0.8, 0.7],
    ], dtype=np.float32)
    corners[:, 3:6] /= np.linalg.norm(corners[:, 3:6], axis=1)[:, None]
    scene = bpy.data.scenes.new('Step34C_REGRESSION_ONLY')
    uv_seam, normal_seam = corners[[0, 1, 2]].copy(), corners[[0, 1, 2]].copy()
    uv_seam[1, 6] += 0.25
    normal_seam[2, 3:6] = corners[3, 3:6]
    repeated = np.concatenate((
        corners[[0, 1, 2, 0, 1, 2, 1, 2, 0, 2, 1, 0, 1, 3, 2]], uv_seam, normal_seam))
    indices = check(scene, 'identical_cyclic_reversed_and_seams', repeated, 3, 15)
    assert np.array_equal(indices[0, [1, 2]], indices[4, [0, 2]])
    for face in range(1, 4):
        assert not set(indices[face]) & set(indices[:face].reshape(-1))
    assert indices[5, 1] != indices[0, 1] and indices[6, 2] != indices[0, 2]
    adjacent = check(scene, 'adjacent', corners[[0, 1, 2, 1, 3, 2]], 0, 4)
    assert np.array_equal(adjacent[0, [1, 2]], adjacent[1, [0, 2]])

    material = bpy.data.materials.new('invalid_fixture')
    try:
        make_nonseat(scene, batch(corners[[0, 0, 1]], material))
    except RuntimeError as error:
        assert 'validation repair' in str(error), error
        print(f'PASS fail-fast: {error}')
    else:
        raise AssertionError('A mesh requiring validation repair was accepted')
    print('PASS all Step34 C non-seat regression checks')


if __name__ == '__main__':
    main()
