#!/usr/bin/env python3
"""
BlazeCraft Night Elf Asset Generator for Blender
================================================

Creates Warcraft III: Frozen Throne Night Elf themed 3D assets.
Run in Blender: File > Scripting > Open > Run Script

Output: /assets/world/v2/

Buildings (6 types, 3 tiers each = 18 GLB files):
- tree_of_life: Seedling -> Tree of Life -> Tree of Eternity
- ancient_of_lore: Lore Stone -> Ancient of Lore -> Archive Ancient
- moon_wells: Small Well -> Moon Well Circle -> Lunar Sanctuary
- ancient_of_war: War Sapling -> Ancient of War -> War Fortress
- chimaera_roost: Nest -> Roost -> Aerie
- ancient_of_wonders: Runestone -> Wonder Shrine -> Celestial Library

Units (5 GLB files):
- wisp, archer, huntress, druid, demon_hunter

Terrain, Props, Decals
"""

import bpy
import bmesh
import math
import os
from pathlib import Path
from mathutils import Vector, Matrix
import random

# ─────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────

OUTPUT_DIR = Path("/Users/AustinHumphrey/games/blazecraft/assets/world/v2")
TILE_SIZE = 2.0

# Night Elf Color Palette (RGB 0-1)
COLORS = {
    # Primary
    "ancient_purple": (0.357, 0.227, 0.537),       # #5B3A89
    "moonsilver": (0.753, 0.753, 0.753),           # #C0C0C0
    "elune_glow": (0.0, 1.0, 1.0),                 # #00FFFF
    "ancient_bark": (0.239, 0.157, 0.090),         # #3D2817
    "silverleaf": (0.482, 0.620, 0.537),           # #7B9E89
    "shadow_purple": (0.176, 0.106, 0.306),        # #2D1B4E
    "moon_white": (0.910, 0.910, 0.941),           # #E8E8F0

    # Secondary
    "deep_violet": (0.298, 0.145, 0.455),          # #4C2574
    "twilight_blue": (0.196, 0.247, 0.455),        # #323F74
    "forest_shadow": (0.122, 0.180, 0.145),        # #1F2E25
    "silver_trim": (0.824, 0.824, 0.875),          # #D2D2DF
    "fel_green": (0.0, 0.8, 0.2),                  # Demon Hunter accents

    # Terrain
    "dark_soil": (0.098, 0.082, 0.071),            # #191514
    "moonlit_grass": (0.180, 0.259, 0.200),        # #2E4233
    "ancient_stone": (0.275, 0.255, 0.294),        # #46414B
    "root_brown": (0.180, 0.122, 0.078),           # #2E1F14
}

# Building accent colors for each type
BUILDING_COLORS = {
    "tree_of_life": ("ancient_purple", "silverleaf", "elune_glow"),
    "ancient_of_lore": ("deep_violet", "moon_white", "elune_glow"),
    "moon_wells": ("twilight_blue", "moonsilver", "elune_glow"),
    "ancient_of_war": ("ancient_bark", "moonsilver", "ancient_purple"),
    "chimaera_roost": ("silverleaf", "ancient_bark", "moon_white"),
    "ancient_of_wonders": ("shadow_purple", "silver_trim", "elune_glow"),
}

# ─────────────────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────────────────

def clear_scene():
    """Remove all objects from scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)


def create_material(name: str, color_key: str, metallic: float = 0.0,
                   roughness: float = 0.8, emissive: float = 0.0) -> bpy.types.Material:
    """Create a PBR material with optional emission."""
    color = COLORS.get(color_key, (0.5, 0.5, 0.5))
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True

    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness

    if emissive > 0:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emissive

    return mat


def create_glow_material(name: str, color_key: str = "elune_glow",
                        strength: float = 3.0) -> bpy.types.Material:
    """Create an emissive glow material."""
    color = COLORS.get(color_key, COLORS["elune_glow"])
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True

    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
    bsdf.inputs["Emission Strength"].default_value = strength
    bsdf.inputs["Roughness"].default_value = 0.3

    return mat


def export_glb(obj: bpy.types.Object, filepath: Path):
    """Export object as GLB."""
    filepath.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

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


def create_cylinder(name: str, radius: float, height: float,
                   location: tuple = (0, 0, 0), segments: int = 16) -> bpy.types.Object:
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


def create_cone(name: str, radius: float, height: float,
               location: tuple = (0, 0, 0), vertices: int = 8) -> bpy.types.Object:
    """Create a cone mesh."""
    bpy.ops.mesh.primitive_cone_add(
        radius1=radius,
        depth=height,
        vertices=vertices,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def create_sphere(name: str, radius: float,
                 location: tuple = (0, 0, 0), segments: int = 16) -> bpy.types.Object:
    """Create a UV sphere."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius,
        segments=segments,
        ring_count=segments // 2,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def create_torus(name: str, major_radius: float, minor_radius: float,
                location: tuple = (0, 0, 0)) -> bpy.types.Object:
    """Create a torus mesh."""
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
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


def create_organic_trunk(name: str, base_radius: float, top_radius: float,
                        height: float, segments: int = 8,
                        wobble: float = 0.1) -> bpy.types.Object:
    """Create an organic tree trunk with slight tapering and wobble."""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=1,
        depth=height,
        vertices=segments,
        location=(0, 0, height/2)
    )
    obj = bpy.context.active_object
    obj.name = name

    # Edit mesh for organic shape
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(obj.data)

    for v in bm.verts:
        # Taper based on height
        t = (v.co.z / height) if height > 0 else 0
        radius_at_height = base_radius + (top_radius - base_radius) * t

        # Calculate distance from center axis
        dist = math.sqrt(v.co.x**2 + v.co.y**2)
        if dist > 0.01:
            # Apply taper
            scale = radius_at_height / dist
            v.co.x *= scale
            v.co.y *= scale

            # Add organic wobble
            angle = math.atan2(v.co.y, v.co.x)
            wobble_amount = math.sin(angle * 3 + v.co.z * 2) * wobble * (1 - t)
            v.co.x += math.cos(angle) * wobble_amount
            v.co.y += math.sin(angle) * wobble_amount

    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    return obj


def create_leaf_cluster(name: str, radius: float,
                       location: tuple = (0, 0, 0)) -> bpy.types.Object:
    """Create a cluster of leaves using icosphere."""
    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=radius,
        subdivisions=2,
        location=location
    )
    obj = bpy.context.active_object
    obj.name = name

    # Squash slightly for canopy shape
    obj.scale.z = 0.6
    bpy.ops.object.transform_apply(scale=True)

    return obj


# ─────────────────────────────────────────────────────────────
# Building Generators - Tree of Life (Town Hall)
# ─────────────────────────────────────────────────────────────

def create_tree_of_life_tier0() -> bpy.types.Object:
    """Tree of Life Tier 0: Seedling - Small glowing sapling."""
    clear_scene()
    parts = []

    # Root mound
    mound = create_sphere("mound", 0.8, (0, 0, 0.2))
    mound.scale.z = 0.4
    bpy.ops.object.transform_apply(scale=True)
    mound_mat = create_material("soil", "dark_soil", roughness=0.95)
    mound.data.materials.append(mound_mat)
    parts.append(mound)

    # Small trunk
    trunk = create_organic_trunk("trunk", 0.15, 0.08, 1.2, segments=6)
    trunk_mat = create_material("bark", "ancient_bark", roughness=0.9)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Small leaf clusters
    leaf_mat = create_material("leaves", "silverleaf", roughness=0.7)
    for angle in [0, 120, 240]:
        rad = math.radians(angle)
        x = math.cos(rad) * 0.3
        y = math.sin(rad) * 0.3
        leaf = create_sphere(f"leaf_{angle}", 0.25, (x, y, 1.4))
        leaf.data.materials.append(leaf_mat)
        parts.append(leaf)

    # Glow core
    glow = create_sphere("glow", 0.1, (0, 0, 0.9))
    glow_mat = create_glow_material("seedling_glow", "elune_glow", 2.0)
    glow.data.materials.append(glow_mat)
    parts.append(glow)

    return join_objects(parts, "tree_of_life_tier0")


def create_tree_of_life_tier1() -> bpy.types.Object:
    """Tree of Life Tier 1: Full ancient tree with face in trunk."""
    clear_scene()
    parts = []

    # Large root base
    for i in range(5):
        angle = i * (360 / 5)
        rad = math.radians(angle)
        root = create_organic_trunk(f"root_{i}", 0.3, 0.08, 1.5, wobble=0.15)
        root.rotation_euler = (math.radians(60), 0, rad)
        root.location = (math.cos(rad) * 0.5, math.sin(rad) * 0.5, 0)
        root_mat = create_material("root", "ancient_bark", roughness=0.9)
        root.data.materials.append(root_mat)
        parts.append(root)

    # Main trunk
    trunk = create_organic_trunk("trunk", 0.6, 0.35, 3.0, segments=12, wobble=0.08)
    trunk_mat = create_material("bark", "ancient_bark", roughness=0.85)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Face features (eyes as glowing orbs)
    eye_mat = create_glow_material("eyes", "elune_glow", 2.5)
    for x in [-0.2, 0.2]:
        eye = create_sphere(f"eye_{x}", 0.08, (x, -0.5, 2.0))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # Main canopy
    canopy_mat = create_material("canopy", "ancient_purple", roughness=0.75)
    canopy = create_leaf_cluster("canopy", 1.8, (0, 0, 3.8))
    canopy.data.materials.append(canopy_mat)
    parts.append(canopy)

    # Secondary canopy layers
    for z, r in [(3.2, 1.2), (4.2, 1.0)]:
        for angle in [0, 90, 180, 270]:
            rad = math.radians(angle)
            x = math.cos(rad) * 0.8
            y = math.sin(rad) * 0.8
            leaf = create_leaf_cluster(f"leaf_{z}_{angle}", r * 0.5, (x, y, z))
            leaf.data.materials.append(canopy_mat)
            parts.append(leaf)

    # Moonwell glow at base
    well_glow = create_cylinder("well_glow", 0.8, 0.1, (0, 0, 0.05))
    well_mat = create_glow_material("well", "elune_glow", 1.5)
    well_glow.data.materials.append(well_mat)
    parts.append(well_glow)

    return join_objects(parts, "tree_of_life_tier1")


