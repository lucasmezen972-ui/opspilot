import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import babel from 'vite-plugin-babel'

export default defineConfig({
  plugins: [
    babel({
      babelConfig: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript'
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.expo'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})