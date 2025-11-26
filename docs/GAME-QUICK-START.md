# Diamond Sluggers - Quick Start Guide

## 5-Minute Setup & Deployment

### Step 1: Generate Icons (Required)

Use one of these free tools to generate PWA icons:

**Option A: PWA Asset Generator**
```bash
npm install -g pwa-asset-generator
pwa-asset-generator public/game/logo.png public/game/icons --icon-only
```

**Option B: Online Tool**
1. Go to https://realfavicongenerator.net/
2. Upload a 512x512 baseball-themed logo
3. Download icons
4. Extract to `/Users/AustinHumphrey/BSI/public/game/icons/`

**Required Sizes:**
- icon-72.png
- icon-96.png
- icon-128.png
- icon-144.png
- icon-152.png
- icon-180.png
- icon-192.png
- icon-512.png

### Step 2: Quick Test Locally

```bash
cd /Users/AustinHumphrey/BSI

# Serve locally
python3 -m http.server 8000

# Open in browser
# Visit: http://localhost:8000/game/
```

Test:
- [ ] Game loads
- [ ] Character selection works
- [ ] Can select 3+ characters
- [ ] "Start Game" button works
- [ ] Canvas displays field

### Step 3: Deploy to Cloudflare

```bash
# Make deploy script executable (if not already)
chmod +x deploy-game.sh

# Run deployment
./deploy-game.sh

# When prompted, press 'y' to confirm
```

The script will:
1. Check all files exist
2. Validate JSON
3. Deploy to Cloudflare Pages
4. Give you the live URL

### Step 4: Test on Mobile

**iOS (iPhone/iPad):**
1. Open Safari
2. Go to https://blazesportsintel.com/game
3. Tap Share icon (⬆️)
4. Tap "Add to Home Screen"
5. Name it "Diamond Sluggers"
6. Tap "Add"
7. Open from home screen
8. Play game!

**Android:**
1. Open Chrome
2. Go to https://blazesportsintel.com/game
3. Tap menu (⋮)
4. Tap "Install app" or "Add to Home screen"
5. Tap "Install"
6. Open from home screen
7. Play game!

### Step 5: Verify Everything Works

Test these core features:

**Gameplay:**
- [ ] Pitch comes toward plate
- [ ] Tap "SWING" button responds
- [ ] Ball physics work
- [ ] Score updates
- [ ] Inning progresses

**Progression:**
- [ ] Play 3-inning game
- [ ] Win or lose
- [ ] Stats save (close and reopen)
- [ ] Win streak tracks

**Characters:**
- [ ] 3 starter characters available
- [ ] Can select and deselect
- [ ] Stats display
- [ ] Locked characters show unlock requirement

**PWA:**
- [ ] Installs to home screen
- [ ] Works offline (turn off wifi/data)
- [ ] Splash screen shows
- [ ] Fullscreen mode works

## Troubleshooting

### Icons Don't Show
**Fix:** Regenerate icons with correct naming (icon-192.png not icon-192x192.png)

### Game Won't Load
**Fix:** Check browser console (F12) for errors. Likely missing JavaScript file.

### Can't Deploy
**Fix:**
```bash
# Login to Cloudflare again
wrangler login

# Try deployment again
./deploy-game.sh
```

