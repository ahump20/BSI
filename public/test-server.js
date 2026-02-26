const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// Mock API data
const mockGameData = {
  'tex-lam-20260217': {
    game_id: 'tex-lam-20260217',
    home: { abbr: 'TEX', score: 2, record: '3-0' },
    away: { abbr: 'LAM', score: 3 },
    inning: 4,
    half: 'bottom',
    situation: {
      outs: 1,
      runners: ['2B'],
      leverage: 'HIGH',
      description: 'Runner in scoring position, tying run at bat',
    },
    win_probability: { home: 0.48, away: 0.52 },
    current_pitcher: { name: 'Doe', pitch_count: 67, era: 3.12 },
    last_play: 'RBI single — .340 hitter',
    recent_pitches: [
      { type: 'FF', velocity: 94, result: 'Swing and miss' },
      { type: 'SL', velocity: 84, result: 'Ball' },
      { type: 'FF', velocity: 95, result: 'Foul' },
      { type: 'CH', velocity: 82, result: 'Foul' },
      { type: 'FF', velocity: 93, result: 'RBI Single' },
    ],
  },
  'tex-uc-davis-20260215': {
    game_id: 'tex-uc-davis-20260215',
    home: { abbr: 'TEX', score: 7, record: '2-0' },
    away: { abbr: 'UCD', score: 3 },
    inning: 9,
    half: 'top',
    situation: {
      outs: 2,
      runners: ['1B', '3B'],
      leverage: 'MEDIUM',
      description: 'Two outs, runners on corners',
    },
    win_probability: { home: 0.89, away: 0.11 },
    current_pitcher: { name: 'Smith', pitch_count: 112, era: 2.45 },
    last_play: 'Groundout 6-3',
    recent_pitches: [
      { type: 'FB', velocity: 92, result: 'Called strike' },
      { type: 'SL', velocity: 81, result: 'Swing and miss' },
      { type: 'CH', velocity: 80, result: 'Foul' },
      { type: 'FB', velocity: 93, result: 'Ball' },
      { type: 'FB', velocity: 91, result: 'Groundout' },
    ],
  },
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoint
  if (req.url.startsWith('/api/live/')) {
    const gameId = req.url.split('/api/live/')[1];
    const data = mockGameData[gameId] || {
      game_id: gameId,
      home: { abbr: 'TEX', score: 0, record: '0-0' },
      away: { abbr: 'OPP', score: 0 },
      inning: 1,
      half: 'top',
      situation: {
        outs: 0,
        runners: [],
        leverage: 'LOW',
        description: 'Game data loading...',
      },
      win_probability: { home: 0.5, away: 0.5 },
      current_pitcher: { name: '—', pitch_count: 0, era: 0.0 },
      last_play: '—',
      recent_pitches: [],
      meta: { source: 'BSI', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  // Serve files
  let filePath = path.join(__dirname, req.url === '/' ? 'widget-test.html' : req.url);
  
  // Security: prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT}/widget-test.html to test the widget`);
});
