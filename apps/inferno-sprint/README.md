# BSI: Inferno Sprint

A 3D arcade speedrun game where you race through the inferno collecting souls against the clock. Based on the award-winning [Dante](https://github.com/SalvatorePreviti/js13k-2022) by Salvatore Previti (JS13K 2022 winner).

## Features

- **Sprint Mode**: Race to collect all 13 souls and return to the boat
- **Timer HUD**: Real-time countdown with visual feedback
- **Leaderboard**: Compete for the fastest times globally
- **Multiple Control Schemes**: Keyboard, mouse, touch, and gamepad support
- **First-Person Mode**: Immersive gameplay perspective
- **Personal Best Tracking**: Local storage of your best times

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrow Keys | Move |
| E / Click / Space | Interact / Collect |
| Esc | Open Menu |
| Mouse (First Person) | Look around |
| Gamepad | Full support |
| Touch | Virtual joystick |

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/score` | POST | Submit a completed run |
| `/api/leaderboard` | GET | Fetch top scores |
| `/api/version` | GET | Get game version info |

## Tech Stack

- **Frontend**: TypeScript, WebGL2, Vite
- **Backend**: Cloudflare Workers
- **Storage**: Cloudflare KV
- **Deployment**: Cloudflare Pages

## Credits

- **Original Game**: [Dante](https://github.com/SalvatorePreviti/js13k-2022) by Salvatore Previti
- **Music**: Ryan Malm (Beethoven's Moonlight Sonata metal arrangement)
- **BSI Adaptation**: Blaze Sports Intel

## License

MIT License - See [LICENSE-ORIGINAL](./LICENSE-ORIGINAL) for the original Dante license.

---

Built with by [Blaze Sports Intel](https://blazesportsintel.com)
