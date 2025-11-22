#!/usr/bin/env bash

###############################################################################
# BLAZE SPORTS INTEL - 3D PITCH TUNNEL VALIDATION SCRIPT
# Validates deployment readiness and quality metrics
###############################################################################

set -euo pipefail

echo "=================================================="
echo "3D PITCH TUNNEL SIMULATOR - VALIDATION REPORT"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0
WARNINGS=0

# Function to check file exists
check_file() {
    local file=$1
    local name=$2
    if [[ -f "$file" ]]; then
        local size=$(du -h "$file" | cut -f1)
        echo -e "${GREEN}✓${NC} $name ($size)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $name - FILE MISSING"
        ((FAILED++))
        return 1
    fi
}

# Function to check file size
check_size() {
    local file=$1
    local max_kb=$2
    local name=$3
    if [[ -f "$file" ]]; then
        local size_kb=$(du -k "$file" | cut -f1)
        if [[ $size_kb -le $max_kb ]]; then
            echo -e "${GREEN}✓${NC} $name size OK (${size_kb}KB / ${max_kb}KB max)"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠${NC} $name size large (${size_kb}KB / ${max_kb}KB max)"
            ((WARNINGS++))
        fi
    fi
}

# Function to check file content
check_content() {
    local file=$1
    local pattern=$2
    local name=$3
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name contains required code"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $name missing: $pattern"
        ((FAILED++))
    fi
}

echo "1. FILE EXISTENCE CHECKS"
echo "------------------------"
check_file "public/pitch-tunnel-3d.html" "Main HTML"
check_file "public/pitch-tunnel-engine.js" "Core Engine"
check_file "lib/shaders/pitch-tunnel-shaders.glsl" "Custom Shaders"
check_file "docs/PITCH-TUNNEL-3D-TECHNICAL-DOCS.md" "Technical Docs"
check_file "PITCH-TUNNEL-3D-DEPLOYMENT-COMPLETE.md" "Deployment Summary"
echo ""

echo "2. FILE SIZE CHECKS"
echo "-------------------"
check_size "public/pitch-tunnel-3d.html" 20 "HTML file"
check_size "public/pitch-tunnel-engine.js" 50 "Engine file"
check_size "lib/shaders/pitch-tunnel-shaders.glsl" 20 "Shader file"
echo ""

echo "3. REQUIRED FEATURES - HTML"
echo "---------------------------"
check_content "public/pitch-tunnel-3d.html" "renderCanvas" "Canvas element"
check_content "public/pitch-tunnel-3d.html" "controls-panel" "Control panel"
check_content "public/pitch-tunnel-3d.html" "stats-panel" "Stats panel"
check_content "public/pitch-tunnel-3d.html" "babylon.js" "Babylon.js CDN"
check_content "public/pitch-tunnel-3d.html" "pitch-tunnel-engine.js" "Engine import"
echo ""

echo "4. REQUIRED FEATURES - ENGINE"
echo "-----------------------------"
check_content "public/pitch-tunnel-engine.js" "class PitchTunnelSimulator" "Main class"
check_content "public/pitch-tunnel-engine.js" "WebGPUEngine" "WebGPU support"
check_content "public/pitch-tunnel-engine.js" "PBRMaterial" "PBR materials"
check_content "public/pitch-tunnel-engine.js" "calculatePitchTrajectory" "Physics simulation"
check_content "public/pitch-tunnel-engine.js" "DefaultRenderingPipeline" "Post-processing"
check_content "public/pitch-tunnel-engine.js" "SSAO2RenderingPipeline" "SSAO"
check_content "public/pitch-tunnel-engine.js" "CreateSphere" "Baseball mesh"
check_content "public/pitch-tunnel-engine.js" "CreateTube" "Trajectory tube"
check_content "public/pitch-tunnel-engine.js" "switchCamera" "Camera system"
check_content "public/pitch-tunnel-engine.js" "animatePitch" "Animation"
echo ""

echo "5. SHADER QUALITY CHECKS"
echo "------------------------"
check_content "lib/shaders/pitch-tunnel-shaders.glsl" "TRAJECTORY_VERTEX_SHADER" "Trajectory shader"
check_content "lib/shaders/pitch-tunnel-shaders.glsl" "SPIN_PARTICLE_VERTEX_SHADER" "Particle system"
check_content "lib/shaders/pitch-tunnel-shaders.glsl" "TUNNEL_HEATMAP_FRAGMENT_SHADER" "Heatmap shader"
check_content "lib/shaders/pitch-tunnel-shaders.glsl" "BASEBALL_DETAIL_FRAGMENT_SHADER" "Baseball shader"
check_content "lib/shaders/pitch-tunnel-shaders.glsl" "snoise" "Noise function"
echo ""

