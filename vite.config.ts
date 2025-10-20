import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const enableSentry = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
)

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()]

  if (enableSentry) {
    plugins.push(
      sentryVitePlugin({
        org: process.env.SENTRY_ORG!,
        project: process.env.SENTRY_PROJECT!,
        authToken: process.env.SENTRY_AUTH_TOKEN!,
        release: process.env.SENTRY_RELEASE ?? mode,
        include: './dist',
        urlPrefix: '~/'
      })
    )
  }

  return {
    plugins,
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: enableSentry,
      minify: 'esbuild',
      rollupOptions: {
        input: {
          main: resolve(rootDir, 'index.html'),
          football: resolve(rootDir, 'football.html'),
          basketball: resolve(rootDir, 'basketball.html'),
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
          },
        },
      },
    },
    define: {
      __SENTRY_RELEASE__: JSON.stringify(process.env.SENTRY_RELEASE ?? mode),
    },
  }
})
