# Copilot Design & Implementation Context

**Generated**: 2025-10-10
**Sources**: copilot.html, COPILOT-V2-DEPLOYMENT-SUMMARY.md, COPILOT-DATA-INGESTION.md

---

## 🎨 Design Philosophy

### Core Concept
**"AI-Powered Semantic Search for Sports Intelligence"**

The Copilot is a conversational search interface that allows coaches, scouts, and analysts to ask natural language questions about sports data and receive AI-generated insights backed by real game statistics.

### Design Principles
1. **Glassmorphism First**: Subtle transparency with backdrop blur to showcase 3D background
2. **Data-Driven**: No fake numbers - every stat must have a source
3. **Performance**: 60 FPS animations, sub-2s response times
4. **Accessibility**: WCAG AA compliance, keyboard navigation, reduced-motion support
5. **Coach-Centric**: Tactical insights over fan statistics

---

## 🎨 Visual Design System

### Color Palette (Blaze Intelligence Standard)
```css
--blaze-orange: #ff6b00;     /* Primary brand color */
--blaze-dark: #1a1a1a;        /* Deep charcoal background */
--blaze-charcoal: #2a2a2a;    /* Container backgrounds */
--blaze-gray: #3a3a3a;        /* Borders and dividers */
--blaze-blue: #0066cc;        /* Interactive elements */
--blaze-green: #28a745;       /* Success/validation */
--glass-bg: rgba(42, 42, 42, 0.7);        /* Glassmorphic containers */
--glass-border: rgba(255, 107, 0, 0.3);   /* Orange accent borders */
```

### Typography
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Headings */
h1: 2.5rem, 700 weight, Blaze orange
Subtitle: 1.1rem, 300 weight, #aaa

