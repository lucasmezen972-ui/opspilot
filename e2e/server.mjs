// Serveur statique déterministe pour les E2E — reproduit GitHub Pages :
//  - répertoire → redirection vers slash final puis index.html ;
//  - URL .html → 301 vers l'URL sans extension (cleanUrls) ;
//  - URL sans extension → fichier.html s'il existe ;
//  - sinon → fallback SPA (index.html racine).
// Remplace `serve --single`, dont les réécritures rendaient le back-office
// /admin/ inatteignable dans les tests.
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const root = normalize(process.argv[2] ?? '.playwright-site');
const port = Number(process.argv[3] ?? 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

async function statSafe(p) {
  try {
    return await stat(p);
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathName = decodeURIComponent(url.pathname);
  const fsPath = normalize(join(root, pathName));
  if (!fsPath.startsWith(root + sep) && fsPath !== root) {
    res.writeHead(403).end('forbidden');
    return;
  }

  const redirect = (to) =>
    res.writeHead(301, { Location: to + url.search }).end();
  const send = async (file) => {
    const body = await readFile(file);
    res
      .writeHead(200, {
        'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      })
      .end(body);
  };

  // cleanUrls : /page.html → /page
  if (pathName.endsWith('.html') && pathName !== '/index.html') {
    redirect(pathName.slice(0, -'.html'.length).replace(/\/index$/, '/'));
    return;
  }

  const s = await statSafe(fsPath);
  if (s?.isDirectory()) {
    if (!pathName.endsWith('/')) {
      redirect(pathName + '/');
      return;
    }
    const idx = join(fsPath, 'index.html');
    if (await statSafe(idx)) {
      await send(idx);
      return;
    }
  } else if (s?.isFile()) {
    await send(fsPath);
    return;
  }

  // URL sans extension → fichier .html correspondant (export statique)
  if (!extname(pathName)) {
    const htmlPath = fsPath + '.html';
    if ((await statSafe(htmlPath))?.isFile()) {
      await send(htmlPath);
      return;
    }
    // fallback SPA
    await send(join(root, 'index.html'));
    return;
  }

  res.writeHead(404).end('not found');
}).listen(port, () => {
  console.log(`e2e static server: http://localhost:${port} (${root})`);
});
