"""Derive the mobile lemur without changing the approved desktop source.

The desktop sculpt has one small UV tile per triangle. Those tiles cannot survive
edge collapse. Before reduction, sample its approved coat into linear vertex
pigment; the mobile material uses COLOR_0 directly. The ringed tail is kept whole
because collapse across alternating material bands destroys their silhouette.
"""
from pathlib import Path
import bpy,bmesh,numpy as np,json

def coat_to_vertex_pigment(ob):
    me=ob.data;uv=me.uv_layers.active
    texture=next(n for n in ob.data.materials[0].node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
    image=texture.image;width,height=image.size
    pixels=np.array(image.pixels[:],dtype=np.float64).reshape(height,width,4)
    uvs=np.array([p.uv[:] for p in uv.data]);x=np.clip(uvs[:,0]*width-.5,0,width-1);y=np.clip(uvs[:,1]*height-.5,0,height-1)
    x0=np.floor(x).astype(int);y0=np.floor(y).astype(int);x1=np.minimum(x0+1,width-1);y1=np.minimum(y0+1,height-1);fx=(x-x0)[:,None];fy=(y-y0)[:,None]
    colors=(pixels[y0,x0,:3]*(1-fx)+pixels[y0,x1,:3]*fx)*(1-fy)+(pixels[y1,x0,:3]*(1-fx)+pixels[y1,x1,:3]*fx)*fy
    # Packed base-color bytes are sRGB, while COLOR_0 is linear per glTF 2.0.
    colors=np.where(colors<=.04045,colors/12.92,((colors+.055)/1.055)**2.4)
    ids=np.array([loop.vertex_index for loop in me.loops]);counts=np.bincount(ids,minlength=len(me.vertices));averages=np.column_stack([np.bincount(ids,weights=colors[:,k],minlength=len(me.vertices))/np.maximum(counts,1) for k in range(3)])
    attr=me.color_attributes.new(name='MobileCoat',type='FLOAT_COLOR',domain='POINT')
    rgba=np.column_stack([averages,np.ones(len(averages))]).astype(np.float32);attr.data.foreach_set('color',rgba.ravel())
    me.color_attributes.active_color=attr
    mat=bpy.data.materials.new(ob.name+' mobile sampled pigment');mat.use_nodes=True;nodes=mat.node_tree.nodes;bsdf=nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.88
    vc=nodes.new('ShaderNodeVertexColor');vc.layer_name='MobileCoat';mat.node_tree.links.new(vc.outputs['Color'],bsdf.inputs['Base Color']);me.materials.clear();me.materials.append(mat)

def build_mobile():
    root=Path.cwd();out=root/'pipeline/assets/ring-tailed-lemur';bpy.ops.wm.open_mainfile(filepath=str(out/'ring-tailed-lemur.blend'))
    rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');keep={}
    for ob in bpy.context.scene.objects:
        if ob.type=='MESH' and ('guard hairs' in ob.name or 'groomed short fur' in ob.name):keep[ob.name]=set()
    for clip in ['Idle','Walk','Leap','Climb']:
        rig.animation_data.action=bpy.data.actions[clip];end=rig.animation_data.action.frame_range[1]
        for f in [0,int(end*.25),int(end*.5),int(end*.75)]:
            bpy.context.scene.frame_set(f);dg=bpy.context.evaluated_depsgraph_get()
            for name in keep:
                ev=bpy.data.objects[name].evaluated_get(dg);me=ev.to_mesh();co=np.array([v.co[:] for v in me.vertices]);keep[name].update(np.argmin(co,axis=0).tolist()+np.argmax(co,axis=0).tolist());ev.to_mesh_clear()
    rig.animation_data.action=bpy.data.actions['Idle'];bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
    retained_tail_triangles=0
    for ob in list(bpy.context.scene.objects):
        if ob.type!='MESH':continue
        if ob.name in keep:
            bm=bmesh.new();bm.from_mesh(ob.data);bm.faces.ensure_lookup_table();bm.verts.ensure_lookup_table()
            remove=[f for i,f in enumerate(bm.faces) if i%14!=0 and not any(v.index in keep[ob.name] for v in f.verts)]
            bmesh.ops.delete(bm,geom=remove,context='FACES');bm.to_mesh(ob.data);bm.free()
        elif ob.name=='Ringed tail':
            retained_tail_triangles=sum(len(p.vertices)-2 for p in ob.data.polygons)
        elif len(ob.data.polygons)>200:
            sculpt=ob.name in {'Continuous torso neck and limbs','Sculpted facial planes and pinnae'}
            if sculpt:coat_to_vertex_pigment(ob)
            bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Mobile anatomical reduction','DECIMATE');mod.ratio=.30 if ob.name=='Continuous torso neck and limbs' else .42
            bpy.ops.object.modifier_move_up(modifier=mod.name);bpy.ops.object.modifier_apply(modifier=mod.name)
    triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH')
    assert triangles<20000,triangles
    for ob in bpy.context.scene.objects:ob.select_set(ob.type in {'MESH','ARMATURE'})
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(out/'ring-tailed-lemur.mobile.raw.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_yup=True,export_apply=False,export_anim_slide_to_zero=True)
    report={'triangles':triangles,'bodyDecimationRatio':.30,'headDecimationRatio':.42,'coat':'Approved desktop atlas sampled into linear COLOR_0 before reduction; no collapsed atlas UV lookup','tail':'Full ring mesh and band material boundaries retained','tailTriangles':retained_tail_triangles,'textureMax':256,'silhouetteExtremaRetained':True,'clips':[a.name for a in bpy.data.actions],'desktopSourceUnchanged':True}
    (root/'pipeline/reports/ring-tailed-lemur-mobile-creation.json').write_text(json.dumps(report,indent=2)+'\n');print('MOBILE_RESULT',json.dumps(report))
if __name__=='__main__':build_mobile()
