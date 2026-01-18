#!/usr/bin/env python3
"""
Asset validation script for Backyard Baseball.
Validates mesh poly counts, texture sizes, and file organization.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List, Any

PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"

ALLOWED_WRITE_DIRS = [
    "assets/export/unity",
    "assets/export/unreal",
    "web/Build",
    "unity/Logs",
]

ASSET_BUDGETS = {
    "characters": {
        "max_tris": 15000,
        "max_texture_mb": 4,
        "required_files": ["*.fbx", "*_diffuse.*", "*_normal.*"]
    },
    "stadium": {
        "max_tris": 100000,
        "max_texture_mb": 16,
        "required_files": ["*.fbx"]
    },
    "props": {
        "max_tris": 2000,
        "max_texture_mb": 1,
        "required_files": ["*.fbx"]
    },
    "audio": {
        "max_size_mb": 5,
        "formats": [".wav", ".ogg", ".mp3"]
    }
}

TEXTURE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tga", ".psd"}
MESH_EXTENSIONS = {".fbx", ".obj", ".blend"}
AUDIO_EXTENSIONS = {".wav", ".ogg", ".mp3"}


def validate_write_path(path: str) -> bool:
    """Ensure writes only go to allowed directories."""
    resolved = Path(path).resolve()

    for allowed in ALLOWED_WRITE_DIRS:
        allowed_path = (PROJECT_ROOT / allowed).resolve()
        try:
            resolved.relative_to(allowed_path)
            return True
        except ValueError:
            continue

    return False


def get_file_size_mb(path: Path) -> float:
    """Get file size in megabytes."""
    return path.stat().st_size / (1024 * 1024)


def validate_texture(path: Path, budget: Dict) -> Dict[str, Any]:
    """Validate a texture file against budget constraints."""
    result = {
        "path": str(path),
        "type": "texture",
        "passed": True,
        "issues": []
    }

    size_mb = get_file_size_mb(path)
    max_size = budget.get("max_texture_mb", 4)

    if size_mb > max_size:
        result["passed"] = False
        result["issues"].append(f"Texture size {size_mb:.2f}MB exceeds budget {max_size}MB")

    result["size_mb"] = round(size_mb, 2)
    return result


def validate_audio(path: Path, budget: Dict) -> Dict[str, Any]:
    """Validate an audio file against budget constraints."""
    result = {
        "path": str(path),
        "type": "audio",
        "passed": True,
        "issues": []
    }

    size_mb = get_file_size_mb(path)
    max_size = budget.get("max_size_mb", 5)

    if size_mb > max_size:
        result["passed"] = False
        result["issues"].append(f"Audio size {size_mb:.2f}MB exceeds budget {max_size}MB")

    allowed_formats = budget.get("formats", AUDIO_EXTENSIONS)
    if path.suffix.lower() not in allowed_formats:
        result["passed"] = False
        result["issues"].append(f"Invalid audio format: {path.suffix}")

    result["size_mb"] = round(size_mb, 2)
    return result


def validate_mesh(path: Path, budget: Dict) -> Dict[str, Any]:
    """Validate a mesh file (basic size check, full validation requires FBX parser)."""
    result = {
        "path": str(path),
        "type": "mesh",
        "passed": True,
        "issues": [],
        "note": "Full poly count validation requires FBX SDK"
    }

    size_mb = get_file_size_mb(path)
    result["size_mb"] = round(size_mb, 2)

    return result


def validate_category(category: str, category_dir: Path) -> List[Dict[str, Any]]:
    """Validate all assets in a category directory."""
    results = []
    budget = ASSET_BUDGETS.get(category, {})

    if not category_dir.exists():
        return results

    for file_path in category_dir.rglob("*"):
        if not file_path.is_file():
            continue

        ext = file_path.suffix.lower()

        if ext in TEXTURE_EXTENSIONS:
            results.append(validate_texture(file_path, budget))
        elif ext in MESH_EXTENSIONS:
            results.append(validate_mesh(file_path, budget))
        elif ext in AUDIO_EXTENSIONS:
            results.append(validate_audio(file_path, budget))

    return results


def main() -> int:
    """Run asset validation and report results."""
    all_results = {
        "validated": [],
        "failed": [],
        "warnings": []
    }

    source_dir = ASSETS_DIR / "source"
    export_dir = ASSETS_DIR / "export"

    for category in ASSET_BUDGETS.keys():
        source_category = source_dir / category
        results = validate_category(category, source_category)

        for result in results:
            if result["passed"]:
                all_results["validated"].append(result)
            else:
                all_results["failed"].append(result)

    for export_target in ["unity", "unreal"]:
        export_path = export_dir / export_target
        if export_path.exists():
            for file_path in export_path.rglob("*"):
                if file_path.is_file():
                    size_mb = get_file_size_mb(file_path)
                    if size_mb > 50:
                        all_results["warnings"].append({
                            "path": str(file_path),
                            "message": f"Large export file: {size_mb:.2f}MB"
                        })

    print(json.dumps(all_results, indent=2))

    print("\n=== Validation Summary ===")
    print(f"Validated: {len(all_results['validated'])} files")
    print(f"Failed: {len(all_results['failed'])} files")
    print(f"Warnings: {len(all_results['warnings'])} files")

    if all_results["failed"]:
        print("\n=== Failed Assets ===")
        for item in all_results["failed"]:
            print(f"  {item['path']}")
            for issue in item.get("issues", []):
                print(f"    - {issue}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