/* Body Text */
Body: 0.95-1rem, #ddd
Meta: 0.85rem, #999
```

### Glassmorphism Specifications
```css
.glass-container {
  background: rgba(42, 42, 42, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 107, 0, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

**Mobile Optimization**: Reduce blur to 8-10px on mobile devices for performance.

---

## 🎬 Animation & Motion Design

### Keyframe Animations
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(255, 107, 0, 0.4); }
  50% { box-shadow: 0 2px 16px rgba(255, 107, 0, 0.8); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
```

### Staggered Card Animations
Game cards animate in sequence with 0.05s delays:
```css
.game-card:nth-child(1) { animation-delay: 0.1s; }
.game-card:nth-child(2) { animation-delay: 0.15s; }
.game-card:nth-child(3) { animation-delay: 0.2s; }
/* ... up to 10 cards */
```

### Transition Timing
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Effects
- **Cards**: `translateY(-8px) scale(1.02)` on hover
- **Buttons**: `translateY(-3px) scale(1.02)` on hover
- **Border Glow**: Animate from `rgba(255, 107, 0, 0.3)` to `rgba(255, 107, 0, 1)`

---

## 🎮 3D Background (Babylon.js)

### Technical Implementation
```javascript
// Engine: WebGPU with WebGL2 fallback
const engine = new BABYLON.WebGPUEngine(canvas);
await engine.initAsync();
// Falls back to: new BABYLON.Engine(canvas, true)

// Scene Setup
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent

// Camera
const camera = new BABYLON.ArcRotateCamera('camera', 0, Math.PI/3, 50, Vector3.Zero(), scene);
camera.lowerRadiusLimit = 30;
camera.upperRadiusLimit = 100;

// Lighting
const ambientLight = new BABYLON.HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
ambientLight.intensity = 0.5;

const pointLight = new BABYLON.PointLight('point', new Vector3(0, 10, 0), scene);
pointLight.intensity = 0.8;
pointLight.diffuse = new Color3(1, 0.42, 0); // Blaze orange
```

### Particle System (1500 Particles)
```javascript
const particleSystem = new BABYLON.ParticleSystem('particles', 1500, scene);

// Texture
particleSystem.particleTexture = new BABYLON.Texture(
  'https://assets.babylonjs.com/textures/flare.png',
  scene
);

// Colors (Blaze orange gradient)
particleSystem.color1 = new Color4(1, 0.42, 0, 0.8);   // #ff6b00
particleSystem.color2 = new Color4(1, 0.52, 0.2, 0.6); // Lighter orange
particleSystem.colorDead = new Color4(1, 0.3, 0, 0);   // Fade to dark

// Size & Lifetime
particleSystem.minSize = 0.2;
particleSystem.maxSize = 1.0;
particleSystem.minLifeTime = 3;
particleSystem.maxLifeTime = 8;

// Emission
particleSystem.emitRate = 150;
particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; // Glow effect

// Velocity & Physics
particleSystem.direction1 = new Vector3(-2, -1, -2);
particleSystem.direction2 = new Vector3(2, 1, 2);
particleSystem.gravity = new Vector3(0, -0.5, 0);
```

### Mouse Interaction
```javascript
// Particles follow cursor with smooth interpolation
let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;

window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

scene.registerBeforeRender(() => {
  // Smooth interpolation (5% lerp)
  targetX += (mouseX * 15 - targetX) * 0.05;
  targetY += (mouseY * 10 - targetY) * 0.05;

  // Update emitter position
  particleSystem.minEmitBox = new Vector3(targetX - 30, targetY - 20, -30);
  particleSystem.maxEmitBox = new Vector3(targetX + 30, targetY + 20, 30);

  // Slow camera rotation
  camera.alpha += 0.0005;
});
```

---

## 🏗️ Frontend Architecture

### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Babylon.js CDN -->
  <script src="https://cdn.babylonjs.com/babylon.js"></script>
  <!-- Glassmorphism CSS -->
  <style>/* ... */</style>
</head>
<body>
  <!-- 3D Background -->
  <canvas id="babylon-canvas"></canvas>

  <!-- Top Navigation -->
  <nav class="top-nav">
    <div class="nav-container">
      <a href="https://blazesportsintel.com" class="nav-brand">
        🔥 BLAZE SPORTS INTEL
      </a>
      <div class="nav-links">
        <a href="/analytics.html">Analytics</a>
        <a href="/copilot.html" class="nav-current">Copilot</a>
        <a href="https://blazesportsintel.com" class="primary">Main Site</a>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <div class="glass-container">
    <header>
      <h1>🔥 Scouting Intel Copilot <span class="beta-badge">Production Beta</span></h1>
      <p class="subtitle">AI-Powered Semantic Search for Sports Intelligence</p>
    </header>

    <!-- Search Interface -->
    <div class="search-section">
      <div class="search-container">
        <input type="text" id="searchInput" placeholder="Ask about games, teams, players...">
        <button id="searchBtn">Search</button>
      </div>

      <!-- Sport Filters -->
      <div class="filter-options">
        <button class="filter-btn active" data-sport="all">All Sports</button>
        <button class="filter-btn" data-sport="NFL">NFL</button>
        <button class="filter-btn" data-sport="MLB">MLB</button>
        <button class="filter-btn" data-sport="CFB">College Football</button>
        <button class="filter-btn" data-sport="CBB">College Basketball</button>
      </div>
    </div>

    <!-- Status Messages -->
    <div id="statusMessage" class="status-message"></div>

    <!-- Results Section -->
    <div id="resultsSection">
      <div class="results-header">
        <div class="results-count" id="resultsCount"></div>
        <div class="results-meta" id="resultsMeta"></div>
      </div>

      <!-- AI Insights -->
      <div id="insightsContainer"></div>

      <!-- Game Cards Grid -->
      <div class="games-grid" id="gamesGrid"></div>
    </div>

    <footer>
      <p>Semantic Search: bge-base-en-v1.5 (768-dim) | RAG: llama-3.1-8b-instruct</p>
    </footer>
  </div>

  <script>/* Search logic + Babylon.js initialization */</script>
</body>
</html>
```

### JavaScript State Management
```javascript
// Global State
let currentSport = 'all';

// DOM References
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('resultsSection');
const gamesGrid = document.getElementById('gamesGrid');

// Event Listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});
```

---

## 🔌 Backend API Architecture

### Data Flow
```
1. User Query
   ↓
2. Frontend (copilot.html)
   ↓
3. POST /api/copilot/search
   ↓
4. Generate embedding (Workers AI: bge-base-en-v1.5)
   ↓
5. Query Vectorize index (cosine similarity)
   ↓
6. Fetch full game records from D1 (by game IDs)
   ↓
7. Generate AI insights (Workers AI: llama-3.1-8b-instruct)
   ↓
8. Cache response in KV (60s TTL)
   ↓
9. Return JSON with games + insights + relevance scores
```

### API Endpoints

#### **Health Check** (`GET /api/copilot/health`)
Tests all 6 Cloudflare bindings:
- D1 Database
- KV Namespace
- R2 Bucket
- Vectorize Index
- Workers AI (Embeddings)
- Workers AI (LLM)

**Response:**
```json
{
  "status": "healthy",
  "checks": [
    {"service": "D1 Database", "status": "healthy", "responseTime": "337ms"},
    {"service": "Workers AI (Embeddings)", "status": "healthy", "responseTime": "152ms"}
  ],
  "ready_for_production": true,
  "phase2_features": {
    "semantic_search": true,
    "rag_insights": true,
    "embedding_generation": true
  }
}
```

#### **Teams** (`GET /api/copilot/teams?sport=MLB`)
Returns team data with KV caching (1 hour TTL):
```json
{
  "sport": "MLB",
  "count": 4,
  "teams": [
    {
      "name": "St. Louis Cardinals",
      "conference": "NL",
      "division": "Central"
    }
  ],
  "source": "cache",
  "responseTime": "10ms"
}
```

#### **Semantic Search** (`POST /api/copilot/search`) [PHASE 2 - PENDING]
```javascript
// Request
{
  "query": "Cardinals recent games",
  "limit": 10,
  "sport": "MLB" // optional filter
}

// Response
{
  "query": "Cardinals recent games",
  "results": [
    {
      "game": {
        "sport": "MLB",
        "home_team_name": "St. Louis Cardinals",
        "away_team_name": "Chicago Cubs",
        "home_score": 4,
        "away_score": 2,
        "game_date": "2025-09-28",
        "status": "Final"
      },
      "relevanceScore": 0.76
    }
  ],
  "insights": {
    "summary": "The St. Louis Cardinals recently played...",
    "confidence": 0.76,
    "sourceCount": 5
  },
  "meta": {
    "searchTime": 1234567890,
    "embeddingTime": "150ms",
    "vectorizeTime": "45ms",
    "dbTime": "120ms",
    "ragTime": "1800ms"
  }
}
```

#### **RAG Insights** (`POST /api/copilot/insight`) [PHASE 2 - PENDING]
```javascript
// Request
{
  "question": "How did the Cardinals perform?",
  "sport": "MLB",
  "context": [/* recent games */]
}

// Response
{
  "question": "How did the Cardinals perform?",
  "insight": "Based on recent games, the Cardinals showed...",
  "sources": [
    {"game_id": 3, "teams": "Cubs at Cardinals", "date": "2025-09-28"}
  ],
  "confidence": 0.82
}
```

---

## 🗄️ Database Schema

### D1 Tables

#### **teams**
```sql
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  team_id INTEGER NOT NULL UNIQUE,
  global_team_id INTEGER,
  key TEXT,
  city TEXT,
  name TEXT NOT NULL,
  school TEXT,
  conference TEXT,
  division TEXT,
  stadium_name TEXT,
  stadium_capacity INTEGER,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_sport_key ON teams(sport, key);
CREATE INDEX idx_teams_conference ON teams(conference);
```

#### **games**
```sql
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  game_id INTEGER,
  season INTEGER NOT NULL,
  season_type TEXT NOT NULL,
  week INTEGER,
  game_date TEXT NOT NULL,
  game_time TEXT,
  status TEXT DEFAULT 'Scheduled',
  home_team_id INTEGER NOT NULL,
  home_team_key TEXT NOT NULL,
  home_team_name TEXT NOT NULL,
  home_score INTEGER,
  away_team_id INTEGER NOT NULL,
  away_team_key TEXT NOT NULL,
  away_team_name TEXT NOT NULL,
  away_score INTEGER,
  stadium_name TEXT,
  winning_team_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (home_team_id) REFERENCES teams(team_id),
  FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
);

CREATE INDEX idx_games_sport_season ON games(sport, season);
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);
```

#### **players** (Ready for seeding)
```sql
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sport TEXT NOT NULL,
  player_id INTEGER UNIQUE,
  team_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  jersey_number INTEGER,
  height TEXT,
  weight INTEGER,
  year TEXT,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

---

## 🤖 Workers AI Integration

### Embedding Generation
```typescript
// Model: @cf/baai/bge-base-en-v1.5 (768 dimensions)
const response = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: 'NFL game: Vikings at Chiefs on 2025-10-05. Score: 24-28. Final.'
});

