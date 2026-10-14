import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function guestPersistencePlugin(): Plugin {
  return {
    name: 'guest-persistence-api',
    configureServer(server) {
      server.middlewares.use('/api/persist-guest-data', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const { guestImages = {}, overridesMap = {} } = data;

              // Ensure directories exist
              const publicGuestsDir = path.resolve(process.cwd(), 'public/images/guests');
              if (!fs.existsSync(publicGuestsDir)) {
                fs.mkdirSync(publicGuestsDir, { recursive: true });
              }

              const savedImages: Record<string, string> = {};
              for (const [id, dataUrl] of Object.entries(guestImages)) {
                if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
                  const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
                  if (matches) {
                    const rawExt = matches[1].toLowerCase();
                    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt;
                    const base64Data = matches[2];
                    const filename = `${id}.${ext}`;
                    const filePath = path.join(publicGuestsDir, filename);
                    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                    savedImages[id] = `/images/guests/${filename}`;
                  }
                } else if (typeof dataUrl === 'string' && dataUrl.startsWith('/images/')) {
                  savedImages[id] = dataUrl;
                }
              }

              // Sanitize overrides: "Rio Raj" is actor, not actress
              const sanitizedOverrides: Record<string, string> = {};
              for (const [k, v] of Object.entries(overridesMap)) {
                if (typeof v === 'string') {
                  sanitizedOverrides[k] = v.replace(/\bactress\b/gi, 'Actor');
                } else {
                  sanitizedOverrides[k] = String(v);
                }
              }

              const savedConfig = {
                savedImages,
                overridesMap: sanitizedOverrides,
                updatedAt: new Date().toISOString(),
              };

              // Persist to public/saved_guests.json and src/data/savedGuests.json
              fs.writeFileSync(
                path.resolve(process.cwd(), 'public/saved_guests.json'),
                JSON.stringify(savedConfig, null, 2)
              );

              const srcDataDir = path.resolve(process.cwd(), 'src/data');
              if (fs.existsSync(srcDataDir)) {
                fs.writeFileSync(
                  path.join(srcDataDir, 'savedGuests.json'),
                  JSON.stringify(savedConfig, null, 2)
                );
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, savedImages, overridesMap: sanitizedOverrides }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });

      server.middlewares.use('/api/guest-data', (req, res) => {
        const filePath = path.resolve(process.cwd(), 'public/saved_guests.json');
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(content);
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ savedImages: {}, overridesMap: {} }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  const envUrl = (
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_PROJECT_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )?.trim()?.replace(/\/+$/, '');

  const envKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  const defines: Record<string, string> = {};
  if (envUrl) {
    defines['import.meta.env.VITE_SUPABASE_URL'] = JSON.stringify(envUrl);
    defines['import.meta.env.SUPABASE_URL'] = JSON.stringify(envUrl);
  }
  if (envKey) {
    defines['import.meta.env.VITE_SUPABASE_ANON_KEY'] = JSON.stringify(envKey);
    defines['import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY'] = JSON.stringify(envKey);
    defines['import.meta.env.SUPABASE_ANON_KEY'] = JSON.stringify(envKey);
  }

  return {
    plugins: [react(), tailwindcss(), guestPersistencePlugin()],
    define: Object.keys(defines).length > 0 ? defines : undefined,
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
