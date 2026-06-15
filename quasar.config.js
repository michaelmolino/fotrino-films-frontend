/*
 * Quasar Vite config
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@quasar/app-vite/wrappers'
import { loadEnv } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import istanbul from 'vite-plugin-istanbul'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const configureForwardedHeaders = proxy => {
  proxy.on('proxyReq', (proxyReq, req) => {
    proxyReq.setHeader(
      'X-Forwarded-Host',
      req.headers.host || req.headers['x-forwarded-host'] || req.headers[':authority'] || ''
    )
    proxyReq.setHeader(
      'X-Forwarded-Proto',
      req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')
    )
  })
}

const apiProxyPrefixes = [
  '^/account/(auth|login)/[^/]+$',
  '/account/logout',
  '/account/mock-login',
  '/account/profile',
  '/account/providers',
  '^/admin/(jobs(?:/.*)?|maintenance(?:/.*)?|media(?:/.*)?|users(?:/.*)?)$',
  '/channels',
  '/health',
  '/history',
  '/media-reports',
  '/test/workers',
  '/uploads',
  '/uppy'
]

const requireEnv = (env, name, { required = true } = {}) => {
  const value = env[name]
  if (required && (!value || !String(value).trim())) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export default defineConfig(ctx => {
  const envMode = ctx.dev ? 'development' : 'production'
  const env = {
    ...loadEnv(envMode, __dirname, ''),
    ...process.env
  }
  const isProduction = envMode === 'production'
  const apiBaseUrl = requireEnv(env, 'API')
  const siteBaseUrl = requireEnv(env, 'SITE_BASE_URL')
  const devProxyTarget = requireEnv(env, 'DEV_PROXY_TARGET', { required: !isProduction })

  return {
    supportTS: false,
    boot: ['install-colada', 'install-axios', 'bootstrap-profile', 'image-asset-support'],
    css: [],
    extras: ['material-icons'],

    build: {
      vueRouterMode: 'history',
      publicPath: '/',
      env: {
        API: apiBaseUrl,
        SITE_BASE_URL: siteBaseUrl,
        SAMPLE_CHANNEL_CANONICAL_PATH: env.SAMPLE_CHANNEL_CANONICAL_PATH
      },
      sourcemap: !isProduction,
      extendViteConf(viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.alias = viteConf.resolve.alias || {}
        viteConf.resolve.alias = {
          ...viteConf.resolve.alias,
          '@layouts': path.resolve(__dirname, 'src/layouts'),
          '@components': path.resolve(__dirname, 'src/components'),
          '@composables': path.resolve(__dirname, 'src/composables'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@clients': path.resolve(__dirname, 'src/clients'),
          '@assets': path.resolve(__dirname, 'src/assets'),
          '@css': path.resolve(__dirname, 'src/css'),
          '@deps': path.resolve(__dirname, 'node_modules')
        }
        viteConf.optimizeDeps = viteConf.optimizeDeps || {}
        viteConf.plugins = viteConf.plugins || []
        viteConf.plugins.push(
          viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
          viteCompression({ algorithm: 'gzip', ext: '.gz' })
        )
        if (env.ANALYZE === 'true') {
          viteConf.plugins.push(
            visualizer({
              filename: path.resolve(__dirname, 'dist/spa/stats.html'),
              template: 'treemap',
              gzipSize: true,
              brotliSize: true,
              open: false
            })
          )
        }
        if (env.COVERAGE === 'true') {
          viteConf.plugins.push(
            istanbul({
              include: ['src/**/*.js', 'src/**/*.vue'],
              extension: ['.js', '.vue'],
              cypress: true,
              requireEnv: false
            })
          )
        }
      }
    },

    devServer: isProduction
      ? undefined
      : {
          https: true,
          host: 'fotrino.example.com',
          port: 8080,
          open: env.COVERAGE !== 'true',
          proxy: Object.fromEntries(
            apiProxyPrefixes.map(prefix => [
              prefix,
              {
                target: devProxyTarget,
                changeOrigin: true,
                secure: false,
                configure: configureForwardedHeaders
              }
            ])
          )
        },

    framework: {
      iconSet: 'material-icons',
      lang: 'en-US',
      config: { dark: 'auto' },
      importStrategy: 'auto',
      plugins: ['Dialog', 'Loading', 'LocalStorage', 'Meta', 'Notify']
    },

    animations: ['zoomInDown'],

    ssr: { pwa: false }
  }
})
