/*
 * This file runs in a Node context (it's NOT transpiled by Babel).
 */
/* eslint-env node */
import path from 'node:path'
import * as sass from 'sass'
import { defineConfig } from '@quasar/app-webpack/wrappers'

export default defineConfig(() => ({
  supportTS: false,
  boot: ['install-store', 'resize-observer-patch', 'passive-events', 'axios'],
  css: ['app.sass'],
  extras: ['fontawesome-v6', 'material-icons'],

  build: {
    vueRouterMode: 'history',
    publicPath: '/',
    env: {
      API: process.env.NODE_ENV === 'production' ? 'https://films.fotrino.com/api' : '/api'
    },
    sassLoaderOptions: {
      implementation: sass
    },
    extendWebpack(cfg) {
      cfg.resolve.alias = {
        ...cfg.resolve.alias,
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@components': path.resolve(__dirname, './src/components'),
        '@composables': path.resolve(__dirname, './src/composables'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@deps': path.resolve(__dirname, './node_modules'),
        '@libs': path.resolve(__dirname, './src/libs')
      }
    },
    sourcemap: true
  },

  devServer: {
    https: true,
    host: 'fotrino.example.com',
    port: 8080,
    open: true,
    proxy: [
      {
        context: ['/api'],
        target: 'https://fotrino.example.com:65443/',
        secure: false,
        changeOrigin: false
      }
    ]
  },

  framework: {
    iconSet: 'material-icons',
    lang: 'en-US',
    config: { dark: 'auto' },
    importStrategy: 'auto',
    plugins: ['Dialog', 'Loading', 'LocalStorage', 'Meta', 'Notify']
  },

  animations: ['zoomInDown'],

  ssr: {
    pwa: false,
    middlewares: ['render'],
    csp: false
  },

  pwa: {
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {},
    manifest: {
      name: 'fotrino-films',
      short_name: 'fotrino-films',
      description: 'The transparent video host',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#027be3',
      icons: [
        { src: 'favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { src: 'favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { src: 'favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
      ]
    }
  },

  cordova: {},
  capacitor: { hideSplashscreen: true },

  electron: {
    bundler: 'packager',
    packager: {},
    builder: { appId: 'fotrino-films' },
    nodeIntegration: true,
    extendWebpack(cfg) {
      cfg.module.rules.push({
        test: /\.js$/,
        include: path.resolve(__dirname, 'src/libs'),
        loader: 'ignore-loader'
      })
    }
  }
}))
