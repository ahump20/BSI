"""
Blaze Sports Intel - Backyard Field Blender Add-on Helpers
"""

from __future__ import annotations

import bpy
import bmesh
from mathutils import Vector

bl_info = {
    "name": "BSI Backyard Field Helper",
    "author": "Blaze Sports Intel",
    "version": (1, 0, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar",
    "description": "Helper utilities for generating Backyard Field assets",
    "category": "Object",
}


def link_to_collection(obj: bpy.types.Object, col: bpy.types.Collection) -> None:
    """Safely link an object to a collection."""

    if obj not in col.objects:
        col.objects.link(obj)


def _remove_empty_collections(collections: list[bpy.types.Collection]) -> None:
    """Remove collections that no longer have users."""

    for collection in collections:
        if collection.users == 0:
            bpy.data.collections.remove(collection)


def cleanup_previous(root_collection_name: str) -> None:
    """Remove a previous generated collection and its objects safely."""

    root_col = bpy.data.collections.get(root_collection_name)
    if root_col is None:
        return

    for obj in list(root_col.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    for child in list(root_col.children):
        root_col.children.unlink(child)
        _remove_empty_collections([child])

    for scene in bpy.data.scenes:
        if root_col in scene.collection.children:
            scene.collection.children.unlink(root_col)

    _remove_empty_collections([root_col])


def create_capped_circle_mesh(name: str, radius: float, segments: int = 16) -> bpy.types.Mesh:
    """Create a circle mesh with a guaranteed face cap."""

    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()

    result = bmesh.ops.create_circle(bm, segments=segments, radius=radius)
    bmesh.ops.edgeloop_fill(bm, edges=result["edges"])

    bm.to_mesh(mesh)
    bm.free()
    return mesh


def build_fence_points(points: list[Vector], close_loop: bool = True) -> list[Vector]:
    """Return fence points, optionally closing the loop."""

    if not points:
        return []

    if close_loop and points[0] != points[-1]:
        return points + [points[0]]

    return points


def export_gltf(filepath: str, export_yup: bool = True) -> None:
    """Export a GLTF/GLB with explicit axis handling.

    The glTF spec is Y-up by default. Keep export_yup=True unless your
    renderer explicitly expects Blender's Z-up coordinates.
    """

    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        export_yup=export_yup,
        export_cameras=True,
    )


def register() -> None:
    """Register the add-on."""

    return None


def unregister() -> None:
    """Unregister the add-on."""

    return None
