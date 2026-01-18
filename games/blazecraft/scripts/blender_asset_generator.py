#!/usr/bin/env python3
"""
BlazeCraft Asset Generator for Blender
======================================

Creates original Warcraft-inspired isometric world assets.
Run in Blender: File > Scripting > Open > Run Script

Output: /assets/world/v1/

Buildings (6 types, 3 tiers each = 18 GLB files):
- townhall: Foundation -> Town Hall -> Citadel
- workshop: Shack -> Workshop -> Foundry
- market: Stall -> Market -> Bazaar
- barracks: Camp -> Barracks -> Fortress
- stables: Pen -> Stables -> Embassy
- library: Shelf -> Library -> Academy

Plus: Terrain tiles, cliffs, props, decals
"""

import bpy
import bmesh
import math
import os
from pathlib import Path
from mathutils import Vector, Matrix

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

OUTPUT_DIR = Path("/Users/AustinHumphrey/games/blazecraft/assets/world/v1")
TILE_SIZE = 2.0  # Units per tile

# BSI Brand Colors (converted to RGB 0-1)
COLORS = {
    "burnt_orange": (0.749, 0.341, 0.0),
    "texas_soil": (0.545, 0.271, 0.075),
    "charcoal": (0.102, 0.102, 0.102),
    "midnight": (0.051, 0.051, 0.051),
    "ember": (1.0, 0.420, 0.208),
    "cream": (0.961, 0.961, 0.863),
    "gold": (1.0, 0.843, 0.0),
    "forest_green": (0.290, 0.404, 0.255),
    "stone_gray": (0.5, 0.5, 0.5),
}

BUILDING_COLORS = {
    "townhall": (1.0, 0.843, 0.0),       # Gold
    "workshop": (0.749, 0.341, 0.0),     # Burnt orange
    "market": (0.180, 0.800, 0.443),     # Green
    "barracks": (0.906, 0.298, 0.235),   # Red
    "stables": (0.204, 0.596, 0.859),    # Blue
    "library": (0.608, 0.349, 0.714),    # Purple
}


# ─────────────────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────────────────

def clear_scene():
    """Remove all objects from scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    # Clear orphan data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)


def create_material(name: str, color: tuple, metallic: float = 0.0, roughness: float = 0.8) -> bpy.types.Material:
    """Create a simple PBR material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True

    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness

    return mat


def export_glb(obj: bpy.types.Object, filepath: Path):
    """Export object as GLB."""
    # Ensure directory exists
    filepath.parent.mkdir(parents=True, exist_ok=True)

    # Select only this object
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # Export (export_colors removed - not supported in Blender 5.0+)
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
        export_format='GLB',
        use_selection=True,
        export_materials='EXPORT',
        export_apply=True,
    )


