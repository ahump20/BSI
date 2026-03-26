# Infrastructure Lessons Learned

## Wrangler Auth
- OAuth tokens expire. Always run `npx wrangler login` before any deploy session.
- Token stored at `~/.wrangler/config/default.toml`
- Non-interactive wrangler login is not possible from code tasks — requires browser OAuth flow

## Build System
- Turbopack fails in git worktrees. Always use `TURBOPACK=0 npx next build` or `--no-turbopack`
- BSI's Next.js build (15K+ static pages) takes 5-10 minutes. Set bash timeouts to 600s.
- The `build-safe.sh` script conflicts when `TURBOPACK=0` is set alongside `--webpack`

## iCloud Drive
- Large git operations in iCloud-synced directories can timeout
- Git push from worktrees inside iCloud is unreliable
- Consider moving repo outside iCloud or pausing sync during builds

## Cowork Dispatch
- Tasks cannot access files from other Dispatch sessions — pass content inline
- Code tasks run on host filesystem, not the Cowork VM
- Cowork VM paths (/sessions/...) don't exist on host — never pass them to code tasks
- Desktop Commander MCP can read/write directly to host filesystem from Dispatch