echo "6. DOCUMENTATION CHECKS"
echo "-----------------------"
check_content "docs/PITCH-TUNNEL-3D-TECHNICAL-DOCS.md" "Architecture" "Architecture section"
check_content "docs/PITCH-TUNNEL-3D-TECHNICAL-DOCS.md" "Physics Equations" "Physics appendix"
check_content "docs/PITCH-TUNNEL-3D-TECHNICAL-DOCS.md" "Performance Benchmarks" "Benchmarks"
check_content "PITCH-TUNNEL-3D-DEPLOYMENT-COMPLETE.md" "Production Ready" "Deployment status"
echo ""

echo "7. PHYSICS VALIDATION"
echo "---------------------"
# Check critical physics constants
if grep -q "const g = 32.2" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} Gravity constant correct (32.2 ft/s²)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Gravity constant missing or incorrect"
    ((FAILED++))
fi

if grep -q "const rho = 0.0740" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} Air density correct (0.0740 lb/ft³)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Air density missing or incorrect"
    ((FAILED++))
fi

if grep -q "const Cd = 0.3" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} Drag coefficient correct (0.3)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Drag coefficient missing or incorrect"
    ((FAILED++))
fi
echo ""

echo "8. VISUAL QUALITY CHECKS"
echo "------------------------"
# Check for PBR material properties
if grep -q "metallic" public/pitch-tunnel-engine.js && grep -q "roughness" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} PBR material workflow present"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} PBR material properties missing"
    ((FAILED++))
fi

# Check for post-processing
if grep -q "bloomEnabled" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} Bloom effect configured"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Bloom effect missing"
    ((FAILED++))
fi

if grep -q "ssaoRatio" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} SSAO effect configured"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} SSAO effect missing"
    ((FAILED++))
fi

if grep -q "TONEMAPPING_ACES" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} ACES tone mapping enabled"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} ACES tone mapping missing"
    ((FAILED++))
fi
echo ""

echo "9. RESPONSIVE DESIGN CHECKS"
echo "---------------------------"
if grep -q "@media (max-width: 768px)" public/pitch-tunnel-3d.html; then
    echo -e "${GREEN}✓${NC} Mobile responsive CSS present"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Mobile responsive CSS missing"
    ((FAILED++))
fi

if grep -q "touch-action: none" public/pitch-tunnel-3d.html; then
    echo -e "${GREEN}✓${NC} Touch optimization enabled"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Touch optimization missing"
    ((FAILED++))
fi
echo ""

echo "10. PERFORMANCE OPTIMIZATION CHECKS"
echo "-----------------------------------"
if grep -q "segments: 64" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} High-quality baseball mesh (64 segments)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Baseball mesh may be low quality"
    ((WARNINGS++))
fi

if grep -q "samples = 4" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} MSAA anti-aliasing enabled"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Anti-aliasing may be disabled"
    ((WARNINGS++))
fi

if grep -q "updateFPS" public/pitch-tunnel-engine.js; then
    echo -e "${GREEN}✓${NC} FPS monitoring implemented"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} FPS monitoring missing"
    ((FAILED++))
fi
echo ""

# Summary
echo "=================================================="
echo "VALIDATION SUMMARY"
echo "=================================================="
echo ""
echo -e "${GREEN}Passed:${NC}   $PASSED checks"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS issues"
echo -e "${RED}Failed:${NC}   $FAILED checks"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENT=$((PASSED * 100 / TOTAL))

echo -e "Success Rate: ${BLUE}${PERCENT}%${NC}"
echo ""

# Overall status
if [[ $FAILED -eq 0 ]]; then
    if [[ $WARNINGS -eq 0 ]]; then
        echo -e "${GREEN}✓ DEPLOYMENT READY - ALL CHECKS PASSED${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Open public/pitch-tunnel-3d.html in a web browser"
        echo "2. Test camera controls and pitch animations"
        echo "3. Verify FPS counter shows 60+ FPS"
        echo "4. Check mobile responsiveness on device"
        echo "5. Deploy to production: blazesportsintel.com/pitch-tunnel-3d"
        exit 0
    else
        echo -e "${YELLOW}⚠ DEPLOYMENT READY WITH WARNINGS${NC}"
        echo ""
        echo "All critical checks passed, but review warnings above."
        exit 0
    fi
else
    echo -e "${RED}✗ DEPLOYMENT BLOCKED - FAILURES DETECTED${NC}"
    echo ""
    echo "Fix failed checks before deploying to production."
    exit 1
fi