const embedding = response.data[0]; // Float32Array(768)
```

### Vectorize Storage
```typescript
await env.VECTOR_INDEX.insert([{
  id: 'game-1',
  values: embedding,
  metadata: {
    game_id: 1,
    sport: 'NFL',
    home_team: 'Kansas City Chiefs',
    away_team: 'Minnesota Vikings',
    game_date: '2025-10-05',
    status: 'Final'
  }
}]);
```

### Semantic Search
```typescript
// Query embedding
const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: userQuery
});

// Search Vectorize (cosine similarity)
const results = await env.VECTOR_INDEX.query(queryEmbedding.data[0], {
  topK: 10,
  returnMetadata: 'all',
  filter: { sport: 'NFL' } // optional
});

// results.matches = [{id, score, metadata}, ...]
```

### RAG Generation
```typescript
// Model: @cf/meta/llama-3.1-8b-instruct
const prompt = `You are a professional sports analyst.

Context (recent games):
${gameDescriptions.join('\n')}

Question: ${userQuestion}

Provide concise, data-driven insights for coaches.`;

const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [
    { role: 'system', content: 'You are a professional sports analyst.' },
    { role: 'user', content: prompt }
  ],
  max_tokens: 500
});

const insight = aiResponse.response;
```

---

## 🚀 Performance Optimization

### Multi-Tier Caching Strategy
```
1. KV Cache (Sub-50ms)
   - Common queries cached for 60 seconds
   - Sport filter results cached for 5 minutes

