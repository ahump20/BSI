// Set via: wrangler secret put <KEY> --config workers/synthetic-monitor/wrangler.toml
interface Env {
  RESEND_API_KEY?: string;
  ADMIN_KEY?: string;
}
