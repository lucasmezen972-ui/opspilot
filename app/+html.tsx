import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

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
        <link rel="manifest" href="manifest.json" />

        {/* iOS Safari — Add to Home Screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OpsPilot" />
        <link rel="apple-touch-icon" href="icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="icon-192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="favicon.png" />
        <link rel="shortcut icon" href="favicon.png" />

        {/* Disable tap highlight on mobile */}
        <style
          dangerouslySetInnerHTML={{
            __html: `* { -webkit-tap-highlight-color: transparent; }`,
          }}
        />

        <ScrollViewStyleReset />

        {/* Service Worker — path relative to base URL */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  var base = document.querySelector('base');
                  var swPath = (base ? base.href : '') + 'sw.js';
                  navigator.serviceWorker.register(swPath).catch(function() {});
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
