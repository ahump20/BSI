#!/bin/bash
# Update all Garrido episode pages with enhanced graphics engine
# Usage: ./update-all-episodes.sh

set -euo pipefail

EPISODE_FILES=(
    "respect.html"
    "teach.html"
    "failure.html"
    "poetry.html"
    "team.html"
    "architecture.html"
    "flow.html"
    "memory.html"
    "legacy.html"
)

for FILE in "${EPISODE_FILES[@]}"; do
    echo "Updating $FILE..."

    # Check if file exists
    if [ ! -f "$FILE" ]; then
        echo "  ⚠️  File not found: $FILE"
        continue
    fi

    # Create backup
    cp "$FILE" "${FILE}.backup"

    # Add enhanced graphics engine script after Three.js line
    if ! grep -q "enhanced-graphics-engine.js" "$FILE"; then
        sed -i '' '/<script src="https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/three.js\/r128\/three.min.js"><\/script>/a\
\
    <!-- Enhanced Graphics Engine -->\
    <script src="/garrido/enhanced-graphics-engine.js" defer></script>
' "$FILE"
        echo "  ✅ Added enhanced graphics engine"
    else
        echo "  ℹ️  Already has enhanced graphics engine"
    fi

    # Replace old particle system script with simplified version
    if grep -q "function initParticleSystem()" "$FILE"; then
        # Find and replace the entire old particle system block
        perl -i -0pe 's/<script>\s*function initParticleSystem\(\).*?<\/script>/<script>\n        \/\/ Enhanced particle system is loaded via enhanced-graphics-engine.js\n        document.addEventListener('\''DOMContentLoaded'\'', () => {\n            \/\/ Smooth scroll for internal links\n            document.querySelectorAll('\''a[href^="#"]'\'').forEach(anchor => {\n                anchor.addEventListener('\''click'\'', function (e) {\n                    e.preventDefault();\n                    const target = document.querySelector(this.getAttribute('\''href'\''));\n                    if (target) {\n                        target.scrollIntoView({ behavior: '\''smooth'\'', block: '\''start'\'' });\n                    }\n                });\n            });\n        });\n    <\/script>/s' "$FILE"
        echo "  ✅ Updated particle system script"
    else
        echo "  ℹ️  Particle system already updated"
    fi

    echo "  ✓ Done with $FILE"
    echo ""
done

echo "🎉 All episode files updated!"
echo ""
echo "To enable debug mode (FPS counter), add ?debug to URL:"
echo "  https://5a92c5fc.blazesportsintel.pages.dev/garrido/chaos?debug"
