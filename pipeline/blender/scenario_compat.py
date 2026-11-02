"""Blender 4.2 bridge for Scenario's Blender 5.2 dense Clay fields.

Scenario's Clay.to_object uses OpenVDB, which this Blender build lacks.
This adapter extracts the same zero surface with scikit-image in a separate
Python process. It does not change the field or add anatomy. No network calls.
Set EARTHBOUND_MESH_PYTHON to a Python with numpy and scikit-image installed.
"""
import os, sys, subprocess, tempfile, shutil
from pathlib import Path
import bpy, bmesh
import numpy as np


def mesh_clay(clay, name, collection=None):
    python = os.environ.get('EARTHBOUND_MESH_PYTHON') or os.environ.get('CODEX_PRIMARY_RUNTIME_PYTHON') or shutil.which('python')
    if not python: raise RuntimeError('Set EARTHBOUND_MESH_PYTHON to Python with numpy and scikit-image')
    script = '''import sys, numpy as np
from skimage.measure import marching_cubes
s=np.load(sys.argv[1])
v,f,_,_=marching_cubes(s['field'], level=0, spacing=tuple([float(s['voxel'])]*3), gradient_direction='ascent', allow_degenerate=False)
np.savez(sys.argv[2], vertices=v+s['origin'], faces=f)
'''
    with tempfile.TemporaryDirectory(prefix='earthbound-clay-') as tmp:
        source=Path(tmp)/'field.npz'; target=Path(tmp)/'mesh.npz'
        np.savez(source,field=clay.D.astype(np.float32),voxel=clay.vs,origin=clay.bmin)
        env=os.environ.copy()
        env.pop('PYTHONHOME',None); env.pop('PYTHONPATH',None)
        subprocess.run([python,'-c',script,str(source),str(target)],check=True,env=env)
        data=np.load(target);vertices=data['vertices'];faces=data['faces']
    assert np.isfinite(vertices).all() and len(faces)>0, 'Invalid Clay surface'
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices.tolist(),[],faces.tolist());mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=clay.vs*.001)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(mesh);bm.free();mesh.validate()
    for polygon in mesh.polygons:polygon.use_smooth=True
    obj=bpy.data.objects.new(name,mesh)
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj
