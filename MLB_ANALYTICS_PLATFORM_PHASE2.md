# MLB Analytics Platform - Phase 2

## Overview

Phase 2 builds upon the foundational MLB Analytics Platform by adding advanced visualizations, auto-generated scouting reports, player comparison tools, and team analysis features.

## New Features

### 1. Advanced Visualizations

#### Spray Charts
**Location:** `/baseball/mlb/players/[playerId]/visualizations`

**Component:** `apps/web/components/mlb/SprayChart.tsx`

**Features:**
- Visual representation of all batted balls on a baseball field
- Color-coded by outcome (Home Run, Extra Base Hit, Single, Out)
- Size indicates exit velocity
- Glow effects for hard-hit balls (100+ mph)

**API Integration:** Uses existing Statcast data from `/mlb/players/{id}/statcast`

**How It Works:**
- Renders a canvas element with a baseball field diagram
- Plots hit coordinates (hc_x, hc_y) from Statcast data
- Maps outcomes to colors:
  - Red: Home Runs
  - Orange: Extra Base Hits
  - Green: Singles
  - Gray: Outs

#### Pitch Movement Plot
**Component:** `apps/web/components/mlb/PitchMovementPlot.tsx`

**Features:**
- Scatter plot showing horizontal and vertical break for each pitch
- Color-coded by pitch type (FF, SL, CU, CH, etc.)
- Average pitch location marked with ⊕ symbol
- Quadrant labels (Arm Side/Glove Side, Rising/Sinking)

**Metrics Displayed:**
- Horizontal Break (inches)
- Induced Vertical Break (inches)
- Average velocity per pitch type
- Pitch count statistics

**How It Works:**
- Converts pitch movement data (pfx_x, pfx_z) from feet to inches
- Groups pitches by type and calculates averages
- Renders interactive plot with grid lines and axes

#### Velocity Distribution
**Component:** `apps/web/components/mlb/VelocityDistribution.tsx`

**Features:**
- Histogram showing velocity distribution for each pitch type
- Statistical summary table (min, avg, median, max)
- Color-coded by pitch type
- 1 mph bin increments

**How It Works:**
- Creates bins for velocity ranges
- Counts occurrences in each bin
- Renders bar chart with overlapping pitch types
- Calculates summary statistics

### 2. Auto-Generated Scouting Reports

#### Backend Implementation
**File:** `api/mlb/scouting.py`

**Class:** `ScoutingReportGenerator`

**Endpoint:** `GET /mlb/players/{player_id}/scouting`

**Features:**
- Automated scouting analysis using advanced metrics
- 20-80 scouting scale (industry standard)
- Separate logic for batters and pitchers
- Strengths/weaknesses identification
- Recommendations for player usage

**Grading System:**

**For Batters:**
- Overall Grade: Based on wRC+ and WAR
- Tool Grades (5 Tools):
  - **Hit**: AVG, K%
  - **Power**: HR, ISO
  - **Speed**: SB, Sprint Speed
  - **Fielding**: Position-dependent
  - **Arm**: Position-dependent

**For Pitchers:**
- Overall Grade: Based on FIP- and WAR
- Pitch Grades: Individual pitch analysis (future enhancement)

**Calculations:**
```python
# Batter overall grade
base_grade = 30 + (wRC+ / 100) * 20  # Maps 0-200 wRC+ to 30-70 grade

# Adjust for WAR
if WAR > 5: base_grade += 5
elif WAR > 3: base_grade += 3
elif WAR < 0: base_grade -= 5

# Cap at 80, floor at 20
overall_grade = max(20, min(80, base_grade))
```

**Strengths/Weaknesses Logic:**
- Identifies elite performance (e.g., ISO > 0.200 = "Elite power hitter")
- Flags concerns (e.g., K% > 28 = "High strikeout rate")
- Checks splits for platoon issues
- Generates context-aware descriptions

**Frontend Implementation:**
**Page:** `/baseball/mlb/players/[playerId]/scouting`

**Features:**
- Visual display of 20-80 grades with color coding
- Executive summary
- Strengths (green checkmarks)
- Weaknesses (red X marks)
- Usage recommendations
- Scouting scale reference guide

**Grade Colors:**
- 80: Best in MLB (Red)
- 70: Elite/All-Star (Red)
- 60: Plus (Orange)
- 50: Average (Yellow)
- 40: Below Average (Blue)
- 20-30: Poor (Gray)

### 3. Player Comparison Tool

**Page:** `/baseball/mlb/compare`

**Features:**
- Side-by-side player comparison
- Enter two player IDs to compare
- Season selector
- Automatic detection of position (batter vs. pitcher)
- Color-coded winners (green checkmarks)
- Stats compared:
  - **Batting:** AVG, OBP, SLG, OPS, HR, RBI, SB, wOBA, wRC+, WAR
  - **Pitching:** W, L, ERA, IP, SO, WHIP, FIP, K%, BB%, WAR

**How It Works:**
1. User enters two player IDs
2. System fetches both player profiles in parallel
3. Determines if both are batters or pitchers
4. Displays appropriate stats comparison
5. Highlights better stat in each category

**Value Comparison Logic:**
```typescript
// Higher is better for most stats
if (stat1 > stat2) return 1;  // Player 1 wins

// Lower is better for ERA, WHIP, FIP, BB%
const lowerIsBetter = ['ERA', 'WHIP', 'FIP', 'BB%'];
if (lowerIsBetter.includes(stat)) {
  if (stat1 < stat2) return 1;  // Player 1 wins
}
```

### 4. Team Analysis Pages

**Page:** `/baseball/mlb/teams/[teamId]`

**Features:**
- Complete team roster display
- Grouped by position (Pitchers, Catchers, Infielders, Outfielders, DH)
- Player status indicators (Active, IL, etc.)
- Quick stats summary
- Links to individual player profiles

**API Integration:** `GET /mlb/teams/{team_id}/roster`

**Position Grouping:**
```typescript
- Pitchers: position.type === 'Pitcher'
- Catchers: position.abbreviation === 'C'
- Infielders: ['1B', '2B', '3B', 'SS']
- Outfielders: ['LF', 'CF', 'RF', 'OF']
- Designated Hitters: 'DH'
```

**Future Enhancements:**
- Depth charts
- Team statistics
- Schedule integration
- Roster moves history

## File Structure

```
apps/web/
├── components/mlb/
│   ├── SprayChart.tsx              # Spray chart visualization
│   ├── PitchMovementPlot.tsx       # Pitch movement plot
│   └── VelocityDistribution.tsx    # Velocity histogram
└── app/baseball/mlb/
    ├── compare/
    │   └── page.tsx                # Player comparison tool
    ├── teams/
    │   └── [teamId]/
    │       └── page.tsx            # Team roster page
    └── players/[playerId]/
        ├── visualizations/
        │   └── page.tsx            # Advanced visualizations page
        └── scouting/
            └── page.tsx            # Scouting report page

api/mlb/
└── scouting.py                     # Scouting report generator
```

## Usage Examples

### Viewing Spray Charts

1. Navigate to a batter's profile
2. Click "📈 Visualizations"
3. Select date range
4. View spray chart with color-coded hits
5. Larger dots = higher exit velocity
6. Glowing dots = 100+ mph exits

### Generating Scouting Reports

1. Navigate to any player profile
2. Click "📋 Scouting Report"
3. Select season (optional)
4. View auto-generated report with:
   - Overall grade (20-80 scale)
   - Tool grades (batters) or pitch grades (pitchers)
   - Strengths and weaknesses
   - Usage recommendations

### Comparing Players

1. Go to `/baseball/mlb/compare`
2. Enter first player ID (e.g., 545361 for Mike Trout)
3. Enter second player ID
4. Select season
5. Click "Compare Players"
6. View side-by-side stats with winners highlighted

### Viewing Team Rosters

1. Navigate to `/baseball/mlb/teams/[teamId]`
2. View complete roster by position
3. See player numbers and status
4. Click any player to view their profile

## Technical Implementation

### Canvas Rendering

All visualizations use HTML5 Canvas for performance:

```typescript
// Spray Chart Example
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Draw field
drawBaseballField(ctx, width, height);

// Plot hits
hits.forEach(hit => {
  const x = centerX + hit.hit_x * scale;
  const y = centerY - hit.hit_y * scale;

  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = getOutcomeColor(hit.outcome);
  ctx.fill();
});
```

### Scouting Grade Calculation

```python
def _calculate_overall_grade_batter(self, player):
    """Calculate 20-80 grade for batter."""
    wrc_plus = stats.get('wRC+', 100)
    base_grade = 30 + (wrc_plus / 100) * 20

    # Adjust for WAR
    war = stats.get('WAR', 0)
    if war > 5:
        base_grade += 5

    return max(20, min(80, base_grade))
```

### Data Transformation

Statcast data requires transformation for visualizations:

```typescript
// Prepare spray chart data
const sprayChartData = statcastData.metrics
  .filter(m => m.hc_x && m.hc_y)
  .map(m => ({
    hit_x: m.hc_x,
    hit_y: m.hc_y,
    exit_velocity: m.launch_speed,
    outcome: m.events
  }));

// Prepare pitch movement data
const pitchData = statcastData.metrics
  .filter(m => m.pfx_x !== undefined)
  .map(m => ({
    pitch_type: m.pitch_type,
    horizontal_break: m.pfx_x * 12,  // Convert to inches
    induced_vertical_break: m.pfx_z * 12,
    velocity: m.release_speed
  }));
```