def create_tree_of_life_tier2() -> bpy.types.Object:
    """Tree of Life Tier 2: Tree of Eternity - Massive with floating moon orbs."""
    clear_scene()
    parts = []

    # Extensive root system
    for i in range(8):
        angle = i * (360 / 8)
        rad = math.radians(angle)
        root = create_organic_trunk(f"root_{i}", 0.4, 0.1, 2.5, wobble=0.2)
        root.rotation_euler = (math.radians(70), 0, rad)
        root.location = (math.cos(rad) * 0.8, math.sin(rad) * 0.8, 0)
        root_mat = create_material("root", "ancient_bark", roughness=0.9)
        root.data.materials.append(root_mat)
        parts.append(root)

    # Massive trunk
    trunk = create_organic_trunk("trunk", 1.0, 0.5, 4.5, segments=16, wobble=0.1)
    trunk_mat = create_material("bark", "ancient_bark", roughness=0.85)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Face with larger glowing eyes
    eye_mat = create_glow_material("eyes", "elune_glow", 3.0)
    for x in [-0.35, 0.35]:
        eye = create_sphere(f"eye_{x}", 0.12, (x, -0.8, 2.8))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # Mouth glow
    mouth = create_box("mouth", (0.4, 0.1, 0.15), (0, -0.85, 2.2))
    mouth.data.materials.append(eye_mat)
    parts.append(mouth)

    # Grand canopy
    canopy_mat = create_material("canopy", "ancient_purple", roughness=0.7)
    canopy_highlight = create_material("highlight", "moonsilver", roughness=0.6, metallic=0.3)

    canopy = create_leaf_cluster("canopy", 2.5, (0, 0, 5.5))
    canopy.data.materials.append(canopy_mat)
    parts.append(canopy)

    # Multiple canopy layers
    for z, r, offset in [(4.5, 1.8, 1.0), (5.8, 1.5, 1.2), (6.5, 1.0, 0.8)]:
        for angle in range(0, 360, 60):
            rad = math.radians(angle)
            x = math.cos(rad) * offset
            y = math.sin(rad) * offset
            leaf = create_leaf_cluster(f"leaf_{z}_{angle}", r * 0.4, (x, y, z))
            leaf.data.materials.append(canopy_mat)
            parts.append(leaf)

    # Silver branches
    branch_mat = create_material("silver_branch", "moonsilver", metallic=0.5, roughness=0.4)
    for i in range(6):
        angle = i * 60
        rad = math.radians(angle)
        branch = create_organic_trunk(f"branch_{i}", 0.08, 0.03, 1.2, wobble=0.05)
        branch.rotation_euler = (math.radians(45), 0, rad)
        branch.location = (math.cos(rad) * 0.4, math.sin(rad) * 0.4, 3.5)
        branch.data.materials.append(branch_mat)
        parts.append(branch)

    # Floating moon orbs
    orb_mat = create_glow_material("moon_orb", "moon_white", 4.0)
    for i in range(4):
        angle = i * 90 + 45
        rad = math.radians(angle)
        x = math.cos(rad) * 2.0
        y = math.sin(rad) * 2.0
        z = 5.0 + math.sin(rad * 2) * 0.5
        orb = create_sphere(f"orb_{i}", 0.2, (x, y, z))
        orb.data.materials.append(orb_mat)
        parts.append(orb)

    # Central moonwell
    well = create_torus("well", 1.2, 0.15, (0, 0, 0.1))
    well_mat = create_material("well_ring", "moonsilver", metallic=0.6, roughness=0.3)
    well.data.materials.append(well_mat)
    parts.append(well)

    well_water = create_cylinder("well_water", 1.0, 0.1, (0, 0, 0.05))
    water_mat = create_glow_material("water", "elune_glow", 2.0)
    well_water.data.materials.append(water_mat)
    parts.append(well_water)

    return join_objects(parts, "tree_of_life_tier2")


# ─────────────────────────────────────────────────────────────
# Building Generators - Ancient of Lore (Workshop)
# ─────────────────────────────────────────────────────────────

def create_ancient_of_lore_tier0() -> bpy.types.Object:
    """Ancient of Lore Tier 0: Lore Stone - Carved moonstone with runes."""
    clear_scene()
    parts = []

    # Base stone
    stone = create_box("stone", (1.5, 0.8, 2.0), (0, 0, 1.0))
    # Taper the top
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(stone.data)
    for v in bm.verts:
        if v.co.z > 0.5:
            factor = 0.8
            v.co.x *= factor
            v.co.y *= factor
    bmesh.update_edit_mesh(stone.data)
    bpy.ops.object.mode_set(mode='OBJECT')

    stone_mat = create_material("moonstone", "ancient_stone", roughness=0.6)
    stone.data.materials.append(stone_mat)
    parts.append(stone)

    # Glowing rune strips
    rune_mat = create_glow_material("runes", "elune_glow", 2.0)
    for z in [0.5, 1.0, 1.5]:
        rune = create_box(f"rune_{z}", (1.4, 0.02, 0.1), (0, -0.42, z))
        rune.data.materials.append(rune_mat)
        parts.append(rune)

    # Top crystal
    crystal = create_cone("crystal", 0.2, 0.5, (0, 0, 2.25), vertices=6)
    crystal.rotation_euler.z = math.radians(30)
    crystal_mat = create_glow_material("crystal", "moon_white", 1.5)
    crystal.data.materials.append(crystal_mat)
    parts.append(crystal)

    return join_objects(parts, "ancient_of_lore_tier0")


def create_ancient_of_lore_tier1() -> bpy.types.Object:
    """Ancient of Lore Tier 1: Walking tree with scrolls in branches."""
    clear_scene()
    parts = []

    # Trunk/body
    trunk = create_organic_trunk("trunk", 0.5, 0.3, 2.5, segments=10, wobble=0.1)
    trunk_mat = create_material("bark", "ancient_bark", roughness=0.85)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Leg roots (4 legs)
    for i, angle in enumerate([45, 135, 225, 315]):
        rad = math.radians(angle)
        leg = create_organic_trunk(f"leg_{i}", 0.15, 0.08, 1.0, wobble=0.1)
        leg.rotation_euler = (math.radians(60), 0, rad)
        leg.location = (math.cos(rad) * 0.3, math.sin(rad) * 0.3, 0)
        leg.data.materials.append(trunk_mat)
        parts.append(leg)

    # Branch arms with scroll holders
    branch_mat = create_material("branch", "ancient_bark", roughness=0.8)
    for x in [-1, 1]:
        arm = create_organic_trunk(f"arm_{x}", 0.12, 0.06, 1.2, wobble=0.08)
        arm.rotation_euler = (0, math.radians(70 * x), 0)
        arm.location = (x * 0.3, 0, 1.8)
        arm.data.materials.append(branch_mat)
        parts.append(arm)

        # Scroll/book
        scroll = create_box(f"scroll_{x}", (0.3, 0.2, 0.4), (x * 1.0, 0, 2.2))
        scroll_mat = create_material("scroll", "moon_white", roughness=0.5)
        scroll.data.materials.append(scroll_mat)
        parts.append(scroll)

    # Glowing eyes
    eye_mat = create_glow_material("eyes", "elune_glow", 2.5)
    for x in [-0.15, 0.15]:
        eye = create_sphere(f"eye_{x}", 0.08, (x, -0.35, 2.0))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # Canopy "head"
    canopy = create_leaf_cluster("canopy", 0.8, (0, 0, 3.0))
    canopy_mat = create_material("canopy", "deep_violet", roughness=0.75)
    canopy.data.materials.append(canopy_mat)
    parts.append(canopy)

    return join_objects(parts, "ancient_of_lore_tier1")


def create_ancient_of_lore_tier2() -> bpy.types.Object:
    """Ancient of Lore Tier 2: Archive Ancient - Multiple trees merged with orbs."""
    clear_scene()
    parts = []

    trunk_mat = create_material("bark", "ancient_bark", roughness=0.85)
    canopy_mat = create_material("canopy", "deep_violet", roughness=0.7)

    # Three merged trunks
    for i, (x, y, h) in enumerate([(0, 0, 3.5), (-0.6, 0.4, 3.0), (0.5, 0.5, 2.8)]):
        trunk = create_organic_trunk(f"trunk_{i}", 0.4 - i*0.08, 0.25 - i*0.05, h, wobble=0.1)
        trunk.location = (x, y, 0)
        trunk.data.materials.append(trunk_mat)
        parts.append(trunk)

        # Canopy for each
        canopy = create_leaf_cluster(f"canopy_{i}", 1.0 - i*0.15, (x, y, h + 0.8))
        canopy.data.materials.append(canopy_mat)
        parts.append(canopy)

    # Knowledge orbs floating around
    orb_mat = create_glow_material("knowledge", "moon_white", 3.0)
    for i in range(6):
        angle = i * 60
        rad = math.radians(angle)
        x = math.cos(rad) * 1.5
        y = math.sin(rad) * 1.5
        z = 2.0 + math.sin(rad * 3) * 0.8
        orb = create_sphere(f"orb_{i}", 0.15, (x, y, z))
        orb.data.materials.append(orb_mat)
        parts.append(orb)

    # Central glowing eye
    eye_mat = create_glow_material("main_eye", "elune_glow", 4.0)
    eye = create_sphere("eye", 0.2, (0, -0.45, 2.2))
    eye.data.materials.append(eye_mat)
    parts.append(eye)

    # Floating scrolls/tomes
    scroll_mat = create_material("tome", "moon_white", roughness=0.4)
    for i, (x, y, z) in enumerate([(-0.8, -0.8, 1.5), (1.0, -0.5, 2.0), (0.3, 0.9, 1.8)]):
        scroll = create_box(f"tome_{i}", (0.35, 0.08, 0.45), (x, y, z))
        scroll.rotation_euler = (0, 0, math.radians(i * 30))
        scroll.data.materials.append(scroll_mat)
        parts.append(scroll)

    return join_objects(parts, "ancient_of_lore_tier2")