2. D1 Database (100-500ms)
   - Indexed queries with prepared statements
   - JSON column support for flexible stats

3. External APIs (500-2000ms)
   - Only when cache misses
   - Results immediately cached
```

### Babylon.js Optimization
```javascript
// WebGPU: 2-4x faster than WebGL2
// Thin Instances: 10-100x faster than individual meshes
// LOD System: Automatic quality reduction at distance

// Performance Targets
// - 60 FPS particle system
// - < 1.2s First Contentful Paint
// - < 2.0s Time to Interactive
```

### API Response Times
```
Health Check: 1556ms (initial cold start)
Teams API:    305ms (database) → 10ms (cached)
Search API:   < 500ms target (embedding + vector query)
RAG Insights: < 2s target (LLM inference at edge)
```

---

## 📊 Current Status (Week 1 Complete)

### ✅ Deployed & Operational
1. **Frontend**: Glassmorphic UI with 3D Babylon.js background
2. **Navigation**: Top nav bar with links to Analytics/Main Site
3. **API Health Check**: 6/6 services healthy
4. **Teams API**: Working with 30x caching speedup
5. **Database**: 16 teams, 8 games seeded across 4 sports

### 🔄 Phase 2 Pending
1. **Semantic Search API**: Embedding generation + Vectorize query
2. **Games API**: Query historical and live game data
3. **RAG Insights API**: LLM-powered coaching analysis
4. **Frontend Integration**: Connect copilot.html to real APIs

---

## 🎯 Next Implementation Steps

### Week 2: Semantic Search
1. Create `/api/copilot/games` endpoint
2. Create `/api/copilot/search` endpoint with embedding generation
3. Generate embeddings for all 8 existing games
4. Test semantic search with natural language queries

### Week 3: RAG Integration
1. Create `/api/copilot/insight` endpoint with Llama 3.1
2. Update copilot.html to call real APIs (remove mock data)
3. Display AI insights with confidence scores
4. Add source citations to game cards

### Week 4: Polish & Scale
1. Add loading states and error handling
2. Implement real-time updates via WebSockets (optional)
3. Seed 100+ games for better search results
4. Performance testing and optimization

---

## 📚 Key Learnings & Best Practices

### From Production Experience
1. **WebGPU Adoption**: 60-70% desktop support (Oct 2025), always provide WebGL2 fallback
2. **Glassmorphism**: 8-10px blur on mobile, 15-20px on desktop for performance
3. **Caching**: KV caching provides 30-61x speedup for repeat queries
4. **Vectorize**: Sub-50ms query times even with 10K+ vectors

### Design Patterns
1. **Fail-Closed**: If data can't be validated, don't display it
2. **Progressive Enhancement**: Core functionality without JS, enhanced with animations
3. **Micro-Interactions**: Every hover/focus state should have smooth transitions
4. **Data Citations**: Always show source and timestamp for all statistics

### Code Quality Standards
- TypeScript interfaces for all API contracts
- Proper error handling with try/catch
- CORS headers on all API responses
- SQL prepared statements (no string interpolation)
- Accessibility: WCAG AA compliance, keyboard navigation

---

## 🔗 Related Documentation

- **Deployment Summary**: `/COPILOT-V2-DEPLOYMENT-SUMMARY.md`
- **Data Ingestion Guide**: `/COPILOT-DATA-INGESTION.md`
- **Frontend Code**: `/copilot.html`
- **API Functions**: `/functions/api/copilot/`
- **Database Schema**: `/scripts/d1-schema.sql`
- **Week 1 Report**: `/PHASE-2-WEEK-1-COMPLETE.md`

---

**Last Updated**: 2025-10-10
**Status**: Phase 2 Week 1 Complete ✅
**Next Milestone**: Week 2 - Semantic Search Implementation