def create_box(name: str, size: tuple, location: tuple = (0, 0, 0)) -> bpy.types.Object:
    """Create a box mesh."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0]/2, size[1]/2, size[2]/2)
    bpy.ops.object.transform_apply(scale=True)
    return obj


def create_cylinder(name: str, radius: float, height: float, location: tuple = (0, 0, 0), segments: int = 16) -> bpy.types.Object:
    """Create a cylinder mesh."""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius,
        depth=height,
        vertices=segments,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def create_cone(name: str, radius: float, height: float, location: tuple = (0, 0, 0)) -> bpy.types.Object:
    """Create a cone mesh."""
    bpy.ops.mesh.primitive_cone_add(
        radius1=radius,
        depth=height,
        vertices=8,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def join_objects(objects: list, name: str) -> bpy.types.Object:
    """Join multiple objects into one."""
    if not objects:
        return None

    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()

    result = bpy.context.active_object
    result.name = name
    return result


# ─────────────────────────────────────────────────────────────
# Building Generators
# ─────────────────────────────────────────────────────────────

def create_building_base(width: float, depth: float, height: float, color: tuple) -> bpy.types.Object:
    """Create a basic building foundation."""
    obj = create_box("base", (width, depth, height), (0, 0, height/2))
    mat = create_material("building_base", color, roughness=0.9)
    obj.data.materials.append(mat)
    return obj


def create_townhall_tier0() -> bpy.types.Object:
    """Town Hall Tier 0: Foundation with scaffolding."""
    clear_scene()
    parts = []

    # Stone foundation
    base = create_box("foundation", (3.0, 3.0, 0.5), (0, 0, 0.25))
    base_mat = create_material("stone", COLORS["stone_gray"], roughness=0.95)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Wooden scaffolding posts
    wood_mat = create_material("wood", COLORS["texas_soil"], roughness=0.85)
    for x, y in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
        post = create_box(f"post_{x}_{y}", (0.15, 0.15, 1.5), (x, y, 1.0))
        post.data.materials.append(wood_mat)
        parts.append(post)

    # Cross beams
    for z in [1.0, 1.5]:
        beam1 = create_box(f"beam_x_{z}", (2.0, 0.1, 0.1), (0, -1, z))
        beam2 = create_box(f"beam_x2_{z}", (2.0, 0.1, 0.1), (0, 1, z))
        beam1.data.materials.append(wood_mat)
        beam2.data.materials.append(wood_mat)
        parts.extend([beam1, beam2])

    return join_objects(parts, "townhall_tier0")


def create_townhall_tier1() -> bpy.types.Object:
    """Town Hall Tier 1: Basic town hall building."""
    clear_scene()
    parts = []

    # Main building
    base = create_box("main", (2.8, 2.8, 2.0), (0, 0, 1.0))
    base_mat = create_material("gold_stone", BUILDING_COLORS["townhall"], roughness=0.7)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Roof (pyramid)
    roof = create_cone("roof", 2.2, 1.5, (0, 0, 2.75))
    roof_mat = create_material("roof", COLORS["texas_soil"], roughness=0.8)
    roof.data.materials.append(roof_mat)
    parts.append(roof)

    # Door
    door = create_box("door", (0.6, 0.1, 1.0), (0, -1.45, 0.5))
    door_mat = create_material("door_wood", (0.3, 0.2, 0.1), roughness=0.75)
    door.data.materials.append(door_mat)
    parts.append(door)

    # Windows
    window_mat = create_material("window", (0.2, 0.3, 0.4), roughness=0.3)
    for x in [-0.8, 0.8]:
        for side in [-1, 1]:
            win = create_box(f"window_{x}_{side}", (0.4, 0.05, 0.5), (x, side * 1.42, 1.2))
            win.data.materials.append(window_mat)
            parts.append(win)

    return join_objects(parts, "townhall_tier1")


def create_townhall_tier2() -> bpy.types.Object:
    """Town Hall Tier 2: Grand Citadel."""
    clear_scene()
    parts = []

    # Main tower
    tower = create_cylinder("tower", 1.5, 3.5, (0, 0, 1.75), 8)
    tower_mat = create_material("citadel_stone", BUILDING_COLORS["townhall"], roughness=0.6)
    tower.data.materials.append(tower_mat)
    parts.append(tower)

    # Battlements
    for i in range(8):
        angle = i * (math.pi / 4)
        x = math.cos(angle) * 1.3
        y = math.sin(angle) * 1.3
        battlement = create_box(f"battlement_{i}", (0.4, 0.4, 0.5), (x, y, 3.75))
        battlement.data.materials.append(tower_mat)
        parts.append(battlement)

    # Roof spire
    spire = create_cone("spire", 1.0, 2.0, (0, 0, 5.0))
    spire_mat = create_material("spire", COLORS["burnt_orange"], roughness=0.5, metallic=0.3)
    spire.data.materials.append(spire_mat)
    parts.append(spire)

    # Flag
    flag_pole = create_cylinder("flag_pole", 0.05, 1.0, (0, 0, 6.5), 8)
    flag = create_box("flag", (0.6, 0.02, 0.4), (0.3, 0, 6.7))
    flag_mat = create_material("flag", COLORS["burnt_orange"])
    flag_pole.data.materials.append(flag_mat)
    flag.data.materials.append(flag_mat)
    parts.extend([flag_pole, flag])

    return join_objects(parts, "townhall_tier2")


def create_workshop_tier0() -> bpy.types.Object:
    """Workshop Tier 0: Simple shack with tools."""
    clear_scene()
    parts = []

    # Shack base
    base = create_box("shack", (2.0, 2.0, 1.2), (0, 0, 0.6))
    base_mat = create_material("wood", COLORS["texas_soil"], roughness=0.85)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Sloped roof
    roof = create_box("roof", (2.4, 2.4, 0.3), (0, 0, 1.5))
    roof.rotation_euler = (0.2, 0, 0)
    roof_mat = create_material("thatch", (0.4, 0.35, 0.2), roughness=0.95)
    roof.data.materials.append(roof_mat)
    parts.append(roof)

    return join_objects(parts, "workshop_tier0")


def create_workshop_tier1() -> bpy.types.Object:
    """Workshop Tier 1: Full workshop with forge."""
    clear_scene()
    parts = []

    # Main building
    base = create_box("workshop", (2.5, 2.5, 1.8), (0, 0, 0.9))
    base_mat = create_material("brick", BUILDING_COLORS["workshop"], roughness=0.8)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Chimney
    chimney = create_box("chimney", (0.5, 0.5, 1.2), (0.8, 0.8, 2.4))
    chimney.data.materials.append(base_mat)
    parts.append(chimney)

    # Roof
    roof = create_box("roof", (2.8, 2.8, 0.4), (0, 0, 2.0))
    roof.rotation_euler = (0.15, 0.15, 0)
    roof_mat = create_material("slate", COLORS["charcoal"], roughness=0.7)
    roof.data.materials.append(roof_mat)
    parts.append(roof)

    return join_objects(parts, "workshop_tier1")


def create_workshop_tier2() -> bpy.types.Object:
    """Workshop Tier 2: Grand foundry."""
    clear_scene()
    parts = []

    # Main structure
    base = create_box("foundry", (3.0, 3.0, 2.5), (0, 0, 1.25))
    base_mat = create_material("dark_brick", BUILDING_COLORS["workshop"], roughness=0.75)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Large chimney
    chimney = create_cylinder("chimney", 0.4, 2.0, (1.0, 0, 3.5), 8)
    chimney.data.materials.append(base_mat)
    parts.append(chimney)

    # Forge glow (emissive)
    glow = create_box("glow", (0.8, 0.1, 0.6), (0, -1.55, 0.5))
    glow_mat = create_material("ember", COLORS["ember"])
    glow_mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 2.0
    glow.data.materials.append(glow_mat)
    parts.append(glow)

    return join_objects(parts, "workshop_tier2")


# Similar patterns for other buildings...
def create_generic_building(name: str, tier: int, color: tuple) -> bpy.types.Object:
    """Create a generic building for placeholder."""
    clear_scene()
    parts = []

    # Scale based on tier
    scale = 1.0 + (tier * 0.3)
    height = 1.5 + (tier * 0.8)

    # Main building
    base = create_box("main", (2.0 * scale, 2.0 * scale, height), (0, 0, height/2))
    base_mat = create_material(f"{name}_mat", color, roughness=0.75)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Roof
    roof = create_cone("roof", 1.3 * scale, 1.0 + (tier * 0.3), (0, 0, height + 0.5))
    roof_mat = create_material(f"{name}_roof", COLORS["texas_soil"])
    roof.data.materials.append(roof_mat)
    parts.append(roof)

    return join_objects(parts, f"{name}_tier{tier}")


# ─────────────────────────────────────────────────────────────
# Terrain & Props
# ─────────────────────────────────────────────────────────────

def create_terrain_tile(name: str, color: tuple, variant: int = 0) -> bpy.types.Object:
    """Create a terrain tile."""
    clear_scene()

    # Create tile
    tile = create_box("tile", (TILE_SIZE, TILE_SIZE, 0.2), (0, 0, -0.1))

    # Add slight variation
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(tile.data)
    for v in bm.verts:
        if v.co.z > 0:
            v.co.z += (hash(f"{v.co.x}{v.co.y}{variant}") % 100) / 1000
    bmesh.update_edit_mesh(tile.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Material
    mat = create_material(name, color, roughness=0.9)
    tile.data.materials.append(mat)
    tile.name = name

    return tile


def create_prop_barrel() -> bpy.types.Object:
    """Create a barrel prop."""
    clear_scene()

    barrel = create_cylinder("barrel", 0.25, 0.5, (0, 0, 0.25), 12)
    mat = create_material("barrel_wood", COLORS["texas_soil"], roughness=0.85)
    barrel.data.materials.append(mat)

    return barrel


def create_prop_crate() -> bpy.types.Object:
    """Create a crate prop."""
    clear_scene()

    crate = create_box("crate", (0.4, 0.4, 0.4), (0, 0, 0.2))
    mat = create_material("crate_wood", (0.4, 0.3, 0.2), roughness=0.8)
    crate.data.materials.append(mat)

    return crate


def create_prop_torch() -> bpy.types.Object:
    """Create a torch prop."""
    clear_scene()
    parts = []

    # Pole
    pole = create_cylinder("pole", 0.03, 0.6, (0, 0, 0.3), 8)
    pole_mat = create_material("torch_wood", COLORS["texas_soil"])
    pole.data.materials.append(pole_mat)
    parts.append(pole)

    # Flame holder
    holder = create_box("holder", (0.12, 0.12, 0.15), (0, 0, 0.67))
    holder.data.materials.append(pole_mat)
    parts.append(holder)

    return join_objects(parts, "torch")


def create_selection_ring() -> bpy.types.Object:
    """Create a selection ring decal."""
    clear_scene()

    # Torus for ring
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.0,
        minor_radius=0.05,
        location=(0, 0, 0.05)
    )
    ring = bpy.context.active_object
    ring.name = "selection_ring"

    mat = create_material("selection", (1.0, 1.0, 1.0))
    mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1.0
    ring.data.materials.append(mat)

    return ring


# ─────────────────────────────────────────────────────────────
# Main Generation
# ─────────────────────────────────────────────────────────────

def generate_all_assets():
    """Generate all BlazeCraft world assets."""
    print("=" * 60)
    print("BlazeCraft Asset Generator")
    print("=" * 60)

    # Buildings
    buildings = {
        "townhall": [create_townhall_tier0, create_townhall_tier1, create_townhall_tier2],
        "workshop": [create_workshop_tier0, create_workshop_tier1, create_workshop_tier2],
    }

    # Generate specialized buildings
    for building_name, tier_funcs in buildings.items():
        for tier, func in enumerate(tier_funcs):
            print(f"Creating {building_name} tier {tier}...")
            obj = func()
            export_glb(obj, OUTPUT_DIR / f"buildings/{building_name}/tier{tier}.glb")

    # Generate generic buildings for remaining types
    generic_buildings = ["market", "barracks", "stables", "library"]
    for building_name in generic_buildings:
        for tier in range(3):
            print(f"Creating {building_name} tier {tier}...")
            obj = create_generic_building(building_name, tier, BUILDING_COLORS[building_name])
            export_glb(obj, OUTPUT_DIR / f"buildings/{building_name}/tier{tier}.glb")

    # Terrain tiles
    tiles = [
        ("grass", COLORS["forest_green"]),
        ("dirt", COLORS["texas_soil"]),
        ("stone", COLORS["stone_gray"]),
        ("path", (0.6, 0.55, 0.45)),
    ]

    for tile_name, color in tiles:
        for variant in range(3):
            print(f"Creating {tile_name} tile variant {variant}...")
            obj = create_terrain_tile(f"{tile_name}_v{variant}", color, variant)
            export_glb(obj, OUTPUT_DIR / f"tiles/{tile_name}_v{variant}.glb")

    # Props
    print("Creating props...")
    export_glb(create_prop_barrel(), OUTPUT_DIR / "props/barrel.glb")
    export_glb(create_prop_crate(), OUTPUT_DIR / "props/crate.glb")
    export_glb(create_prop_torch(), OUTPUT_DIR / "props/torch.glb")

    # Decals
    print("Creating decals...")
    export_glb(create_selection_ring(), OUTPUT_DIR / "decals/selection_ring.glb")

    print("=" * 60)
    print("Asset generation complete!")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    generate_all_assets()