# ─────────────────────────────────────────────────────────────
# Building Generators - Moon Wells (Market)
# ─────────────────────────────────────────────────────────────

def create_moon_wells_tier0() -> bpy.types.Object:
    """Moon Wells Tier 0: Small Well - Single moonwell, soft glow."""
    clear_scene()
    parts = []

    # Basin
    basin = create_cylinder("basin", 0.6, 0.4, (0, 0, 0.2), segments=12)
    basin_mat = create_material("silver_basin", "moonsilver", metallic=0.5, roughness=0.4)
    basin.data.materials.append(basin_mat)
    parts.append(basin)

    # Inner depression (water surface)
    water = create_cylinder("water", 0.5, 0.1, (0, 0, 0.35))
    water_mat = create_glow_material("water", "elune_glow", 2.0)
    water.data.materials.append(water_mat)
    parts.append(water)

    # Decorative rim
    rim = create_torus("rim", 0.55, 0.06, (0, 0, 0.4))
    rim.data.materials.append(basin_mat)
    parts.append(rim)

    # Small pillar posts
    pillar_mat = create_material("pillar", "ancient_stone", roughness=0.7)
    for angle in [0, 120, 240]:
        rad = math.radians(angle)
        x = math.cos(rad) * 0.7
        y = math.sin(rad) * 0.7
        pillar = create_cylinder(f"pillar_{angle}", 0.08, 0.8, (x, y, 0.4), 6)
        pillar.data.materials.append(pillar_mat)
        parts.append(pillar)

    return join_objects(parts, "moon_wells_tier0")


def create_moon_wells_tier1() -> bpy.types.Object:
    """Moon Wells Tier 1: Moon Well Circle - 3 wells arranged."""
    clear_scene()
    parts = []

    basin_mat = create_material("silver_basin", "moonsilver", metallic=0.5, roughness=0.4)
    water_mat = create_glow_material("water", "elune_glow", 2.5)
    pillar_mat = create_material("pillar", "ancient_stone", roughness=0.7)

    # Three wells in triangle
    for i, angle in enumerate([90, 210, 330]):
        rad = math.radians(angle)
        x = math.cos(rad) * 1.2
        y = math.sin(rad) * 1.2

        # Basin
        basin = create_cylinder(f"basin_{i}", 0.5, 0.35, (x, y, 0.175), 10)
        basin.data.materials.append(basin_mat)
        parts.append(basin)

        # Water
        water = create_cylinder(f"water_{i}", 0.4, 0.1, (x, y, 0.3))
        water.data.materials.append(water_mat)
        parts.append(water)

        # Rim
        rim = create_torus(f"rim_{i}", 0.45, 0.05, (x, y, 0.35))
        rim.data.materials.append(basin_mat)
        parts.append(rim)

    # Central pillar with crystal
    pillar = create_cylinder("central_pillar", 0.15, 1.5, (0, 0, 0.75), 8)
    pillar.data.materials.append(pillar_mat)
    parts.append(pillar)

    crystal = create_cone("crystal", 0.2, 0.6, (0, 0, 1.8), 6)
    crystal_mat = create_glow_material("crystal", "moon_white", 3.0)
    crystal.data.materials.append(crystal_mat)
    parts.append(crystal)

    # Connecting paths (ground level)
    path_mat = create_material("path", "ancient_stone", roughness=0.8)
    for angle in [90, 210, 330]:
        rad = math.radians(angle)
        path = create_box(f"path_{angle}", (0.3, 0.9, 0.05),
                         (math.cos(rad) * 0.6, math.sin(rad) * 0.6, 0.025))
        path.rotation_euler.z = rad
        path.data.materials.append(path_mat)
        parts.append(path)

    return join_objects(parts, "moon_wells_tier1")


def create_moon_wells_tier2() -> bpy.types.Object:
    """Moon Wells Tier 2: Lunar Sanctuary - Grand well with floating moon shard."""
    clear_scene()
    parts = []

    basin_mat = create_material("silver_basin", "moonsilver", metallic=0.6, roughness=0.35)
    water_mat = create_glow_material("water", "elune_glow", 3.0)
    stone_mat = create_material("stone", "ancient_stone", roughness=0.7)

    # Grand central basin
    basin = create_cylinder("main_basin", 1.5, 0.5, (0, 0, 0.25), 16)
    basin.data.materials.append(basin_mat)
    parts.append(basin)

    # Water surface
    water = create_cylinder("main_water", 1.3, 0.15, (0, 0, 0.45))
    water.data.materials.append(water_mat)
    parts.append(water)

    # Ornate rim
    rim = create_torus("main_rim", 1.4, 0.1, (0, 0, 0.5))
    rim.data.materials.append(basin_mat)
    parts.append(rim)

    # Surrounding pillars with arches
    for i, angle in enumerate(range(0, 360, 45)):
        rad = math.radians(angle)
        x = math.cos(rad) * 2.0
        y = math.sin(rad) * 2.0

        pillar = create_cylinder(f"pillar_{i}", 0.12, 2.5, (x, y, 1.25), 8)
        pillar.data.materials.append(stone_mat)
        parts.append(pillar)

        # Top decoration
        cap = create_cone(f"cap_{i}", 0.18, 0.3, (x, y, 2.65), 6)
        cap.data.materials.append(stone_mat)
        parts.append(cap)

    # Floating moon shard (large central crystal)
    shard = create_cone("moon_shard", 0.4, 1.2, (0, 0, 2.5), 6)
    shard.rotation_euler.x = math.pi  # Point down
    shard_mat = create_glow_material("shard", "moon_white", 5.0)
    shard.data.materials.append(shard_mat)
    parts.append(shard)

    # Glow ring under shard
    glow_ring = create_torus("glow_ring", 0.5, 0.08, (0, 0, 1.8))
    glow_ring.data.materials.append(water_mat)
    parts.append(glow_ring)

    # Small floating crystals around shard
    for i in range(6):
        angle = i * 60
        rad = math.radians(angle)
        x = math.cos(rad) * 0.8
        y = math.sin(rad) * 0.8
        z = 2.2 + math.sin(rad * 2) * 0.2
        crystal = create_cone(f"crystal_{i}", 0.08, 0.25, (x, y, z), 5)
        crystal.data.materials.append(shard_mat)
        parts.append(crystal)

    return join_objects(parts, "moon_wells_tier2")


# ─────────────────────────────────────────────────────────────
# Building Generators - Ancient of War (Barracks)
# ─────────────────────────────────────────────────────────────

def create_ancient_of_war_tier0() -> bpy.types.Object:
    """Ancient of War Tier 0: War Sapling - Young tree with embedded blades."""
    clear_scene()
    parts = []

    # Trunk
    trunk = create_organic_trunk("trunk", 0.25, 0.12, 1.8, segments=8, wobble=0.08)
    trunk_mat = create_material("bark", "ancient_bark", roughness=0.85)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Embedded blades
    blade_mat = create_material("blade", "moonsilver", metallic=0.7, roughness=0.3)
    for angle in [30, 150, 270]:
        rad = math.radians(angle)
        blade = create_box(f"blade_{angle}", (0.08, 0.5, 0.15),
                          (math.cos(rad) * 0.25, math.sin(rad) * 0.25, 1.0))
        blade.rotation_euler.z = rad
        blade.data.materials.append(blade_mat)
        parts.append(blade)

    # Small canopy
    canopy = create_leaf_cluster("canopy", 0.6, (0, 0, 2.2))
    canopy_mat = create_material("canopy", "silverleaf", roughness=0.75)
    canopy.data.materials.append(canopy_mat)
    parts.append(canopy)

    # War rune glow
    rune = create_box("rune", (0.3, 0.02, 0.3), (0, -0.25, 0.8))
    rune_mat = create_glow_material("rune", "ancient_purple", 1.5)
    rune.data.materials.append(rune_mat)
    parts.append(rune)

    return join_objects(parts, "ancient_of_war_tier0")


def create_ancient_of_war_tier1() -> bpy.types.Object:
    """Ancient of War Tier 1: Armored tree with weapon racks."""
    clear_scene()
    parts = []

    trunk_mat = create_material("bark", "ancient_bark", roughness=0.85)
    armor_mat = create_material("armor", "moonsilver", metallic=0.6, roughness=0.4)
    blade_mat = create_material("blade", "moonsilver", metallic=0.7, roughness=0.3)

    # Main trunk
    trunk = create_organic_trunk("trunk", 0.5, 0.3, 3.0, segments=12, wobble=0.1)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Armor plates on trunk
    for z in [0.8, 1.4, 2.0]:
        for angle in [0, 120, 240]:
            rad = math.radians(angle)
            plate = create_box(f"plate_{z}_{angle}", (0.3, 0.08, 0.4),
                             (math.cos(rad) * 0.4, math.sin(rad) * 0.4, z))
            plate.rotation_euler.z = rad
            plate.data.materials.append(armor_mat)
            parts.append(plate)

    # Weapon racks on roots
    for i, angle in enumerate([45, 165, 285]):
        rad = math.radians(angle)
        x = math.cos(rad) * 1.0
        y = math.sin(rad) * 1.0

        rack = create_box(f"rack_{i}", (0.6, 0.1, 0.8), (x, y, 0.4))
        rack.rotation_euler.z = rad
        rack.data.materials.append(trunk_mat)
        parts.append(rack)

        # Glaive on rack
        glaive = create_box(f"glaive_{i}", (0.08, 0.05, 0.6), (x, y, 0.85))
        glaive.rotation_euler.z = rad
        glaive.data.materials.append(blade_mat)
        parts.append(glaive)

    # Glowing war eyes
    eye_mat = create_glow_material("eyes", "ancient_purple", 2.5)
    for x in [-0.2, 0.2]:
        eye = create_sphere(f"eye_{x}", 0.1, (x, -0.4, 2.3))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # Canopy
    canopy = create_leaf_cluster("canopy", 1.2, (0, 0, 3.8))
    canopy_mat = create_material("canopy", "ancient_purple", roughness=0.75)
    canopy.data.materials.append(canopy_mat)
    parts.append(canopy)

    return join_objects(parts, "ancient_of_war_tier1")


