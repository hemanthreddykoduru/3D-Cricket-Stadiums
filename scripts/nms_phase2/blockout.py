"""NMS Phase 2 only. Run one ordered step, inspect its PNG, then run the next.

blender -b --factory-startup --disable-autoexec -P scripts/nms_phase2/blockout.py -- --step 1
No original asset is imported. No GLB export. All coordinates are approximate
unitless proportions; reference-relative front is -Y, not geographic north.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pavilion import build_pavilion
from environment import build_environment

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'sources/narendra-modi-stadium/blockout'
TAU = math.tau
COLLECTIONS = ['NMS_STRUCTURE', 'NMS_SEATING_BLOCKOUT', 'NMS_ROOF',
               'NMS_PAVILION', 'NMS_PITCH', 'NMS_PODIUM']
COLORS = {'concrete': (.58,.59,.57,1), 'gold': (.61,.39,.15,1),
          'recess': (.10,.13,.15,1), 'lower': (.67,.21,.075,1),
          'upper': (.115,.19,.31,1), 'roof': (.9,.9,.84,1),
          'steel': (.73,.76,.77,1), 'field': (.20,.30,.18,1),
          'wicket': (.52,.42,.27,1), 'ground': (.32,.34,.32,1),
          'site': (.46,.43,.35,1), 'context': (.40,.42,.43,1)}


def col(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'NONE'
    scene['project'] = 'STADIUM3D INDIA — NMS architectural blockout'
    scene['dimension_status'] = 'VISUALLY INFERRED study units, not surveyed metres'
    scene['orientation'] = 'Front pavilion=-Y; +X practice side; geographic bearing UNKNOWN'
    scene['references'] = 'docs/narendra-modi-stadium-reference-analysis.md'
    scene['scope'] = 'Phase 2 only: no seats, final materials/lights, or GLB'
    stadium = col('NMS_STADIUM')
    for name in COLLECTIONS:
        col(name, stadium)
    col('NMS_ENVIRONMENT_BLOCKOUT')
    ref = col('NMS_REFERENCE')
    for key, rgba in COLORS.items():
        m = bpy.data.materials.new('Study_' + key)
        m.diffuse_color = rgba
        m.use_fake_user = True
        m['purpose'] = 'Flat identification color only; not a final material'
    for name, position, target, scale in [
        ('AERIAL', (45,-205,285), (0,0,0), 295),
        ('FRONT', (0,-320,75), (0,0,23), 250),
        ('REAR', (0,320,83), (0,0,22), 255),
        ('LEFT', (-320,0,80), (0,0,23), 260),
        ('RIGHT', (320,0,80), (0,0,23), 260),
        ('PITCH_LEVEL', (0,-43,2.5), (0,62,19), 0),
    ]:
        data = bpy.data.cameras.new('CAM_' + name)
        camera = bpy.data.objects.new('CAM_' + name, data)
        ref.objects.link(camera)
        camera.location = position
        camera.rotation_euler = (Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
        data.type = 'ORTHO' if scale else 'PERSP'
        data.ortho_scale = scale or 200
        data.lens = 18 if not scale else 50
        data.clip_end = 3000
        data.clip_start = .1
        camera['role'] = 'Reference-relative inspection camera, not a surveyed viewpoint'
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = 1200
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    shade = scene.display.shading
    shade.light = 'STUDIO'
    shade.studiolight_rotate_z = .45
    shade.color_type = 'MATERIAL'
    shade.show_shadows = True
    shade.show_cavity = True
    shade.cavity_type = 'BOTH'
    shade.curvature_ridge_factor = 1.25
    shade.curvature_valley_factor = 1.0
    shade.show_object_outline = False
    shade.background_type = 'WORLD'
    scene.world = bpy.data.worlds.new('Neutral_Inspection_Background')
    scene.world.color = (.14,.16,.18)
    scene.view_settings.view_transform = 'Standard'
    scene.render.film_transparent = False
    # Workbench studio illumination is inspection-only; scene has zero lights.
    bpy.context.preferences.filepaths.save_version = 0


def mat(key):
    m=bpy.data.materials.get('Study_'+key)
    if m is None:
        m=bpy.data.materials.new('Study_'+key)
        m.diffuse_color=COLORS[key]
        m['purpose']='Flat identification color only; not a final material'
    m.use_fake_user=True
    return m


def mesh(name, verts, faces, collection, material, refs):
    data = bpy.data.meshes.new(name + '_Mesh')
    data.from_pydata(verts, [], faces)
    data.update()
    bm = bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    obj = bpy.data.objects.new(name, data)
    bpy.data.collections[collection].objects.link(obj)
    data.materials.append(mat(material))
    obj['evidence_class'] = 'VISUALLY INFERRED'
    obj['reference_ids'] = refs
    obj['approximation'] = 'Source-supported feature; fitted proportions/counts, not measured facts'
    return obj


def point(rx, ry, z, theta):
    return (rx*math.cos(theta), ry*math.sin(theta), z)


def sweep(name, profile, start, end, collection, material, refs, segments=None):
    n = segments or max(2, round((end-start)/TAU*192))
    verts = [point(*p, start+(end-start)*i/n) for i in range(n+1) for p in profile]
    w = len(profile)
    faces = [(i*w+j, (i+1)*w+j, (i+1)*w+(j+1)%w, i*w+(j+1)%w)
             for i in range(n) for j in range(w)]
    faces += [tuple(reversed(range(w))), tuple(n*w+j for j in range(w))]
    return mesh(name, verts, faces, collection, material, refs)


def band(name, ri, ro, bottom, top, collection, material, refs, start=0, end=TAU):
    return sweep(name, [(*ri,bottom),(*ro,bottom),(*ro,top),(*ri,top)],
                 start,end,collection,material,refs)


def box(name, center, size, collection, material, refs):
    x,y,z=center; a,b,c=(v/2 for v in size)
    vs=[(x+sx*a,y+sy*b,z+sz*c) for sz in (-1,1) for sy in (-1,1) for sx in (-1,1)]
    fs=[(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)]
    return mesh(name,vs,fs,collection,material,refs)


def tubes(name, pairs, radius, collection, material, refs, sides=8):
    vs=[]; fs=[]
    for p,q in pairs:
        p,q=Vector(p),Vector(q); direction=(q-p).normalized()
        basis=direction.cross(Vector((0,0,1)))
        if basis.length<.01: basis=direction.cross(Vector((1,0,0)))
        u=basis.normalized(); v=direction.cross(u).normalized(); offset=len(vs)
        for center in (p,q):
            vs.extend(tuple(center+radius*(math.cos(i*TAU/sides)*u+math.sin(i*TAU/sides)*v)) for i in range(sides))
        fs += [tuple(offset+i for i in reversed(range(sides))),tuple(offset+sides+i for i in range(sides))]
        fs += [(offset+i,offset+(i+1)%sides,offset+sides+(i+1)%sides,offset+sides+i) for i in range(sides)]
    return mesh(name,vs,fs,collection,material,refs)


def ring_tube(name, rx, ry, z, radius, collection='NMS_ROOF'):
    pts=[point(rx,ry,z,i*TAU/192) for i in range(193)]
    return tubes(name,list(zip(pts[:-1],pts[1:])),radius,collection,'steel','S5,G03,G06')


def step1():
    # Irregular podium outline fitted to G05/G06; not a circular ground plane.
    profile=[(96,100,7),(120,126,7),(120,126,8),(96,100,8)]
    obj=sweep('Podium_Elevated_Deck',profile,0,TAU,'NMS_PODIUM','concrete','S1,G03,G05,G06')
    for v in obj.data.vertices:
        if math.hypot(v.co.x/120,v.co.y/126)>.98:
            angle=math.atan2(v.co.y,v.co.x)
            v.co.x*=1+.055*math.cos(3*angle+.4)
            v.co.y*=1+.035*math.sin(2*angle)
    pairs=[]
    for i in range(36):
        t=i*TAU/36
        pairs.append((point(112,117,-.7,t),point(112,117,7,t)))
    tubes('Podium_Undercroft_Support_Envelope',pairs,.85,'NMS_PODIUM','concrete','S1,G03,G06',6)
    # Single approximate approach, not an asserted geolocated official gate.
    verts=[(-22,119,7.9),(22,119,7.9),(28,174,-.7),(-28,174,-.7),
           (-22,119,7.2),(22,119,7.2),(28,174,-1),(-28,174,-1)]
    mesh('Podium_Approach_Ramp_Approximate',verts,
         [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],
         'NMS_PODIUM','concrete','S1,G05,G06')


def step2():
    n=192
    vs=[(0,0,0)]+[point(54,60,0,i*TAU/n) for i in range(n)]
    mesh('Pitch_Cricket_Outfield',vs,[(0,i+1,(i+1)%n+1) for i in range(n)],
         'NMS_PITCH','field','G02,G05,G07')
    box('Pitch_Central_Wicket_Area',(0,0,.04),(13,21,.06),'NMS_PITCH','wicket','G02,G05,G07')
    box('Pitch_Central_Strip',(0,0,.09),(2.5,20,.03),'NMS_PITCH','site','G02,G07')
    ring_tube('Pitch_Boundary_Approximate',53.4,59.4,.09,.10,'NMS_PITCH')
    band('Pitch_Perimeter_Apron',(54,60),(58,64),-.15,-.05,'NMS_PITCH','site','G07')


def step3():
    # Four study sectors separated by two end voids and two side access voids.
    # Neither count nor angular width represents verified blocks/tunnels.
    spans=[(3,85),(95,177),(183,265),(275,357)]
    for i,(a,b) in enumerate(spans,1):
        sweep(f'Lower_Tier_Mass_{i:02d}',[(58,64,.5),(74,79,14),(74,79,12.8),(58,64,-.5)],
              math.radians(a),math.radians(b),'NMS_SEATING_BLOCKOUT','lower','S1,S2,G02,G05,G07')


def step4():
    # Pavilion omission is deliberate, NOT another uniform annulus.
    for i,(a,b) in enumerate([(0,82),(82,164),(164,245),(295,360)],1):
        sweep(f'Upper_Tier_Mass_{i:02d}',[(76,81,19),(96,100,35),(96,100,33.8),(76,81,17.8)],
              math.radians(a),math.radians(b),'NMS_SEATING_BLOCKOUT','upper','S1,S2,G02,G06,G07')


def step5():
    for i,(a,b) in enumerate([(0,120),(120,245),(295,360)],1):
        band(f'Bowl_Intertier_Concourse_{i}',(74,79),(86,91),14,15.2,
             'NMS_STRUCTURE','concrete','G02,G06,G07',math.radians(a),math.radians(b))
        band(f'Bowl_Upper_Rear_Walkway_{i}',(96,100),(100,104),33.3,34.2,
             'NMS_STRUCTURE','concrete','G06,G10',math.radians(a),math.radians(b))
    for i in range(48):
        t=(i+.5)*TAU/48
        if math.radians(245)<t<math.radians(295):continue
        # Major concrete raker/fork envelope, no concealed floorplan invented.
        pairs=[(point(91,96,8,t),point(91,96,27,t)),
               (point(91,96,22,t),point(98,102,33.3,t)),
               (point(91,96,22,t),point(78,83,17.8,t))]
        tubes(f'Concrete_Raker_StudyBay_{i:02d}',pairs,.95,'NMS_STRUCTURE','concrete','G06,G10',4)


def step6():
    build_pavilion(bpy.data.collections['NMS_PAVILION'],{k:mat(k) for k in COLORS})


def step7():
    ring_tube('Roof_Perimeter_Lower_Chord',103,107,43,.5)
    ring_tube('Roof_Perimeter_Upper_Chord',103,107,49,.38)
    diagonals=[]
    for i in range(48):
        a=i*TAU/48;b=(i+1)*TAU/48
        diagonals += [(point(103,107,43,a),point(103,107,49,(a+b)/2)),
                      (point(103,107,49,(a+b)/2),point(103,107,43,b))]
    tubes('Roof_Perimeter_Planar_Triangulation',diagonals,.18,'NMS_ROOF','steel','S5,G03,G06')


def step8():
    # Shallow tensioned annular bays with explicit open center, no dome.
    for i in range(48):
        verts=[];faces=[]; n=6;radial=5
        for r in range(radial+1):
            u=r/radial; rx=81+22*u;ry=86+21*u
            for k in range(n+1):
                v=k/n;t=(i+v)*TAU/48
                z=39+4*u-.65*math.sin(math.pi*u)*math.sin(math.pi*v)
                verts.append(point(rx,ry,z,t))
        for r in range(radial):
            for k in range(n):
                a=r*(n+1)+k;faces.append((a,a+1,a+n+2,a+n+1))
        o=mesh(f'Roof_Membrane_StudyBay_{i:02d}',verts,faces,'NMS_ROOF','roof','S5,G03,G05,G06')
        mod=o.modifiers.new('Thin_Membrane_Study_Thickness','SOLIDIFY');mod.thickness=.12
    ring_tube('Roof_Inner_Edge',81,86,39,.22)


def step9():
    for i in range(48):
        t=(i+.5)*TAU/48
        # Skip pavilion facade, whose support interface remains unresolved.
        if math.radians(245)<t<math.radians(295):continue
        bottom=point(107,111,8,t)
        ends=[point(103,107,43,i*TAU/48),point(103,107,43,(i+1)*TAU/48)]
        tubes(f'Roof_Diagonal_V_StudyBay_{i:02d}',[(bottom,e) for e in ends],.44,
              'NMS_ROOF','steel','S5,G06,G10')


def step10():
    band('Pavilion_Base_Mass',(82,86),(100,104),-.7,14,
         'NMS_PAVILION','concrete','G03,G08',math.radians(245),math.radians(295))
    band('Pavilion_Base_Recess',(100,104),(100.15,104.15),.3,6.5,
         'NMS_PAVILION','recess','G03,G08',math.radians(251),math.radians(289))
    for side in (-1,1):
        box(f'End_Opening_Mass_{"Front" if side<0 else "Rear"}',(0,side*78,12),(15,5,7),
            'NMS_STRUCTURE','concrete','G02,G07')
        box(f'End_Recess_{"Front" if side<0 else "Rear"}',(0,side*75.4,11.5),(13,.2,4.5),
            'NMS_STRUCTURE','recess','G02,G07')


def step11():
    build_environment(bpy.data.collections['NMS_ENVIRONMENT_BLOCKOUT'],{k:mat(k) for k in COLORS})
    far=bpy.data.objects['ENV_Urban_Envelope_Distant_Rear']
    for c in list(far.users_collection):c.objects.unlink(far)
    bpy.data.collections['FAR'].objects.link(far)
    far['environment_zone']='FAR'


def validate():
    stats={'objects':[],'collections':[c.name for c in bpy.data.collections],
           'total_vertices':0,'total_polygons':0,'total_triangles':0,
           'zero_area_faces':0,'non_finite_vertices':0,'lights':0}
    for o in bpy.context.scene.objects:
        if o.type=='LIGHT':stats['lights']+=1
        if o.type!='MESH':continue
        d=o.data;d.calc_loop_triangles()
        zero=sum(p.area<1e-9 for p in d.polygons)
        bad=sum(not all(math.isfinite(x) for x in v.co) for v in d.vertices)
        item={'name':o.name,'vertices':len(d.vertices),'polygons':len(d.polygons),
              'triangles':len(d.loop_triangles),'collections':[c.name for c in o.users_collection],
              'evidence':o.get('evidence_class'),'references':o.get('reference_ids'),
              'zero_area_faces':zero}
        stats['objects'].append(item)
        stats['total_vertices']+=len(d.vertices)
        stats['total_polygons']+=len(d.polygons)
        stats['total_triangles']+=len(d.loop_triangles)
        stats['zero_area_faces']+=zero;stats['non_finite_vertices']+=bad
        assert item['evidence'] and item['references'],o.name
    assert stats['zero_area_faces']==0,stats['zero_area_faces']
    assert stats['non_finite_vertices']==0
    assert stats['lights']==0,'No final lighting allowed in Phase2'
    assert len([o for o in bpy.data.objects if o.type=='CAMERA'])==6
    assert not any('middle_tier' in o.name.lower() for o in bpy.data.objects)
    return stats


def save_new(path):
    path=Path(path)
    if path.exists():raise FileExistsError(f'Refusing to overwrite {path}')
    path.parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)


def render_view(name,path):
    bpy.context.scene.camera=bpy.data.objects['CAM_'+name]
    bpy.context.scene.render.filepath=str(path)
    bpy.ops.render.render(write_still=True)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--step',type=int,choices=range(1,12))
    parser.add_argument('--review',type=Path)
    parser.add_argument('--label',default='v01')
    parser.add_argument('--finalize',type=Path)
    args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
    if args.step:
        n=args.step;path=OUT/'checkpoints'/f'step_{n:02d}.blend'
        if path.exists():raise FileExistsError(path)
        if n==1:setup()
        else:
            bpy.ops.wm.open_mainfile(filepath=str(OUT/'checkpoints'/f'step_{n-1:02d}.blend'))
            assert bpy.context.scene.get('completed_step')==n-1
        globals()[f'step{n}']()
        bpy.context.scene['completed_step']=n
        stats=validate()
        view='FRONT' if n in (6,10) else 'AERIAL'
        bpy.context.scene.camera=bpy.data.objects['CAM_'+view]
        save_new(path)
        (OUT/'checkpoints'/f'step_{n:02d}.json').write_text(json.dumps(stats,indent=2))
        render_view(view,OUT/'checkpoints'/f'step_{n:02d}.png')
        print('STEP_VALIDATED',n,len(stats['objects']),stats['total_polygons'])
    elif args.review:
        bpy.ops.wm.open_mainfile(filepath=str(args.review.resolve()))
        target=OUT/'review'/args.label
        if target.exists():raise FileExistsError(target)
        target.mkdir(parents=True)
        stats=validate()
        (target/'geometry.json').write_text(json.dumps(stats,indent=2))
        for name in ('AERIAL','FRONT','REAR','LEFT','RIGHT','PITCH_LEVEL'):
            render_view(name,target/(name+'.png'))
    elif args.finalize:
        bpy.ops.wm.open_mainfile(filepath=str(args.finalize.resolve()))
        stats=validate()
        bpy.context.scene.camera=bpy.data.objects['CAM_AERIAL']
        bpy.context.scene['phase2_status']='Six-view reviewed approximate architectural blockout'
        save_new(OUT.parent/'narendra-modi-stadium_01_blockout.blend')
        (OUT/'final-geometry.json').write_text(json.dumps(stats,indent=2))
    else:parser.error('Choose --step, --review or --finalize')


if __name__=='__main__':
    main()
