import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Injected at build time from app.json experiments.baseUrl ("/opspilot" on GitHub Pages)
const BASE = process.env.EXPO_BASE_URL ?? '';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <title>OpsPilot</title>
        <meta name="description" content="Gestion des opérations terrain" />

        {/* PWA */}
        <meta name="theme-color" content="#2563EB" />
        <link rel="manifest" href={`${BASE}/manifest.json`} />

        {/* iOS Safari — Add to Home Screen */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OpsPilot" />
        <link rel="apple-touch-icon" href={`${BASE}/icon-192.png`} />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${BASE}/icon-192.png`}
        />

        {/* Favicon */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${BASE}/favicon.png`}
        />
        <link rel="shortcut icon" href={`${BASE}/favicon.png`} />
        <link rel="icon" type="image/svg+xml" href={`${BASE}/brand-mark.svg`} />
        <link
          rel="preload"
          href={`${BASE}/fonts/InstrumentSans-Variable.6cc0b916.woff2`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Disable tap highlight on mobile */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'OpsPilot Sans';
                src: url('${BASE}/fonts/InstrumentSans-Variable.6cc0b916.woff2') format('woff2');
                font-style: normal;
                font-weight: 400 700;
                font-display: swap;
              }
              body, input, textarea, select,
              [dir="auto"]:not([style*="font-family:"]) {
                font-family: 'OpsPilot Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
                font-synthesis: none;
              }
              input, textarea { font-variant-numeric: tabular-nums; }
              * { -webkit-tap-highlight-color: transparent; }
              :where(a, button, [role="button"], [role="link"], [role="tab"]):not([aria-disabled="true"]):not(:disabled) {
                cursor: pointer;
              }
              @media (hover: hover) {
                :where(a, button, [role="button"], [role="link"], [role="tab"]):not([aria-disabled="true"]):not(:disabled):hover {
                  filter: brightness(0.96);
                }
              }
              :where(button:disabled, [aria-disabled="true"]:not(input):not(textarea):not(select):not([role="radio"]):not([role="checkbox"])) {
                background-color: #E2E8F0 !important;
                border: 1px solid #94A3B8 !important;
                box-shadow: none !important;
                opacity: 1 !important;
                color: #475569 !important;
                cursor: not-allowed !important;
              }
              :where(button:disabled, [aria-disabled="true"]:not(input):not(textarea):not(select):not([role="radio"]):not([role="checkbox"])) [dir="auto"] {
                color: #475569 !important;
              }
              :where(button, [role="button"])[aria-busy="true"] { cursor: wait !important; }
              :where(a, button, input, textarea, select, [tabindex], [role="button"], [role="tab"]):focus-visible {
                outline: 3px solid #2563EB !important;
                outline-offset: 3px;
              }
              .opspilot-skip-link { position: absolute; left: 244px; top: -100px; z-index: 10000; padding: 12px 16px; border-radius: 8px; background: #FFFFFF; color: #172554; font: 600 15px system-ui; }
              .opspilot-skip-link:focus { top: 12px; }
              @media (max-width: 1023px) { .opspilot-skip-link { left: 16px; } }
              @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after {
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                  scroll-behavior: auto !important;
                }
              }
            `,
          }}
        />

        <ScrollViewStyleReset />

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onerror = function(message, source, lineno, colno, error) {
                console.error('[window.onerror]', message, source, lineno, colno, error && (error.stack || error.message || error));
              };
              window.onunhandledrejection = function(event) {
                var reason = event && event.reason;
                console.error('[window.onunhandledrejection]', reason && (reason.stack || reason.message || reason));
              };
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('${BASE}/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