def create_ancient_of_war_tier2() -> bpy.types.Object:
    """Ancient of War Tier 2: War Fortress - Battle-scarred giant with siege."""
    clear_scene()
    parts = []

    trunk_mat = create_material("bark", "ancient_bark", roughness=0.9)
    armor_mat = create_material("armor", "moonsilver", metallic=0.6, roughness=0.4)
    blade_mat = create_material("blade", "moonsilver", metallic=0.7, roughness=0.25)
    scar_mat = create_material("scar", "ancient_purple", emissive=0.5)

    # Massive trunk
    trunk = create_organic_trunk("trunk", 0.8, 0.45, 4.0, segments=16, wobble=0.12)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Battle scars (glowing cuts)
    for i, (x, z, angle) in enumerate([(0.4, 1.5, 20), (-0.35, 2.2, -15), (0.3, 2.8, 30)]):
        scar = create_box(f"scar_{i}", (0.5, 0.03, 0.08), (x, -0.35, z))
        scar.rotation_euler = (0, 0, math.radians(angle))
        scar.data.materials.append(scar_mat)
        parts.append(scar)

    # Heavy armor plates
    for z in [0.8, 1.5, 2.2, 2.9]:
        for angle in range(0, 360, 60):
            rad = math.radians(angle)
            plate = create_box(f"plate_{z}_{angle}", (0.35, 0.1, 0.5),
                             (math.cos(rad) * 0.55, math.sin(rad) * 0.55, z))
            plate.rotation_euler.z = rad
            plate.data.materials.append(armor_mat)
            parts.append(plate)

    # Large siege blade arms
    for x in [-1, 1]:
        arm = create_organic_trunk(f"arm_{x}", 0.15, 0.08, 1.5, wobble=0.05)
        arm.rotation_euler = (0, math.radians(60 * x), 0)
        arm.location = (x * 0.5, 0, 2.5)
        arm.data.materials.append(trunk_mat)
        parts.append(arm)

        # Large glaive
        glaive_handle = create_cylinder(f"glaive_h_{x}", 0.04, 1.8,
                                        (x * 1.3, 0, 3.0), 8)
        glaive_handle.data.materials.append(trunk_mat)
        parts.append(glaive_handle)

        glaive_blade = create_box(f"glaive_b_{x}", (0.1, 0.8, 0.3),
                                  (x * 1.3, 0, 3.9))
        glaive_blade.data.materials.append(blade_mat)
        parts.append(glaive_blade)

    # Fierce glowing eyes
    eye_mat = create_glow_material("eyes", "ancient_purple", 4.0)
    for x in [-0.25, 0.25]:
        eye = create_sphere(f"eye_{x}", 0.15, (x, -0.55, 3.0))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # War crown (spiked) on canopy
    canopy = create_leaf_cluster("canopy", 1.5, (0, 0, 4.8))
    canopy_mat = create_material("canopy", "ancient_purple", roughness=0.7)
    canopy.data.materials.append(canopy_mat)
    parts.append(canopy)

    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        spike = create_cone(f"spike_{angle}", 0.08, 0.5,
                           (math.cos(rad) * 1.0, math.sin(rad) * 1.0, 5.2), 4)
        spike.data.materials.append(blade_mat)
        parts.append(spike)

    return join_objects(parts, "ancient_of_war_tier2")


# ─────────────────────────────────────────────────────────────
# Building Generators - Chimaera Roost (Stables)
# ─────────────────────────────────────────────────────────────

def create_chimaera_roost_tier0() -> bpy.types.Object:
    """Chimaera Roost Tier 0: Nest - Woven branch platform."""
    clear_scene()
    parts = []

    branch_mat = create_material("branch", "ancient_bark", roughness=0.85)
    leaf_mat = create_material("leaf", "silverleaf", roughness=0.8)

    # Base platform (woven branches)
    base = create_cylinder("base", 1.0, 0.3, (0, 0, 0.15), 12)
    base.data.materials.append(branch_mat)
    parts.append(base)

    # Rim branches
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        x = math.cos(rad) * 0.9
        y = math.sin(rad) * 0.9
        branch = create_cylinder(f"rim_{angle}", 0.05, 0.6, (x, y, 0.5), 6)
        branch.rotation_euler = (math.radians(30), 0, rad)
        branch.data.materials.append(branch_mat)
        parts.append(branch)

    # Nest interior (soft material)
    nest = create_cylinder("nest_inside", 0.7, 0.15, (0, 0, 0.25), 10)
    nest_mat = create_material("nest", "silverleaf", roughness=0.95)
    nest.data.materials.append(nest_mat)
    parts.append(nest)

    # Single egg
    egg = create_sphere("egg", 0.15, (0, 0, 0.4))
    egg.scale.z = 1.3
    bpy.ops.object.transform_apply(scale=True)
    egg_mat = create_material("egg", "moon_white", roughness=0.4)
    egg.data.materials.append(egg_mat)
    parts.append(egg)

    return join_objects(parts, "chimaera_roost_tier0")


def create_chimaera_roost_tier1() -> bpy.types.Object:
    """Chimaera Roost Tier 1: Elevated structure with perches."""
    clear_scene()
    parts = []

    branch_mat = create_material("branch", "ancient_bark", roughness=0.85)
    platform_mat = create_material("platform", "ancient_stone", roughness=0.7)
    silver_mat = create_material("silver", "moonsilver", metallic=0.5, roughness=0.4)

    # Central trunk/support
    trunk = create_organic_trunk("trunk", 0.3, 0.2, 2.5, segments=8, wobble=0.1)
    trunk.data.materials.append(branch_mat)
    parts.append(trunk)

    # Main platform
    platform = create_cylinder("platform", 1.2, 0.2, (0, 0, 2.5), 8)
    platform.data.materials.append(platform_mat)
    parts.append(platform)

    # Perch branches
    for i, (angle, height) in enumerate([(0, 2.8), (120, 3.0), (240, 2.9)]):
        rad = math.radians(angle)
        perch = create_organic_trunk(f"perch_{i}", 0.1, 0.05, 1.5, wobble=0.05)
        perch.rotation_euler = (math.radians(70), 0, rad)
        perch.location = (math.cos(rad) * 0.8, math.sin(rad) * 0.8, height)
        perch.data.materials.append(branch_mat)
        parts.append(perch)

    # Decorative silver rings
    for z in [1.5, 2.2]:
        ring = create_torus(f"ring_{z}", 0.35, 0.03, (0, 0, z))
        ring.data.materials.append(silver_mat)
        parts.append(ring)

    # Nest on platform
    nest = create_cylinder("nest", 0.6, 0.25, (0.3, 0, 2.7), 10)
    nest_mat = create_material("nest", "silverleaf", roughness=0.9)
    nest.data.materials.append(nest_mat)
    parts.append(nest)

    return join_objects(parts, "chimaera_roost_tier1")


def create_chimaera_roost_tier2() -> bpy.types.Object:
    """Chimaera Roost Tier 2: Aerie - Grand multi-level with glowing eggs."""
    clear_scene()
    parts = []

    branch_mat = create_material("branch", "ancient_bark", roughness=0.85)
    platform_mat = create_material("platform", "ancient_stone", roughness=0.7)
    silver_mat = create_material("silver", "moonsilver", metallic=0.5, roughness=0.4)

    # Multiple trunk supports
    for i, (x, y) in enumerate([(-0.5, -0.5), (0.5, -0.5), (0, 0.6)]):
        trunk = create_organic_trunk(f"trunk_{i}", 0.25, 0.15, 3.5, wobble=0.1)
        trunk.location = (x, y, 0)
        trunk.data.materials.append(branch_mat)
        parts.append(trunk)

    # Multi-level platforms
    for z, radius in [(2.0, 1.0), (3.0, 1.3), (4.0, 1.1)]:
        platform = create_cylinder(f"platform_{z}", radius, 0.15, (0, 0, z), 10)
        platform.data.materials.append(platform_mat)
        parts.append(platform)

    # Grand perches
    for angle in range(0, 360, 60):
        rad = math.radians(angle)
        perch = create_organic_trunk(f"perch_{angle}", 0.12, 0.05, 2.0, wobble=0.08)
        perch.rotation_euler = (math.radians(60), 0, rad)
        perch.location = (math.cos(rad) * 1.1, math.sin(rad) * 1.1, 4.0)
        perch.data.materials.append(branch_mat)
        parts.append(perch)

    # Glowing eggs in nests
    egg_mat = create_glow_material("egg_glow", "elune_glow", 1.5)
    egg_shell = create_material("egg_shell", "moon_white", roughness=0.3)

    for i, (x, y, z) in enumerate([(0.5, 0, 2.2), (-0.3, 0.4, 3.2), (0, -0.5, 4.2)]):
        # Nest
        nest = create_cylinder(f"nest_{i}", 0.35, 0.2, (x, y, z), 8)
        nest_mat = create_material(f"nest_{i}", "silverleaf", roughness=0.9)
        nest.data.materials.append(nest_mat)
        parts.append(nest)

        # Glowing egg
        egg = create_sphere(f"egg_{i}", 0.12, (x, y, z + 0.2))
        egg.scale.z = 1.4
        bpy.ops.object.transform_apply(scale=True)
        egg.data.materials.append(egg_mat)
        parts.append(egg)

    # Silver archway decoration
    arch = create_torus("arch", 1.5, 0.06, (0, 0, 4.5))
    arch.data.materials.append(silver_mat)
    parts.append(arch)

    return join_objects(parts, "chimaera_roost_tier2")