## Performance Considerations

### Canvas Optimization
- Use `requestAnimationFrame` for smooth rendering
- Cache field diagrams
- Batch draw operations
- Clear only necessary regions

### Data Loading
- Lazy load visualization components
- Cache Statcast data (24 hour TTL)
- Progressive rendering for large datasets
- Implement virtual scrolling for tables

### API Efficiency
- Parallel data fetching where possible
- Implement request debouncing
- Use appropriate cache TTLs
- Batch similar requests

## Future Enhancements

### Phase 3 Planned Features

1. **Interactive Spray Charts**
   - Click hits for detailed info
   - Filter by outcome, exit velo, etc.
   - Heat map overlays
   - Animation over time

2. **Pitch Arsenal Analysis**
   - Pitch usage trends
   - Effectiveness ratings
   - Tunnel visualization
   - Release point consistency

3. **Player Development Tracking**
   - Performance trends over time
   - Skill progression charts
   - Breakout/decline detection
   - Projection systems

4. **Advanced Team Analytics**
   - Roster construction analysis
   - Platoon advantage calculator
   - Bullpen usage optimization
   - Lineup optimizer

5. **Mobile Optimization**
   - Touch-friendly controls
   - Responsive canvas scaling
   - Offline data caching
   - Native app integration

## Testing

### Manual Testing Checklist

**Spray Charts:**
- [ ] Loads for batters with data
- [ ] Colors match outcomes
- [ ] Size correlates with exit velocity
- [ ] Field diagram is accurate
- [ ] Legend displays correctly

**Pitch Movement:**
- [ ] Plots all pitch types
- [ ] Average markers are correct
- [ ] Axes are properly labeled
- [ ] Statistics table matches plot

**Scouting Reports:**
- [ ] Grades calculate correctly
- [ ] Strengths/weaknesses are relevant
- [ ] Recommendations are appropriate
- [ ] Works for both batters and pitchers

**Player Comparison:**
- [ ] Loads two players successfully
- [ ] Highlights winners correctly
- [ ] Handles missing data gracefully
- [ ] Season selector works

**Team Rosters:**
- [ ] Groups players by position
- [ ] Status indicators work
- [ ] Links to player profiles
- [ ] Quick stats are accurate

## Deployment

Phase 2 features are integrated with existing deployment:

```bash
# Install dependencies (if needed)
pip install -r requirements.txt

# Start API
cd api
uvicorn main:app --reload --port 8000

# Start frontend
cd apps/web
pnpm install
pnpm dev
```

No additional configuration required. All Phase 2 features use existing API infrastructure.

## Troubleshooting

### Visualization Not Displaying

**Issue:** Canvas stays blank
**Solution:** Check that Statcast data has required fields (hc_x, hc_y for spray chart, pfx_x, pfx_z for pitch movement)

### Scouting Report Shows Errors

**Issue:** "Insufficient data" message
**Solution:** Verify player has stats for selected season. Some players (prospects, recent call-ups) may have limited data.

### Player Comparison Not Working

**Issue:** One or both players don't load
**Solution:** Verify player IDs are correct. Use player search to find valid IDs.

### Team Roster Empty

**Issue:** No players displayed
**Solution:** Check team ID is valid. Some teams may have limited roster data in certain seasons.

## Credits

**Phase 2 Development:**
- Spray Chart visualization inspired by Baseball Savant
- Pitch movement plot based on Brooks Baseball
- Scouting grades follow MLB scouting conventions
- Canvas rendering optimized for performance

**Data Sources:**
- MLB Statcast for hit/pitch tracking data
- FanGraphs for advanced metrics
- MLB Stats API for roster information

## Version History

### v2.0.0 (Phase 2)
- ✅ Spray chart visualization
- ✅ Pitch movement plots
- ✅ Velocity distribution histograms
- ✅ Auto-generated scouting reports
- ✅ Player comparison tool
- ✅ Team roster pages
- ✅ Enhanced player profile navigation

### v1.0.0 (Phase 1)
- Player profiles
- Statcast data access
- Leaderboards
- Real-time dashboard
- Player search

## Support

For Phase 2 issues:
1. Check this documentation
2. Verify API is running and accessible
3. Check browser console for errors
4. Ensure Statcast data is available for selected date range

## Next Steps

Continue to [Phase 3 Development](./MLB_ANALYTICS_PLATFORM_PHASE3.md) for:
- Interactive visualizations
- Mobile optimization
- Advanced team analytics
- Player projections
