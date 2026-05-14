import { resolve } from 'path';
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    babel({
      babelConfig: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.expo'],
    deps: {
      inline: ['@testing-library/react-native'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      'react-native': 'react-native-web',
      exceljs: resolve(__dirname, 'test/mocks/exceljs.ts'),
      'expo-device': resolve(__dirname, 'test/mocks/expo-device.ts'),
      'expo-notifications': resolve(
        __dirname,
        'test/mocks/expo-notifications.ts',
      ),
    },
  },
});