# ─────────────────────────────────────────────────────────────
# Building Generators - Ancient of Wonders (Library)
# ─────────────────────────────────────────────────────────────

def create_ancient_of_wonders_tier0() -> bpy.types.Object:
    """Ancient of Wonders Tier 0: Runestone - Carved stone with inscriptions."""
    clear_scene()
    parts = []

    # Main stone
    stone = create_box("stone", (1.0, 0.6, 1.8), (0, 0, 0.9))
    stone_mat = create_material("stone", "ancient_stone", roughness=0.75)
    stone.data.materials.append(stone_mat)
    parts.append(stone)

    # Rune carvings (glowing lines)
    rune_mat = create_glow_material("runes", "elune_glow", 2.5)
    rune_positions = [
        (0, -0.32, 0.5, 0.6, 0.1),
        (0, -0.32, 1.0, 0.4, 0.1),
        (0, -0.32, 1.4, 0.5, 0.1),
    ]
    for i, (x, y, z, w, h) in enumerate(rune_positions):
        rune = create_box(f"rune_{i}", (w, 0.02, h), (x, y, z))
        rune.data.materials.append(rune_mat)
        parts.append(rune)

    # Circular rune at base
    circle = create_torus("rune_circle", 0.5, 0.03, (0, 0, 0.02))
    circle.rotation_euler.x = math.pi / 2
    circle.data.materials.append(rune_mat)
    parts.append(circle)

    return join_objects(parts, "ancient_of_wonders_tier0")


def create_ancient_of_wonders_tier1() -> bpy.types.Object:
    """Ancient of Wonders Tier 1: Wonder Shrine - Open-air temple with tomes."""
    clear_scene()
    parts = []

    stone_mat = create_material("stone", "ancient_stone", roughness=0.7)
    silver_mat = create_material("silver", "moonsilver", metallic=0.5, roughness=0.4)

    # Base platform
    base = create_cylinder("base", 1.5, 0.2, (0, 0, 0.1), 8)
    base.data.materials.append(stone_mat)
    parts.append(base)

    # Pillars
    for angle in range(0, 360, 90):
        rad = math.radians(angle)
        x = math.cos(rad) * 1.2
        y = math.sin(rad) * 1.2

        pillar = create_cylinder(f"pillar_{angle}", 0.1, 2.5, (x, y, 1.35), 8)
        pillar.data.materials.append(stone_mat)
        parts.append(pillar)

        # Pillar cap
        cap = create_sphere(f"cap_{angle}", 0.15, (x, y, 2.65))
        cap.data.materials.append(silver_mat)
        parts.append(cap)

    # Floating tomes
    tome_mat = create_material("tome", "moon_white", roughness=0.5)
    glow_mat = create_glow_material("tome_glow", "elune_glow", 1.5)

    for i, angle in enumerate([0, 120, 240]):
        rad = math.radians(angle)
        x = math.cos(rad) * 0.6
        y = math.sin(rad) * 0.6
        z = 1.5 + i * 0.3

        tome = create_box(f"tome_{i}", (0.4, 0.1, 0.5), (x, y, z))
        tome.rotation_euler = (0, 0, rad)
        tome.data.materials.append(tome_mat)
        parts.append(tome)

        # Glow under tome
        glow = create_sphere(f"glow_{i}", 0.08, (x, y, z - 0.15))
        glow.data.materials.append(glow_mat)
        parts.append(glow)

    # Central crystal
    crystal = create_cone("crystal", 0.25, 0.8, (0, 0, 1.8), 6)
    crystal_mat = create_glow_material("crystal", "moon_white", 3.0)
    crystal.data.materials.append(crystal_mat)
    parts.append(crystal)

    return join_objects(parts, "ancient_of_wonders_tier1")


