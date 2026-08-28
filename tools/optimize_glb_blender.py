import argparse
import json
import os
import sys

import bpy


def mesh_stats():
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    vertices = sum(len(obj.data.vertices) for obj in meshes)
    polygons = sum(len(obj.data.polygons) for obj in meshes)
    return {"meshes": len(meshes), "vertices": vertices, "polygons": polygons}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def optimize(input_path, output_path, ratio):
    clear_scene()
    bpy.ops.import_scene.gltf(filepath=input_path)
    before = mesh_stats()

    for obj in [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        modifier = obj.modifiers.new("Oraculo mesh reduction", "DECIMATE")
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        try:
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        except Exception:
            obj.modifiers.remove(modifier)
        obj.select_set(False)

    after = mesh_stats()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        export_apply=True,
        export_image_format="AUTO",
        export_yup=True,
    )
    return {"input": input_path, "output": output_path, "ratio": ratio, "before": before, "after": after}


def main():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--ratio", type=float, default=0.18)
    args = parser.parse_args(argv)

    result = optimize(os.path.abspath(args.input), os.path.abspath(args.output), args.ratio)
    print("ORACULO_GLB_OPTIMIZE_RESULT=" + json.dumps(result, ensure_ascii=True))


if __name__ == "__main__":
    main()
