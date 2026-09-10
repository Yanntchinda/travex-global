// ---------------------------------------------------------------------------
// Serveur statique pour l'aperçu web de production (dist/).
//
//   npx expo export --platform web   # génère dist/
//   node scripts/serve-web.js        # sert dist/ sur le port 8080
//
// Pourquoi ce script ?
//  - Le serveur de dev Expo (Metro) peut planter quand un navigateur mobile
//    s'y connecte (bug « empty path / JSC-safe URL » dans le WebSocket HMR).
//  - Le build de production est statique, 3× plus léger et servi compressé
//    (gzip) : chargement bien plus rapide sur téléphone.
// ---------------------------------------------------------------------------
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 8080;
const ROOT = path.join(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  const started = Date.now();
  res.on('finish', () => {
    // Journal compact : permet de vérifier que les navigateurs atteignent bien le serveur.
    console.log(`${new Date().toISOString().slice(11, 19)} ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - started} ms)`);
  });
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.normalize(path.join(ROOT, urlPath));

    // Sécurité : interdire de sortir de dist/
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    // Répertoire ou racine -> index.html
    if (urlPath === '/' || urlPath.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      // SPA : toute route inconnue renvoie index.html
      filePath = path.join(ROOT, 'index.html');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404).end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const raw = fs.readFileSync(filePath);

    const headers = {
      'Content-Type': type,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    };

    // gzip pour tout ce qui est textuel (JS, CSS, HTML, SVG, JSON…)
    const accept = req.headers['accept-encoding'] || '';
    const compress = /\.(js|css|html|svg|json|map)$/.test(ext) && /\bgzip\b/.test(accept);
    if (compress) {
      const gz = zlib.gzipSync(raw);
      headers['Content-Encoding'] = 'gzip';
      headers['Content-Length'] = gz.length;
      res.writeHead(200, headers);
      res.end(gz);
    } else {
      headers['Content-Length'] = raw.length;
      res.writeHead(200, headers);
      res.end(raw);
    }
  } catch (e) {
    res.writeHead(500).end('Server error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Aperçu web TRAVEX GLOBAL (production) : http://0.0.0.0:${PORT}`);
});
