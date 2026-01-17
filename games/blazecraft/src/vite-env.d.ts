/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

// BlazeCraft environment variables
interface ImportMetaEnv {
  /** Force demo mode: 'true' = always demo, 'false'/omit = try live first */
  readonly VITE_FORCE_DEMO?: string;
  /** Default render mode when no URL param: '2d' (default) or '3d' */
  readonly VITE_DEFAULT_RENDER?: '2d' | '3d';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
