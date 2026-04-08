interface Env {
  DB: D1Database;
  BSI_PROD_DB: D1Database;
  BSI_KEYS: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  BSI_PROD_CACHE: KVNamespace;
}
