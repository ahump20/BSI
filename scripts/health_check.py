#!/usr/bin/env python3
"""
BSI Health Check Script
Verifies that all components are working correctly
"""

import sys
import time
import subprocess
import urllib.request
import json
from pathlib import Path


def check_service(name, url, timeout=10):
    """Check if a service is responding."""
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            if response.status == 200:
                print(f"✓ {name} is healthy at {url}")
                return True
            else:
                print(f"✗ {name} returned status {response.status}")
                return False
    except Exception as e:
        print(f"✗ {name} is not responding: {e}")
        return False


def check_docker_service(service_name):
    """Check if a Docker service is running."""
    try:
        result = subprocess.run(
            ["docker-compose", "ps", service_name],
            capture_output=True,
            text=True,
            check=True
        )
        if "Up" in result.stdout:
            print(f"✓ Docker service {service_name} is running")
            return True
        else:
            print(f"✗ Docker service {service_name} is not running")
            return False
    except subprocess.CalledProcessError:
        print(f"✗ Could not check Docker service {service_name}")
        return False


def check_python_imports():
    """Check critical Python imports."""
    imports = [
        "numpy",
        "pandas",
        "fastapi",
        "redis",
        "sqlalchemy",
        "opencv-python-headless",
        "mediapipe"
    ]

    failed = []
    for package in imports:
        try:
            __import__(package.replace("-", "_"))
            print(f"✓ Python package {package} available")
        except ImportError:
            print(f"✗ Python package {package} not available")
            failed.append(package)

    return len(failed) == 0


def check_files():
    """Check that required files exist."""
    required_files = [
        "main.py",
        "pose.py",
        "requirements.txt",
        "package.json",
        "wrangler.toml",
        "docker-compose.yml",
        "Makefile",
        ".env.example"
    ]

    missing = []
    for file in required_files:
        if Path(file).exists():
            print(f"✓ {file} exists")
        else:
            print(f"✗ {file} missing")
            missing.append(file)

    return len(missing) == 0


def main():
    """Run all health checks."""
    print("BSI Health Check")
    print("=" * 50)

    all_healthy = True

    # Check files
    print("\n📁 Checking files...")
    if not check_files():
        all_healthy = False

    # Check Python imports
    print("\n🐍 Checking Python packages...")
    if not check_python_imports():
        all_healthy = False

    # Check Docker services (if running)
    print("\n🐳 Checking Docker services...")
    docker_services = ["postgres", "redis", "minio"]
    for service in docker_services:
        if not check_docker_service(service):
            all_healthy = False

    # Check web services
    print("\n🌐 Checking web services...")
    services = {
        "Python HTTP Server": "http://localhost:8000",
        "Wrangler Dev Server": "http://localhost:8787",
        "Grafana": "http://localhost:3001",
        "MinIO Console": "http://localhost:9001"
    }

    for name, url in services.items():
        if not check_service(name, url, timeout=5):
            all_healthy = False

    # Final status
    print("\n" + "=" * 50)
    if all_healthy:
        print("🎉 All systems healthy!")
        return 0
    else:
        print("⚠️  Some issues detected. Check the output above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())