def create_ancient_of_wonders_tier2() -> bpy.types.Object:
    """Ancient of Wonders Tier 2: Celestial Library - Crystalline dome with star map."""
    clear_scene()
    parts = []

    stone_mat = create_material("stone", "ancient_stone", roughness=0.7)
    silver_mat = create_material("silver", "silver_trim", metallic=0.6, roughness=0.3)
    crystal_mat = create_material("crystal", "moon_white", roughness=0.2, metallic=0.3)

    # Grand base
    base = create_cylinder("base", 2.0, 0.3, (0, 0, 0.15), 12)
    base.data.materials.append(stone_mat)
    parts.append(base)

    # Inner sanctum
    inner = create_cylinder("inner", 1.5, 0.5, (0, 0, 0.4), 10)
    inner.data.materials.append(silver_mat)
    parts.append(inner)

    # Crystalline dome (half sphere)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.8, segments=16, ring_count=8, location=(0, 0, 0.65))
    dome = bpy.context.active_object
    dome.name = "dome"
    # Cut bottom half
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(dome.data)
    verts_to_delete = [v for v in bm.verts if v.co.z < 0]
    bmesh.ops.delete(bm, geom=verts_to_delete, context='VERTS')
    bmesh.update_edit_mesh(dome.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    dome.data.materials.append(crystal_mat)
    parts.append(dome)

    # Pillars around dome
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        x = math.cos(rad) * 2.2
        y = math.sin(rad) * 2.2

        pillar = create_cylinder(f"pillar_{angle}", 0.12, 3.0, (x, y, 1.5), 8)
        pillar.data.materials.append(stone_mat)
        parts.append(pillar)

    # Star map (floating orbs inside dome)
    star_mat = create_glow_material("star", "moon_white", 2.0)
    random.seed(42)  # Consistent stars
    for i in range(12):
        x = random.uniform(-1.0, 1.0)
        y = random.uniform(-1.0, 1.0)
        z = random.uniform(1.5, 2.3)
        star = create_sphere(f"star_{i}", 0.05, (x, y, z))
        star.data.materials.append(star_mat)
        parts.append(star)

    # Central orrery
    orrery_base = create_cylinder("orrery_base", 0.3, 0.8, (0, 0, 1.0), 8)
    orrery_base.data.materials.append(silver_mat)
    parts.append(orrery_base)

    # Orrery rings
    for r, z in [(0.4, 1.5), (0.6, 1.6), (0.8, 1.7)]:
        ring = create_torus(f"orrery_{r}", r, 0.02, (0, 0, z))
        ring.rotation_euler.x = math.radians(random.uniform(20, 40))
        ring.rotation_euler.y = math.radians(random.uniform(0, 30))
        ring.data.materials.append(silver_mat)
        parts.append(ring)

    # Central crystal
    central = create_sphere("central_orb", 0.15, (0, 0, 1.6))
    central_mat = create_glow_material("central", "elune_glow", 4.0)
    central.data.materials.append(central_mat)
    parts.append(central)

    return join_objects(parts, "ancient_of_wonders_tier2")


# ─────────────────────────────────────────────────────────────
# Unit Generators
# ─────────────────────────────────────────────────────────────

def create_unit_wisp() -> bpy.types.Object:
    """Wisp - Glowing cyan orb with trailing particles."""
    clear_scene()
    parts = []

    # Core orb
    core = create_sphere("core", 0.3, (0, 0, 0.5))
    core_mat = create_glow_material("wisp_core", "elune_glow", 5.0)
    core.data.materials.append(core_mat)
    parts.append(core)

    # Inner glow (slightly larger, less bright)
    inner = create_sphere("inner", 0.4, (0, 0, 0.5))
    inner_mat = create_glow_material("wisp_inner", "elune_glow", 2.0)
    inner.data.materials.append(inner_mat)
    parts.append(inner)

    # Trail particles (smaller orbs behind)
    trail_mat = create_glow_material("trail", "elune_glow", 1.5)
    for i, z_offset in enumerate([0.2, 0.0, -0.15]):
        scale = 0.15 - i * 0.03
        trail = create_sphere(f"trail_{i}", scale, (0, 0, z_offset))
        trail.data.materials.append(trail_mat)
        parts.append(trail)

    return join_objects(parts, "wisp")


def create_unit_archer() -> bpy.types.Object:
    """Archer - Female elf with bow and quiver."""
    clear_scene()
    parts = []

    skin_mat = create_material("skin", "moon_white", roughness=0.6)
    armor_mat = create_material("armor", "ancient_purple", roughness=0.5)
    silver_mat = create_material("silver", "moonsilver", metallic=0.6, roughness=0.4)
    hair_mat = create_material("hair", "twilight_blue", roughness=0.8)

    # Body (simplified humanoid)
    # Torso
    torso = create_box("torso", (0.35, 0.2, 0.5), (0, 0, 0.9))
    torso.data.materials.append(armor_mat)
    parts.append(torso)

    # Legs
    for x in [-0.1, 0.1]:
        leg = create_box(f"leg_{x}", (0.12, 0.12, 0.5), (x, 0, 0.4))
        leg.data.materials.append(armor_mat)
        parts.append(leg)

    # Head
    head = create_sphere("head", 0.15, (0, 0, 1.35))
    head.data.materials.append(skin_mat)
    parts.append(head)

    # Hair (elongated)
    hair = create_sphere("hair", 0.18, (0, 0.05, 1.4))
    hair.scale = (1.0, 1.2, 1.3)
    bpy.ops.object.transform_apply(scale=True)
    hair.data.materials.append(hair_mat)
    parts.append(hair)

    # Hood
    hood = create_cone("hood", 0.2, 0.25, (0, 0, 1.5), 8)
    hood.data.materials.append(armor_mat)
    parts.append(hood)

    # Arms
    for x in [-0.25, 0.25]:
        arm = create_box(f"arm_{x}", (0.08, 0.08, 0.35), (x, 0, 0.95))
        arm.data.materials.append(skin_mat)
        parts.append(arm)

    # Bow (on side)
    bow_curve = create_cylinder("bow", 0.02, 0.8, (-0.35, 0.1, 0.9), 8)
    bow_curve.rotation_euler.y = math.radians(10)
    bow_curve.data.materials.append(silver_mat)
    parts.append(bow_curve)

    # Quiver (on back)
    quiver = create_cylinder("quiver", 0.06, 0.4, (0.1, 0.15, 1.0), 8)
    quiver.rotation_euler.x = math.radians(15)
    quiver.data.materials.append(armor_mat)
    parts.append(quiver)

    # Arrows in quiver
    arrow_mat = create_material("arrow", "ancient_bark", roughness=0.8)
    for i in range(3):
        arrow = create_cylinder(f"arrow_{i}", 0.015, 0.5,
                               (0.1 + (i-1)*0.03, 0.15, 1.15), 4)
        arrow.rotation_euler.x = math.radians(15)
        arrow.data.materials.append(arrow_mat)
        parts.append(arrow)

    return join_objects(parts, "archer")


def create_unit_huntress() -> bpy.types.Object:
    """Huntress - Mounted on nightsaber with glaive."""
    clear_scene()
    parts = []

    fur_mat = create_material("fur", "shadow_purple", roughness=0.9)
    armor_mat = create_material("armor", "ancient_purple", roughness=0.5)
    silver_mat = create_material("silver", "moonsilver", metallic=0.6, roughness=0.4)
    skin_mat = create_material("skin", "moon_white", roughness=0.6)

    # Nightsaber body
    body = create_box("saber_body", (0.5, 1.0, 0.4), (0, 0, 0.5))
    body.data.materials.append(fur_mat)
    parts.append(body)

    # Saber head
    head = create_box("saber_head", (0.25, 0.3, 0.25), (0, 0.6, 0.65))
    head.data.materials.append(fur_mat)
    parts.append(head)

    # Saber ears
    for x in [-0.1, 0.1]:
        ear = create_cone(f"saber_ear_{x}", 0.05, 0.15, (x, 0.65, 0.85), 4)
        ear.data.materials.append(fur_mat)
        parts.append(ear)

    # Saber legs
    for x, y in [(-0.15, 0.3), (0.15, 0.3), (-0.15, -0.3), (0.15, -0.3)]:
        leg = create_cylinder(f"leg_{x}_{y}", 0.06, 0.4, (x, y, 0.2), 6)
        leg.data.materials.append(fur_mat)
        parts.append(leg)

    # Saber tail
    tail = create_cylinder("tail", 0.04, 0.5, (0, -0.7, 0.5), 6)
    tail.rotation_euler.x = math.radians(-30)
    tail.data.materials.append(fur_mat)
    parts.append(tail)

    # Saber eyes (glowing)
    eye_mat = create_glow_material("saber_eyes", "elune_glow", 2.0)
    for x in [-0.08, 0.08]:
        eye = create_sphere(f"saber_eye_{x}", 0.03, (x, 0.7, 0.7))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # Rider torso
    rider_torso = create_box("rider_torso", (0.3, 0.2, 0.4), (0, 0, 1.0))
    rider_torso.data.materials.append(armor_mat)
    parts.append(rider_torso)

    # Rider head
    rider_head = create_sphere("rider_head", 0.12, (0, 0, 1.35))
    rider_head.data.materials.append(skin_mat)
    parts.append(rider_head)

    # Rider arms holding glaive
    glaive_handle = create_cylinder("glaive_handle", 0.025, 1.2, (0.25, 0.2, 1.1), 6)
    glaive_handle.rotation_euler = (math.radians(30), math.radians(45), 0)
    glaive_handle.data.materials.append(silver_mat)
    parts.append(glaive_handle)

    # Glaive blades (crescent)
    glaive_blade = create_box("glaive_blade", (0.4, 0.08, 0.15), (0.5, 0.4, 1.4))
    glaive_blade.rotation_euler.z = math.radians(45)
    glaive_blade.data.materials.append(silver_mat)
    parts.append(glaive_blade)

    return join_objects(parts, "huntress")


def create_unit_druid() -> bpy.types.Object:
    """Druid of the Claw - Bear form with glowing eyes."""
    clear_scene()
    parts = []

    fur_mat = create_material("fur", "ancient_purple", roughness=0.95)
    claw_mat = create_material("claws", "moonsilver", metallic=0.5, roughness=0.4)

    # Bear body (large and bulky)
    body = create_box("body", (0.8, 1.2, 0.6), (0, 0, 0.6))
    body.data.materials.append(fur_mat)
    parts.append(body)

    # Head
    head = create_box("head", (0.45, 0.5, 0.4), (0, 0.7, 0.9))
    head.data.materials.append(fur_mat)
    parts.append(head)

    # Snout
    snout = create_box("snout", (0.2, 0.25, 0.2), (0, 0.95, 0.8))
    snout.data.materials.append(fur_mat)
    parts.append(snout)

    # Ears
    for x in [-0.18, 0.18]:
        ear = create_sphere(f"ear_{x}", 0.08, (x, 0.65, 1.15))
        ear.data.materials.append(fur_mat)
        parts.append(ear)

    # Glowing eyes
    eye_mat = create_glow_material("eyes", "elune_glow", 3.0)
    for x in [-0.12, 0.12]:
        eye = create_sphere(f"eye_{x}", 0.06, (x, 0.85, 0.95))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # Legs (thick)
    for x, y in [(-0.25, 0.35), (0.25, 0.35), (-0.25, -0.35), (0.25, -0.35)]:
        leg = create_cylinder(f"leg_{x}_{y}", 0.12, 0.5, (x, y, 0.25), 8)
        leg.data.materials.append(fur_mat)
        parts.append(leg)

        # Claws
        for c in range(3):
            claw = create_cone(f"claw_{x}_{y}_{c}", 0.02, 0.1,
                              (x + (c-1)*0.04, y + 0.08, 0.02), 4)
            claw.rotation_euler.x = math.radians(90)
            claw.data.materials.append(claw_mat)
            parts.append(claw)

    # Rune markings (glowing)
    rune_mat = create_glow_material("runes", "ancient_purple", 1.5)
    for i, (x, y, z) in enumerate([(0, -0.3, 0.7), (0.2, 0, 0.8), (-0.2, 0.2, 0.6)]):
        rune = create_box(f"rune_{i}", (0.15, 0.02, 0.05), (x, y, z))
        rune.data.materials.append(rune_mat)
        parts.append(rune)

    return join_objects(parts, "druid")


def create_unit_demon_hunter() -> bpy.types.Object:
    """Demon Hunter - Illidan-inspired blind warrior with warglaives."""
    clear_scene()
    parts = []

    skin_mat = create_material("skin", "shadow_purple", roughness=0.6)
    armor_mat = create_material("armor", "ancient_purple", roughness=0.4)
    blade_mat = create_material("blade", "moonsilver", metallic=0.7, roughness=0.25)

    # Muscular torso
    torso = create_box("torso", (0.45, 0.25, 0.55), (0, 0, 0.95))
    torso.data.materials.append(skin_mat)
    parts.append(torso)

    # Legs
    for x in [-0.12, 0.12]:
        leg = create_box(f"leg_{x}", (0.14, 0.14, 0.55), (x, 0, 0.4))
        leg.data.materials.append(armor_mat)
        parts.append(leg)

    # Head
    head = create_sphere("head", 0.15, (0, 0, 1.4))
    head.data.materials.append(skin_mat)
    parts.append(head)

    # Horns
    horn_mat = create_material("horn", "ancient_bark", roughness=0.7)
    for x in [-0.12, 0.12]:
        horn = create_cone(f"horn_{x}", 0.04, 0.2, (x, -0.05, 1.55), 5)
        horn.rotation_euler = (math.radians(-30), math.radians(20 * (1 if x > 0 else -1)), 0)
        horn.data.materials.append(horn_mat)
        parts.append(horn)

    # Blindfold
    blindfold = create_box("blindfold", (0.18, 0.06, 0.05), (0, -0.12, 1.42))
    blindfold.data.materials.append(armor_mat)
    parts.append(blindfold)

    # Fel tattoo glows
    fel_mat = create_glow_material("fel", "fel_green", 2.5)
    tattoo_positions = [
        (0.15, -0.15, 1.0), (-0.15, -0.15, 1.0),  # Chest
        (0.2, -0.05, 1.1), (-0.2, -0.05, 1.1),    # Shoulders
    ]
    for i, (x, y, z) in enumerate(tattoo_positions):
        tattoo = create_box(f"tattoo_{i}", (0.08, 0.02, 0.03), (x, y, z))
        tattoo.data.materials.append(fel_mat)
        parts.append(tattoo)

    # Arms
    for x in [-0.3, 0.3]:
        arm = create_box(f"arm_{x}", (0.1, 0.1, 0.4), (x, 0, 1.0))
        arm.data.materials.append(skin_mat)
        parts.append(arm)

    # Warglaives
    for x in [-0.45, 0.45]:
        # Handle
        handle = create_cylinder(f"glaive_h_{x}", 0.025, 0.6, (x, 0.15, 0.85), 6)
        handle.rotation_euler.x = math.radians(20)
        handle.data.materials.append(armor_mat)
        parts.append(handle)

        # Blade (crescent shape)
        blade = create_box(f"blade_{x}", (0.05, 0.5, 0.15), (x, 0.35, 0.95))
        blade.rotation_euler.x = math.radians(20)
        blade.data.materials.append(blade_mat)
        parts.append(blade)

    # Folded wings (on back)
    wing_mat = create_material("wing", "shadow_purple", roughness=0.8)
    for x in [-0.25, 0.25]:
        wing = create_box(f"wing_{x}", (0.03, 0.3, 0.5), (x, 0.2, 1.1))
        wing.rotation_euler = (math.radians(-15), math.radians(10 * (1 if x > 0 else -1)), 0)
        wing.data.materials.append(wing_mat)
        parts.append(wing)

    return join_objects(parts, "demon_hunter")


# ─────────────────────────────────────────────────────────────
# Terrain Generators
# ─────────────────────────────────────────────────────────────

def create_terrain_forest_floor(variant: int) -> bpy.types.Object:
    """Forest floor terrain - Dark soil with fallen leaves and roots."""
    clear_scene()
    parts = []

    # Base tile
    base = create_box("base", (TILE_SIZE, TILE_SIZE, 0.15), (0, 0, -0.075))
    base_mat = create_material("soil", "dark_soil", roughness=0.95)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Add variation with small bumps
    random.seed(variant)
    leaf_mat = create_material("leaf", "silverleaf", roughness=0.9)
    for i in range(3 + variant):
        x = random.uniform(-0.8, 0.8)
        y = random.uniform(-0.8, 0.8)
        leaf = create_box(f"leaf_{i}", (0.15, 0.1, 0.02), (x, y, 0.01))
        leaf.rotation_euler.z = random.uniform(0, math.pi * 2)
        leaf.data.materials.append(leaf_mat)
        parts.append(leaf)

    # Small roots
    root_mat = create_material("root", "root_brown", roughness=0.85)
    if variant > 0:
        for i in range(variant):
            angle = random.uniform(0, math.pi * 2)
            root = create_cylinder(f"root_{i}", 0.03, 0.4,
                                  (random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), 0), 5)
            root.rotation_euler = (math.radians(80), 0, angle)
            root.data.materials.append(root_mat)
            parts.append(root)

    return join_objects(parts, f"forest_floor_v{variant}")


