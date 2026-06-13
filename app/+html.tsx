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

        {/* Disable tap highlight on mobile */}
        <style
          dangerouslySetInnerHTML={{
            __html: `* { -webkit-tap-highlight-color: transparent; }`,
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
