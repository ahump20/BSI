#!/usr/bin/env python3
"""
Blender export script for game assets.
Run with: blender --background --python blender-export.py -- <input.blend> <output_dir>
"""

import sys
import os
import json
from pathlib import Path

try:
    import bpy
except ImportError:
    print("This script must be run from within Blender")
    print("Usage: blender --background --python blender-export.py -- <input.blend> <output_dir>")
    sys.exit(1)

UNITY_EXPORT_SETTINGS = {
    "use_selection": False,
    "use_visible": True,
    "use_active_collection": False,
    "global_scale": 1.0,
    "apply_unit_scale": True,
    "apply_scale_options": "FBX_SCALE_ALL",
    "use_space_transform": True,
    "bake_space_transform": False,
    "object_types": {"MESH", "ARMATURE"},
    "use_mesh_modifiers": True,
    "use_mesh_modifiers_render": True,
    "mesh_smooth_type": "FACE",
    "use_subsurf": False,
    "use_mesh_edges": False,
    "use_tspace": True,
    "use_triangles": True,
    "use_custom_props": False,
    "add_leaf_bones": False,
    "primary_bone_axis": "Y",
    "secondary_bone_axis": "X",
    "use_armature_deform_only": True,
    "armature_nodetype": "NULL",
    "bake_anim": True,
    "bake_anim_use_all_bones": True,
    "bake_anim_use_nla_strips": False,
    "bake_anim_use_all_actions": True,
    "bake_anim_force_startend_keying": True,
    "bake_anim_step": 1.0,
    "bake_anim_simplify_factor": 1.0,
    "path_mode": "COPY",
    "embed_textures": True,
    "batch_mode": "OFF",
    "axis_forward": "-Z",
    "axis_up": "Y",
}

UNREAL_EXPORT_SETTINGS = {
    **UNITY_EXPORT_SETTINGS,
    "global_scale": 100.0,  # UE uses centimeters
    "axis_forward": "X",
    "axis_up": "Z",
}


def export_for_engine(blend_file: str, output_dir: str, engine: str) -> dict:
    """Export a .blend file for a specific game engine."""
    result = {
        "input": blend_file,
        "output_dir": output_dir,
        "engine": engine,
        "exported_files": [],
        "errors": []
    }

    try:
        bpy.ops.wm.open_mainfile(filepath=blend_file)
    except Exception as e:
        result["errors"].append(f"Failed to open {blend_file}: {str(e)}")
        return result

    settings = UNITY_EXPORT_SETTINGS if engine == "unity" else UNREAL_EXPORT_SETTINGS

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    base_name = Path(blend_file).stem
    fbx_path = output_path / f"{base_name}.fbx"

    try:
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_path),
            **settings
        )
        result["exported_files"].append(str(fbx_path))
    except Exception as e:
        result["errors"].append(f"FBX export failed: {str(e)}")

    for img in bpy.data.images:
        if img.filepath and img.filepath != "":
            try:
                src_path = bpy.path.abspath(img.filepath)
                if os.path.exists(src_path):
                    ext = Path(src_path).suffix
                    dst_path = output_path / f"{base_name}_{img.name}{ext}"
                    img.save_render(str(dst_path))
                    result["exported_files"].append(str(dst_path))
            except Exception as e:
                result["errors"].append(f"Texture export failed for {img.name}: {str(e)}")

    return result


def main():
    argv = sys.argv

    if "--" not in argv:
        print("Usage: blender --background --python blender-export.py -- <input.blend> <output_dir> [engine]")
        return 1

    args = argv[argv.index("--") + 1:]

    if len(args) < 2:
        print("Missing arguments. Need: <input.blend> <output_dir>")
        return 1

    input_file = args[0]
    output_dir = args[1]
    engine = args[2] if len(args) > 2 else "unity"

    if engine not in ["unity", "unreal"]:
        print(f"Unknown engine: {engine}. Use 'unity' or 'unreal'")
        return 1

    result = export_for_engine(input_file, output_dir, engine)
    print(json.dumps(result, indent=2))

    return 0 if not result["errors"] else 1


if __name__ == "__main__":
    sys.exit(main())