def create_terrain_moonlit_clearing(variant: int) -> bpy.types.Object:
    """Moonlit clearing - Silver grass with subtle glow."""
    clear_scene()
    parts = []

    # Base
    base = create_box("base", (TILE_SIZE, TILE_SIZE, 0.12), (0, 0, -0.06))
    base_mat = create_material("grass", "moonlit_grass", roughness=0.9)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Glowing patches
    glow_mat = create_glow_material("moon_glow", "elune_glow", 0.5)
    random.seed(variant + 100)
    for i in range(2 + variant):
        x = random.uniform(-0.6, 0.6)
        y = random.uniform(-0.6, 0.6)
        patch = create_box(f"glow_{i}", (0.2, 0.2, 0.01), (x, y, 0.01))
        patch.data.materials.append(glow_mat)
        parts.append(patch)

    # Small flowers
    flower_mat = create_material("flower", "moon_white", roughness=0.5)
    for i in range(variant + 1):
        x = random.uniform(-0.7, 0.7)
        y = random.uniform(-0.7, 0.7)
        flower = create_sphere(f"flower_{i}", 0.04, (x, y, 0.05))
        flower.data.materials.append(flower_mat)
        parts.append(flower)

    return join_objects(parts, f"moonlit_clearing_v{variant}")


def create_terrain_ancient_roots(variant: int) -> bpy.types.Object:
    """Ancient roots - Massive root systems."""
    clear_scene()
    parts = []

    # Base
    base = create_box("base", (TILE_SIZE, TILE_SIZE, 0.1), (0, 0, -0.05))
    base_mat = create_material("soil", "dark_soil", roughness=0.95)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Large roots
    root_mat = create_material("root", "ancient_bark", roughness=0.85)
    random.seed(variant + 200)

    num_roots = 3 + variant
    for i in range(num_roots):
        angle = (i / num_roots) * math.pi * 2 + random.uniform(-0.3, 0.3)
        length = random.uniform(0.6, 1.0)

        root = create_organic_trunk(f"root_{i}", 0.12, 0.04, length, wobble=0.1)
        root.rotation_euler = (math.radians(75), 0, angle)
        root.location = (0, 0, 0)
        root.data.materials.append(root_mat)
        parts.append(root)

    return join_objects(parts, f"ancient_roots_v{variant}")


def create_terrain_stone_path(variant: int) -> bpy.types.Object:
    """Elven stone path - Worn elven stonework."""
    clear_scene()
    parts = []

    # Base
    base = create_box("base", (TILE_SIZE, TILE_SIZE, 0.08), (0, 0, -0.04))
    base_mat = create_material("base", "dark_soil", roughness=0.95)
    base.data.materials.append(base_mat)
    parts.append(base)

    # Stone tiles
    stone_mat = create_material("stone", "ancient_stone", roughness=0.75)
    random.seed(variant + 300)

    # Grid of stones
    for x in range(-1, 2):
        for y in range(-1, 2):
            if random.random() > 0.2:  # Some gaps
                stone = create_box(f"stone_{x}_{y}",
                                  (0.55 + random.uniform(-0.1, 0.1),
                                   0.55 + random.uniform(-0.1, 0.1),
                                   0.05),
                                  (x * 0.6 + random.uniform(-0.05, 0.05),
                                   y * 0.6 + random.uniform(-0.05, 0.05),
                                   0.025))
                stone.rotation_euler.z = random.uniform(-0.1, 0.1)
                stone.data.materials.append(stone_mat)
                parts.append(stone)

    # Rune inlays
    if variant > 0:
        rune_mat = create_glow_material("rune", "elune_glow", 1.0)
        rune = create_box("rune", (0.3, 0.02, 0.01), (0, 0, 0.055))
        rune.data.materials.append(rune_mat)
        parts.append(rune)

    return join_objects(parts, f"stone_path_v{variant}")


# ─────────────────────────────────────────────────────────────
# Props Generators
# ─────────────────────────────────────────────────────────────

def create_prop_moonwell_small() -> bpy.types.Object:
    """Small decorative moonwell."""
    clear_scene()
    parts = []

    basin = create_cylinder("basin", 0.4, 0.25, (0, 0, 0.125), 10)
    basin_mat = create_material("basin", "moonsilver", metallic=0.5, roughness=0.4)
    basin.data.materials.append(basin_mat)
    parts.append(basin)

    water = create_cylinder("water", 0.32, 0.08, (0, 0, 0.2))
    water_mat = create_glow_material("water", "elune_glow", 2.0)
    water.data.materials.append(water_mat)
    parts.append(water)

    return join_objects(parts, "moonwell_small")


def create_prop_ancient_tree_dead() -> bpy.types.Object:
    """Corrupted/withered tree."""
    clear_scene()
    parts = []

    trunk = create_organic_trunk("trunk", 0.3, 0.1, 2.0, wobble=0.15)
    trunk_mat = create_material("dead_bark", "shadow_purple", roughness=0.9)
    trunk.data.materials.append(trunk_mat)
    parts.append(trunk)

    # Bare branches
    for i, (angle, height, length) in enumerate([
        (30, 1.5, 0.6), (150, 1.7, 0.5), (270, 1.4, 0.7)
    ]):
        rad = math.radians(angle)
        branch = create_organic_trunk(f"branch_{i}", 0.06, 0.02, length, wobble=0.1)
        branch.rotation_euler = (math.radians(50), 0, rad)
        branch.location = (math.cos(rad) * 0.15, math.sin(rad) * 0.15, height)
        branch.data.materials.append(trunk_mat)
        parts.append(branch)

    return join_objects(parts, "ancient_tree_dead")


def create_prop_banner() -> bpy.types.Object:
    """Night Elf banner."""
    clear_scene()
    parts = []

    # Pole
    pole = create_cylinder("pole", 0.03, 1.8, (0, 0, 0.9), 8)
    pole_mat = create_material("pole", "moonsilver", metallic=0.5, roughness=0.4)
    pole.data.materials.append(pole_mat)
    parts.append(pole)

    # Banner cloth
    banner = create_box("banner", (0.5, 0.03, 0.7), (0.25, 0, 1.45))
    banner_mat = create_material("banner", "ancient_purple", roughness=0.7)
    banner.data.materials.append(banner_mat)
    parts.append(banner)

    # Moon symbol (glowing)
    moon = create_sphere("moon", 0.1, (0.25, -0.03, 1.45))
    moon_mat = create_glow_material("moon", "moon_white", 1.5)
    moon.data.materials.append(moon_mat)
    parts.append(moon)

    return join_objects(parts, "banner_night_elf")


def create_prop_lantern() -> bpy.types.Object:
    """Glowing moon lantern."""
    clear_scene()
    parts = []

    # Frame
    frame_mat = create_material("frame", "moonsilver", metallic=0.5, roughness=0.4)

    # Top ring
    top = create_torus("top", 0.08, 0.015, (0, 0, 0.35))
    top.data.materials.append(frame_mat)
    parts.append(top)

    # Bottom ring
    bottom = create_torus("bottom", 0.08, 0.015, (0, 0, 0.1))
    bottom.data.materials.append(frame_mat)
    parts.append(bottom)

    # Bars
    for angle in [0, 90, 180, 270]:
        rad = math.radians(angle)
        bar = create_cylinder(f"bar_{angle}", 0.01, 0.25,
                             (math.cos(rad) * 0.08, math.sin(rad) * 0.08, 0.225), 4)
        bar.data.materials.append(frame_mat)
        parts.append(bar)

    # Inner glow
    glow = create_sphere("glow", 0.06, (0, 0, 0.225))
    glow_mat = create_glow_material("glow", "elune_glow", 4.0)
    glow.data.materials.append(glow_mat)
    parts.append(glow)

    # Hook
    hook = create_cylinder("hook", 0.01, 0.1, (0, 0, 0.4), 4)
    hook.data.materials.append(frame_mat)
    parts.append(hook)

    return join_objects(parts, "lantern_elune")


def create_prop_rune_stone() -> bpy.types.Object:
    """Carved standing stone with runes."""
    clear_scene()
    parts = []

    stone = create_box("stone", (0.4, 0.2, 1.0), (0, 0, 0.5))
    stone_mat = create_material("stone", "ancient_stone", roughness=0.75)
    stone.data.materials.append(stone_mat)
    parts.append(stone)

    # Rune carvings
    rune_mat = create_glow_material("rune", "elune_glow", 1.5)
    for z in [0.3, 0.5, 0.7]:
        rune = create_box(f"rune_{z}", (0.25, 0.02, 0.06), (0, -0.12, z))
        rune.data.materials.append(rune_mat)
        parts.append(rune)

    return join_objects(parts, "rune_stone")