### Offline Mode Not Working
**Fix:** Service worker might not have registered. Clear cache and reload:
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
location.reload();
```

### Touch Not Working
**Fix:** Ensure you're testing on actual device, not simulator. Some simulators don't support touch events properly.

## Customization

### Change Colors
Edit `/Users/AustinHumphrey/BSI/public/game/index.html`:

```css
/* Find these in the <style> section */
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); /* Dark blue */
background: linear-gradient(135deg, #f39c12, #e67e22); /* Orange */

/* Change to your brand colors */
background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
```

### Change Game Length
Edit `/Users/AustinHumphrey/BSI/public/game/js/main.js`:

```javascript
// Find this line (around line 250)
maxInnings: 3, // Can be 3, 6, or 9

// Change to:
maxInnings: 6, // For longer games
```

### Add More Characters
Edit `/Users/AustinHumphrey/BSI/public/game/js/characters.js`:

Add new character object to CHARACTERS array:
```javascript
{
    id: 'your-character',
    name: 'Your Character Name',
    emoji: '🎯',
    age: 11,
    hometown: 'Your City, TX',
    bio: 'Description',
    stats: {
        power: 7,
        contact: 8,
        speed: 7,
        fielding: 8,
        pitching: 6
    },
    ability: {
        name: 'Special Move',
        description: 'What it does',
        cooldown: 3
    },
    colors: {
        primary: '#COLOR1',
        secondary: '#COLOR2'
    },
    unlockCondition: 'win60' // Or 'starter'
}
```

## Performance Tips

### If Game Runs Slow on Low-End Devices

Edit `/Users/AustinHumphrey/BSI/public/game/js/main.js`:

```javascript
// Reduce target FPS (around line 150)
const targetFPS = 30; // Instead of 60

// Simplify graphics in renderer
// Remove particle effects
// Reduce shadow quality
```

### If Loading Takes Too Long

1. **Minify JavaScript:**
```bash
npm install -g terser
terser public/game/js/*.js -o public/game/js/game.min.js
```

2. **Update HTML to use minified version:**
```html
<script src="/game/js/game.min.js"></script>
```

## Adding to Main Site

Add game link to `/Users/AustinHumphrey/BSI/public/index.html`:

```html
<!-- In navigation menu -->
<nav>
    <a href="/">Home</a>
    <a href="/mlb">MLB</a>
    <a href="/nfl">NFL</a>
    <a href="/game">🎮 Play Game</a> <!-- Add this -->
</nav>

<!-- Or as a featured section -->
<section class="game-feature">
    <h2>🎮 Diamond Sluggers</h2>
    <p>Play our nostalgic mobile baseball game!</p>
    <a href="/game" class="cta-button">Play Now</a>
</section>
```

## Promotion Ideas

### Social Media
Tweet/post:
```
🎮 New game alert! Diamond Sluggers is now live!

Play nostalgic backyard baseball on your phone:
🏠 5 unique Texas stadiums
⚾ 12 original kid characters
📱 100% free, no ads
🔒 Works offline

Play now: blazesportsintel.com/game

#IndieGame #MobileGaming #Baseball
```

### Blog Post
Create `/Users/AustinHumphrey/BSI/public/blog/diamond-sluggers-launch.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Introducing Diamond Sluggers | Blaze Sports Intel</title>
</head>
<body>
    <article>
        <h1>Introducing Diamond Sluggers</h1>
        <p>We're excited to launch Diamond Sluggers, our nostalgic mobile baseball game...</p>
        <a href="/game">Play Now</a>
    </article>
</body>
</html>
```

### Email Newsletter
```
Subject: 🎮 New: Play Baseball on Your Phone!

Hi [Name],

We've just launched Diamond Sluggers, a free mobile baseball game that captures the nostalgic feel of classic backyard baseball.

Features:
- 12 unique kid characters
- 5 Texas-themed stadiums
- Offline play support
- No ads, no in-app purchases

Play now: blazesportsintel.com/game

Best regards,
Austin & The Blaze Sports Intel Team
```

## Analytics Tracking

To track game usage, add to `/Users/AustinHumphrey/BSI/public/game/index.html`:

```html
<!-- Before </body> -->
<script>
// Track game starts
function trackGameStart() {
    if (window.gtag) {
        gtag('event', 'game_start', {
            'event_category': 'engagement',
            'event_label': 'diamond_sluggers'
        });
    }
}

// Track game completions
function trackGameEnd(won) {
    if (window.gtag) {
        gtag('event', 'game_complete', {
            'event_category': 'engagement',
            'event_label': won ? 'win' : 'loss'
        });
    }
}
</script>
```

## Getting Help

### Resources
- **Full Documentation:** `/Users/AustinHumphrey/BSI/DIAMOND-SLUGGERS-DOCUMENTATION.md`
- **Implementation Details:** `/Users/AustinHumphrey/BSI/GAME-IMPLEMENTATION-SUMMARY.md`
- **Character Data:** `/Users/AustinHumphrey/BSI/public/game/js/characters.js`
- **Stadium Data:** `/Users/AustinHumphrey/BSI/public/game/js/stadiums.js`

### Support
- **Email:** ahump20@outlook.com
- **Site:** blazesportsintel.com

### Common Issues & Solutions

**Q: Characters won't unlock**
A: Check win count in browser console:
```javascript
// Open browser dev tools (F12)
JSON.parse(localStorage.getItem('diamond-sluggers-save')).stats.wins
// Should return your win count
```

**Q: Can't see the ball**
A: Check canvas rendering in console:
```javascript
// Should log "Rendering game..."
// If not, JavaScript may have errors
```

**Q: Offline mode not working**
A: Service worker may need manual registration:
```javascript
navigator.serviceWorker.register('/game/sw.js').then(
    reg => console.log('SW registered', reg)
);
```

## Next Steps After Launch

### Week 1
- [ ] Monitor Cloudflare Analytics
- [ ] Fix any critical bugs
- [ ] Gather initial user feedback
- [ ] Post on social media
- [ ] Add game link to main site

### Month 1
- [ ] Analyze which characters are most popular
- [ ] See which stadiums get played most
- [ ] Adjust difficulty if too easy/hard
- [ ] Add requested features
- [ ] Create gameplay video for YouTube

### Month 3
- [ ] Consider adding multiplayer
- [ ] Implement leaderboards
- [ ] Add new characters/stadiums
- [ ] Create seasonal events
- [ ] Mobile app store submission (if desired)

---

## Ready to Launch?

```bash
# From /Users/AustinHumphrey/BSI

# 1. Generate icons (if not done)
# 2. Test locally
python3 -m http.server 8000

# 3. Deploy
./deploy-game.sh

# 4. Test on mobile
# 5. Share with the world!
```

**That's it! Your game is ready to play. Have fun! ⚾🎮**

---

**Quick Start Version:** 1.0.0
**Created:** January 9, 2025
