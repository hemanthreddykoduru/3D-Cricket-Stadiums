import bpy
import sys

# Deselect all
bpy.ops.object.select_all(action='DESELECT')
# Select all
bpy.ops.object.select_all(action='SELECT')

output_path = sys.argv[-1]

bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT',
    export_lights=True,
    export_cameras=False
)