def create_prop_mushroom_cluster() -> bpy.types.Object:
    """Bioluminescent fungi cluster."""
    clear_scene()
    parts = []

    cap_mat = create_glow_material("cap", "elune_glow", 1.5)
    stem_mat = create_material("stem", "moon_white", roughness=0.7)

    positions = [(0, 0, 0), (0.15, 0.1, 0), (-0.1, 0.12, 0), (0.08, -0.12, 0)]
    sizes = [0.12, 0.08, 0.1, 0.06]

    for i, ((x, y, z), size) in enumerate(zip(positions, sizes)):
        # Stem
        stem = create_cylinder(f"stem_{i}", size * 0.3, size * 2, (x, y, size), 6)
        stem.data.materials.append(stem_mat)
        parts.append(stem)

        # Cap
        cap = create_cone(f"cap_{i}", size, size * 0.5, (x, y, size * 2.2), 8)
        cap.rotation_euler.x = math.pi
        cap.data.materials.append(cap_mat)
        parts.append(cap)

    return join_objects(parts, "mushroom_cluster")


def create_prop_weapon_rack() -> bpy.types.Object:
    """Glaives/bows display rack."""
    clear_scene()
    parts = []

    wood_mat = create_material("wood", "ancient_bark", roughness=0.85)
    blade_mat = create_material("blade", "moonsilver", metallic=0.6, roughness=0.35)

    # Frame
    base = create_box("base", (0.8, 0.15, 0.1), (0, 0, 0.05))
    base.data.materials.append(wood_mat)
    parts.append(base)

    for x in [-0.35, 0.35]:
        post = create_box(f"post_{x}", (0.08, 0.08, 0.8), (x, 0, 0.45))
        post.data.materials.append(wood_mat)
        parts.append(post)

    crossbar = create_box("crossbar", (0.8, 0.06, 0.06), (0, 0, 0.8))
    crossbar.data.materials.append(wood_mat)
    parts.append(crossbar)

    # Weapons
    for i, x in enumerate([-0.2, 0, 0.2]):
        weapon = create_box(f"glaive_{i}", (0.04, 0.4, 0.08), (x, 0, 0.5))
        weapon.rotation_euler.x = math.radians(15)
        weapon.data.materials.append(blade_mat)
        parts.append(weapon)

    return join_objects(parts, "weapon_rack")


def create_prop_owl_statue() -> bpy.types.Object:
    """Stone owl sentinel."""
    clear_scene()
    parts = []

    stone_mat = create_material("stone", "ancient_stone", roughness=0.75)
    eye_mat = create_glow_material("eyes", "elune_glow", 2.0)

    # Body
    body = create_sphere("body", 0.25, (0, 0, 0.35))
    body.scale = (0.8, 0.7, 1.2)
    bpy.ops.object.transform_apply(scale=True)
    body.data.materials.append(stone_mat)
    parts.append(body)

    # Head
    head = create_sphere("head", 0.18, (0, 0, 0.65))
    head.data.materials.append(stone_mat)
    parts.append(head)

    # Ear tufts
    for x in [-0.1, 0.1]:
        ear = create_cone(f"ear_{x}", 0.04, 0.12, (x, 0, 0.8), 4)
        ear.data.materials.append(stone_mat)
        parts.append(ear)

    # Beak
    beak = create_cone("beak", 0.04, 0.08, (0, -0.15, 0.62), 4)
    beak.rotation_euler.x = math.radians(90)
    beak.data.materials.append(stone_mat)
    parts.append(beak)

    # Eyes
    for x in [-0.06, 0.06]:
        eye = create_sphere(f"eye_{x}", 0.04, (x, -0.12, 0.68))
        eye.data.materials.append(eye_mat)
        parts.append(eye)

    # Base
    base = create_cylinder("base", 0.2, 0.1, (0, 0, 0.05), 8)
    base.data.materials.append(stone_mat)
    parts.append(base)

    return join_objects(parts, "owl_statue")


def create_prop_moon_crystal() -> bpy.types.Object:
    """Floating moon crystal."""
    clear_scene()
    parts = []

    # Main crystal
    crystal = create_cone("crystal", 0.15, 0.5, (0, 0, 0.5), 6)
    crystal_mat = create_glow_material("crystal", "moon_white", 3.5)
    crystal.data.materials.append(crystal_mat)
    parts.append(crystal)

    # Inverted crystal below
    crystal2 = create_cone("crystal2", 0.1, 0.3, (0, 0, 0.15), 6)
    crystal2.rotation_euler.x = math.pi
    crystal2.data.materials.append(crystal_mat)
    parts.append(crystal2)

    # Glow ring
    ring = create_torus("ring", 0.2, 0.02, (0, 0, 0.3))
    ring_mat = create_glow_material("ring", "elune_glow", 2.0)
    ring.data.materials.append(ring_mat)
    parts.append(ring)

    return join_objects(parts, "moon_crystal")


def create_decal_wisp_trail() -> bpy.types.Object:
    """Wisp trail particle effect decal."""
    clear_scene()
    parts = []

    trail_mat = create_glow_material("trail", "elune_glow", 2.0)

    for i in range(5):
        x = i * 0.15 - 0.3
        size = 0.08 - i * 0.01
        orb = create_sphere(f"orb_{i}", size, (x, 0, 0.05))
        orb.data.materials.append(trail_mat)
        parts.append(orb)

    return join_objects(parts, "wisp_trail")


def create_decal_selection_ring() -> bpy.types.Object:
    """Selection ring for units/buildings."""
    clear_scene()

    ring = create_torus("ring", 1.0, 0.05, (0, 0, 0.05))
    ring_mat = create_glow_material("selection", "moon_white", 2.0)
    ring.data.materials.append(ring_mat)

    ring.name = "selection_ring"
    return ring


# ─────────────────────────────────────────────────────────────
# Main Generation
# ─────────────────────────────────────────────────────────────

def generate_all_assets():
    """Generate all Night Elf themed BlazeCraft assets."""
    print("=" * 60)
    print("BlazeCraft Night Elf Asset Generator")
    print("=" * 60)

    # Building generators map
    building_generators = {
        "tree_of_life": [
            create_tree_of_life_tier0,
            create_tree_of_life_tier1,
            create_tree_of_life_tier2,
        ],
        "ancient_of_lore": [
            create_ancient_of_lore_tier0,
            create_ancient_of_lore_tier1,
            create_ancient_of_lore_tier2,
        ],
        "moon_wells": [
            create_moon_wells_tier0,
            create_moon_wells_tier1,
            create_moon_wells_tier2,
        ],
        "ancient_of_war": [
            create_ancient_of_war_tier0,
            create_ancient_of_war_tier1,
            create_ancient_of_war_tier2,
        ],
        "chimaera_roost": [
            create_chimaera_roost_tier0,
            create_chimaera_roost_tier1,
            create_chimaera_roost_tier2,
        ],
        "ancient_of_wonders": [
            create_ancient_of_wonders_tier0,
            create_ancient_of_wonders_tier1,
            create_ancient_of_wonders_tier2,
        ],
    }

    # Generate buildings
    print("\n[Buildings]")
    for building_name, tier_funcs in building_generators.items():
        for tier, func in enumerate(tier_funcs):
            print(f"  Creating {building_name} tier {tier}...")
            obj = func()
            export_glb(obj, OUTPUT_DIR / f"buildings/{building_name}/tier{tier}.glb")

    # Unit generators
    unit_generators = {
        "wisp": create_unit_wisp,
        "archer": create_unit_archer,
        "huntress": create_unit_huntress,
        "druid": create_unit_druid,
        "demon_hunter": create_unit_demon_hunter,
    }

    # Generate units
    print("\n[Units]")
    for unit_name, func in unit_generators.items():
        print(f"  Creating {unit_name}...")
        obj = func()
        export_glb(obj, OUTPUT_DIR / f"units/{unit_name}.glb")

    # Terrain generators
    terrain_generators = {
        "forest_floor": create_terrain_forest_floor,
        "moonlit_clearing": create_terrain_moonlit_clearing,
        "ancient_roots": create_terrain_ancient_roots,
        "stone_path": create_terrain_stone_path,
    }

    # Generate terrain
    print("\n[Terrain]")
    for terrain_name, func in terrain_generators.items():
        for variant in range(3):
            print(f"  Creating {terrain_name} variant {variant}...")
            obj = func(variant)
            export_glb(obj, OUTPUT_DIR / f"tiles/{terrain_name}_v{variant}.glb")

    # Prop generators
    prop_generators = {
        "moonwell_small": create_prop_moonwell_small,
        "ancient_tree_dead": create_prop_ancient_tree_dead,
        "banner_night_elf": create_prop_banner,
        "lantern_elune": create_prop_lantern,
        "rune_stone": create_prop_rune_stone,
        "mushroom_cluster": create_prop_mushroom_cluster,
        "weapon_rack": create_prop_weapon_rack,
        "owl_statue": create_prop_owl_statue,
        "moon_crystal": create_prop_moon_crystal,
        "wisp_trail": create_decal_wisp_trail,
    }

    # Generate props
    print("\n[Props]")
    for prop_name, func in prop_generators.items():
        print(f"  Creating {prop_name}...")
        obj = func()
        export_glb(obj, OUTPUT_DIR / f"props/{prop_name}.glb")

    # Decals
    print("\n[Decals]")
    print("  Creating selection_ring...")
    obj = create_decal_selection_ring()
    export_glb(obj, OUTPUT_DIR / "decals/selection_ring.glb")

    print("\n" + "=" * 60)
    print("Asset generation complete!")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    generate_all_assets()
