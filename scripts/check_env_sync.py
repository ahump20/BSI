#!/usr/bin/env python3
"""
Check that .env and .env.example are in sync.
Ensures no new environment variables are added without documentation.
"""

import sys
from pathlib import Path


def load_env_keys(filepath):
    """Load environment variable keys from a file."""
    keys = set()
    if not filepath.exists():
        return keys

    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip comments and empty lines
            if line and not line.startswith('#'):
                # Extract key from KEY=value format
                if '=' in line:
                    key = line.split('=')[0].strip()
                    keys.add(key)
    return keys


def main():
    """Check environment variable synchronization."""
    root = Path(__file__).parent.parent
    env_file = root / '.env'
    env_example = root / '.env.example'

    if not env_file.exists():
        print("✓ No .env file found (using .env.example as template)")
        return 0

    if not env_example.exists():
        print("✗ .env.example not found! Please create it.")
        return 1

    env_keys = load_env_keys(env_file)
    example_keys = load_env_keys(env_example)

    # Check for keys in .env but not in .env.example
    missing_in_example = env_keys - example_keys
    if missing_in_example:
        print("✗ The following keys are in .env but not in .env.example:")
        for key in sorted(missing_in_example):
            print(f"  - {key}")
        print("\nPlease add these to .env.example with appropriate defaults.")
        return 1

    # Check for keys in .env.example but not in .env (informational)
    missing_in_env = example_keys - env_keys
    if missing_in_env:
        print("ℹ The following keys are in .env.example but not in .env:")
        for key in sorted(missing_in_env):
            print(f"  - {key}")
        print("\nConsider adding these to your .env file if needed.")

    print("✓ Environment files are in sync")
    return 0


if __name__ == "__main__":
    sys.exit(main())