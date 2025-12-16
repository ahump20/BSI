# Blaze Sports Intel — Home Page

**Born in Memphis. Rooted in Texas soil. Built for fans who care.**

*Courage • Grit • Leadership*

## Overview

This is the production home page for BlazeSportsIntel.com, deployed via Cloudflare Workers with assets served from R2.

## The Story

On August 17, 1995—the same birthday as Davy Crockett—John Austin Humphrey was born in Memphis, Tennessee. But thanks to Texas soil from West Columbia placed beneath the hospital bed by his father (a true Texan from El Campo), the 127-year tradition of Humphreys being born on Texas soil continued.

The doctor's response: *"You know you ain't the first to do this—but they've ALL been from Texas."*

## Repository

- **GitHub**: https://github.com/ahump20/BSI.git
- **SSH**: git@github.com:ahump20/BSI.git

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **CDN/Edge**: Cloudflare Workers
- **Asset Storage**: Cloudflare R2
- **Domain**: blazesportsintel.com

## Project Structure

```
bsi-production/
├── index.html           # Main home page
├── worker.js            # Cloudflare Worker
├── wrangler.toml        # Cloudflare config
├── deploy.sh            # Deployment script
├── README.md            # This file
└── images/
    ├── bsi-logo.png         # Full BSI logo
    ├── bsi-logo-nav.png     # Nav-sized logo
    ├── texas-soil.jpg       # The original Texas soil
    ├── birth-certificate.jpg # The proof
    ├── blaze-and-austin.jpg # Namesake of the company
    ├── headshot.jpg         # Austin's headshot
    ├── dad-and-kid.jpg      # Bartlett Blaze days
    ├── longhorns-kid.jpg    # Burnt orange from birth
    └── titans-halloween.jpg # Eddie George Halloween
```

## Deployment

### Prerequisites

1. [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update/)
2. Cloudflare account with R2 enabled
3. `blazesports-assets` R2 bucket created

### Deploy

```bash
# Login to Cloudflare
wrangler login

# Deploy everything
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment

```bash
# Upload images to R2
wrangler r2 object put blazesports-assets/origin/images/texas-soil.jpg --file=images/texas-soil.jpg

# Upload index.html
wrangler r2 object put blazesports-assets/origin/index.html --file=index.html --content-type="text/html"

# Deploy worker
wrangler deploy
```

### Custom Domain Setup

1. Go to Cloudflare Dashboard → Workers & Pages → bsi-home
2. Click 'Triggers' tab
3. Add Custom Domain → blazesportsintel.com

## Design System

### Colors

- **Burnt Orange**: #BF5700 (Texas Longhorns)
- **Texas Soil**: #8B4513 (West Columbia earth)
- **Gold**: #C9A227 (Accent/values)
- **Ember**: #FF6B35 (Flame highlight)
- **Midnight**: #0D0D0D (Background)
- **Cream**: #FAF8F5 (Text/light sections)

### Typography

- **Display**: Playfair Display
- **Body**: Source Serif 4
- **UI**: IBM Plex Sans
- **Mono**: IBM Plex Mono

### Brand Values

- **Courage**: Building what fans deserve
- **Grit**: Building something from nothing
- **Leadership**: Charting the path less beaten

## Coverage

- MLB (Cardinals focus, all 30 teams)
- NFL (Titans focus, all 32 teams)
- College Baseball (all 300+ D1 programs)
- NCAA Football (FBS, FCS, all conferences)
- NBA (Grizzlies focus, all 30 teams)

---

*Born to Blaze the Path Less Beaten*

© 2025 Blaze Sports Intel
