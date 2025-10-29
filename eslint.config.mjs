import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import pluginQuasar from '@quasar/app-vite/eslint'
import prettierSkipFormatting from '@vue/eslint-config-prettier/skip-formatting' // optional

export default [
  // Optionally ignore certain paths
  {
    ignores: [
      'dist',
      '.quasar',
      'node_modules',
      'src-capacitor',
      'src-electron',
      'src-bex/www',
      'src-capacitor',
      'src-cordova',
      'src/types'
    ]
  },

  // Quasar’s recommended base config (includes Vite settings)
  ...pluginQuasar.configs.recommended(),

  // Core JS rules
  js.configs.recommended,

  // Vue 3 recommended rules
  ...pluginVue.configs['flat/essential'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
        process: 'readonly',
        ga: 'readonly',
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly',
        browser: 'readonly'
      }
    },

    rules: {
      // Disable overly strict defaults
      'prefer-promise-reject-errors': 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

      // Optional: more relaxed Quasar-style rules
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off'
    }
  },

  // Special case: service worker
  {
    files: ['src-pwa/custom-service-worker.js'],
    languageOptions: {
      globals: globals.serviceworker
    }
  },

  // Optional Prettier integration
  prettierSkipFormatting
]
