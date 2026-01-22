# Sandlot Sluggers Asset Pipeline

This document defines the production-ready pipeline for sourcing, validating, and integrating 3D assets (players, crowd, and environment) into Sandlot Sluggers.

## 1) Approved Sources

### Character Models (Players + Crowd)

- **Primary**: Sketchfab (commercial-use licensing required)
- **Secondary**: Hyper3D / Hunyuan3D (for bespoke props or non-animated background variants)
- **Not permitted**: Any asset with MLB/NCAA branding, real player likenesses, or restricted licenses.

### Environment Assets

- **HDRI**: Polyhaven (CC0)
- **Textures**: Polyhaven (CC0)

## 2) Asset Intake Requirements

For every external asset added to the project:

- Record the **asset name**, **source URL**, **author**, and **license** in `ASSET_SOURCES.md`.
- Confirm **commercial-use rights** and document proof (license text or source page).
- Verify **no MLB/NCAA logos, wordmarks, or real player likenesses**.
- Ensure **stylized/cartoon** aesthetic alignment with the existing field.

## 3) Blender Integration Standards

### Scale + Orientation

- Target real-world height: **1.7m** for adult players.
- Keep Blender scene in **Z-up** with GLB export settings aligned to the existing contract.

### Naming Conventions

- All custom nodes must use the `SYB_` prefix.
- Player roots should follow: `SYB_Player_<Role>` (e.g., `SYB_Player_Pitcher`).
- Crowd roots should follow: `SYB_Crowd_<Index>` (e.g., `SYB_Crowd_01`).

### Anchors + Placement

- Snap players to existing anchors:
  - `SYB_Anchor_Mound` (pitcher), `SYB_Anchor_Catcher`, `SYB_Anchor_Batter`
  - `SYB_Anchor_1B_F`, `SYB_Anchor_2B_F`, `SYB_Anchor_SS_F`, `SYB_Anchor_3B_F`
  - `SYB_Anchor_LF_F`, `SYB_Anchor_CF_F`, `SYB_Anchor_RF_F`
- Orient fielders to face home plate; batter to face the mound.

### Animation (if rigged)

- Keep armatures intact and named with `SYB_Armature_<Role>`.
- Store actions as separate clips (`Idle`, `Throw`, `Swing`, `Run`) for NLA usage.

## 4) Export + Validation

- Export the field as `public/assets/sandlot-field.glb`.
- Run the validation script:
  - `node scripts/validate-glb.mjs public/assets/sandlot-field.glb`
- Ensure no missing required anchors and no non-`SYB_` custom nodes.

## 5) Performance + Optimization

- Use **instancing** for crowd members to minimize draw calls.
- Prefer **compressed textures** and keep poly counts moderate for web performance.
- Avoid excessive material variants; keep shaders simple and baked when possible.
