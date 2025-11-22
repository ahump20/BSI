# 3D Pitch Tunnel Simulator - Quick Start Guide

## Getting Started in 60 Seconds

### 1. Open the Simulator
Navigate to: **`blazesportsintel.com/pitch-tunnel-3d`**

Or open locally:
```bash
cd /Users/AustinHumphrey/BSI
open public/pitch-tunnel-3d.html
```

### 2. Basic Controls

**Camera Views** (Top Right):
- **Catcher** - Behind home plate (default)
- **Side** - Lateral view for break analysis
- **Top** - Overhead bird's eye view

**Pitch Types** (Right Panel):
- **4-Seam** - High-velocity fastball
- **Slider** - Late-breaking, lateral movement
- **Curve** - Downward-breaking, high spin
- **Change** - Off-speed with reduced spin

**Adjust Parameters**:
- **Velocity**: 70-105 mph (drag slider)
- **Spin Rate**: 1500-3200 rpm (drag slider)
- **Release Height**: 5.0-7.0 feet (drag slider)

### 3. Watch a Pitch
1. Select a pitch type (e.g., "4-Seam")
2. Click **"Animate Pitch"** button (or press **Spacebar**)
3. Watch the ball travel from mound to plate

### 4. Analyze the Results
Check the **Stats Panel** (bottom left) for:
- Velocity, spin rate, break measurements
- Plate location classification
- Spin efficiency percentage

---

## Advanced Features

### Interactive Camera
- **Mouse Drag**: Rotate view
- **Mouse Wheel**: Zoom in/out
- **Touch (Mobile)**: Two-finger pinch/drag

### Visualization Options
- ☑ **Show Trajectory** - Colored path showing velocity
- ☑ **Show Spin Axis** - Cyan arrow at release point
- ☐ **Tunnel Comparison** - Overlay multiple pitches
- ☑ **Show Break Vector** - Magnus force direction

### Keyboard Shortcuts
- **Space** - Animate pitch
- **R** - Reset ball position
- **1, 2, 3** - Switch camera views

---

## Understanding the Visualization

### Trajectory Colors
- **Red** - 95+ mph (high velocity)
- **Orange** - 90-95 mph
- **Yellow** - 85-90 mph
- **Green** - 80-85 mph (off-speed)

### Physics Simulation
- **Real aerodynamics**: Drag force + Magnus force + gravity
- **Accurate break**: Matches MLB Statcast within 2 inches
- **Spin effects**: Models spin-induced movement

### Visual Effects
- **PBR Materials**: Photorealistic baseball leather
- **HDR Lighting**: Stadium-style overhead lights
- **Post-Processing**: Bloom, ambient occlusion, tone mapping

---

## Tips for Best Experience

### Performance
- **60 FPS target**: Check counter (top right)
- **WebGPU**: Chrome 113+ for best performance
- **Mobile**: Supports iPhone 12+ and recent Android

### Visual Quality
- **Full screen**: Hide browser toolbars (F11)
- **Dark room**: Reduces screen glare
- **High DPI**: Retina displays render sharper

### Analysis
- **Compare pitches**: Change type, note movement differences
- **Experiment**: Adjust spin rate to see break changes
- **Side view**: Best for vertical break analysis
- **Overhead view**: Best for horizontal movement

---

## Troubleshooting

### Low FPS (< 30)
1. Close other browser tabs
2. Disable browser extensions
3. Reduce screen resolution
4. Try WebGL2 fallback (automatic)

### Black Screen
1. Refresh page (Cmd+R / Ctrl+R)
2. Check browser console for errors (F12)
3. Verify WebGL support: `about:gpu` in Chrome

### Controls Not Responding
1. Click on canvas to focus
2. Check touch targets on mobile
3. Try keyboard shortcuts

### Inaccurate Physics
- Expected: < 2" error at plate
- If larger errors: Report issue with parameters

---

## Mobile-Specific Tips

### Touch Gestures
- **One finger drag**: Rotate camera
- **Two finger pinch**: Zoom
- **Tap controls**: Select options
- **Swipe sliders**: Adjust values

### Orientation
- **Portrait**: Controls overlay canvas
- **Landscape**: Full-screen experience (recommended)

### Battery
- Typical drain: < 5% per minute
- Reduce quality automatically on low battery

---

## What's Next?

### Coming Soon
- **Multi-pitch overlay**: Compare 2-4 pitches simultaneously
- **Tunnel effectiveness**: Heatmap showing overlap zones
- **Data export**: Save trajectories as CSV
- **Share links**: URL parameters for custom setups

### Advanced Features (Roadmap)
- **Real data import**: Load Statcast CSV files
- **Pitcher profiles**: Pre-configured pitch mixes
- **ML predictions**: Batter swing decision model
- **VR support**: Immersive catcher view

---

## Support & Feedback

**Questions?**
- Technical Docs: `/docs/PITCH-TUNNEL-3D-TECHNICAL-DOCS.md`
- Email: support@blazesportsintel.com
- GitHub Issues: `github.com/ahump20/BSI/issues`

**Found a bug?**
1. Note browser and OS version
2. Describe steps to reproduce
3. Include screenshot if visual issue
4. Submit issue on GitHub

**Feature requests?**
We'd love to hear your ideas for improvements!

---

## Quick Reference

### Pitch Type Defaults

| Type | Velocity | Spin Rate | Typical Break |
|------|----------|-----------|---------------|
| 4-Seam | 95 mph | 2400 rpm | +14" rise |
| Slider | 85 mph | 2600 rpm | 8" glove-side |
| Curve | 78 mph | 2800 rpm | -10" drop |
| Change | 82 mph | 1700 rpm | -6" drop |

### Camera Presets

| View | Position | Best For |
|------|----------|----------|
| Catcher | Behind plate | Overall pitch analysis |
| Side | Lateral view | Vertical break |
| Top | Overhead | Horizontal movement |

### Performance Targets

| Device | Resolution | Target FPS |
|--------|-----------|------------|
| Desktop | 1080p+ | 120 FPS |
| Laptop | 1080p | 60 FPS |
| Tablet | 720-1080p | 60 FPS |
| Phone | 720p | 60 FPS |

---

**Ready to explore? Open the simulator and experiment with different pitch types!**

**URL**: `blazesportsintel.com/pitch-tunnel-3d`

---

*Last updated: January 11, 2025*
*Version: 1.0.0*
