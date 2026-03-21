// Set via: wrangler secret put RESEND_API_KEY --config workers/synthetic-monitor/wrangler.toml
interface Env {
  RESEND_API_KEY?: string;
}
