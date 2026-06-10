# Story 1.11: Configure nginx for production (static serving + CORS proxy)

Status: ready-for-dev

## Story

As a developer,
I want the nginx configuration for production deployment,
So that the static SPA is served with proper caching headers, SPA routing, and CORS proxy routes for nse-bse-api and Screener.in.

## Acceptance Criteria

1. `nginx/default.conf` exists and serves the static SPA build directory
2. All sub-routes (`/*`) fall back to `index.html` for SPA client-side routing (try_files pattern)
3. `/api/nse-bse/*` requests are proxied to the nse-bse-api backend
4. `/api/screener/*` requests are proxied to Screener.in
5. Static assets with content hashes (`.css`, `.js`, `.svg`, `.png`, etc.) have `Cache-Control: public, max-age=31536000, immutable`
6. Static assets without content hashes (`index.html`, `favicon.svg`, etc.) have `Cache-Control: no-cache`
7. Vite dev config (`vite.config.ts`) mirrors the same proxy routes via `server.proxy`
8. nginx configuration includes security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)

## Tasks / Subtasks

- [ ] Create `nginx/default.conf` with SPA serving configuration (AC: #1, #2)
- [ ] Add proxy routes for `/api/nse-bse/*` and `/api/screener/*` (AC: #3, #4)
- [ ] Configure Cache-Control headers for hashed and non-hashed assets (AC: #5, #6)
- [ ] Add security headers to nginx config (AC: #8)
- [ ] Configure `vite.config.ts` proxy to mirror nginx routes (AC: #7)
- [ ] Verify configuration syntax with `nginx -t`

## Dev Notes

### Architecture Patterns & Constraints

- **Zero-backend mandate:** All computation client-side. No server, no auth, no API keys. [Source: architecture.md#L44-L46]
- **CORS proxy via nginx (production) + Vite server.proxy (dev)** for nse-bse-api and Screener.in. [Source: architecture.md#AR-2]
- **Static SPA** served from build directory, with try_files fallback for client-side routing. [Source: architecture.md#L142-L144]

### Complete nginx Config (`nginx/default.conf`)

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # SPA routing — all non-file, non-api routes fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;

        # Non-hashed assets: no cache
        location = /index.html {
            add_header Cache-Control "no-cache, must-revalidate" always;
        }

        location = /favicon.svg {
            add_header Cache-Control "no-cache, must-revalidate" always;
        }
    }

    # Hashed static assets: long-term cache
    location ~* \.(?:css|js|svg|png|jpg|jpeg|gif|ico|woff2?|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        try_files $uri =404;
    }

    # Proxy: nse-bse-api
    # In production, the nse-bse-api backend is expected to run on the same host
    # or a known internal endpoint. Adjust proxy_pass URL as needed.
    location /api/nse-bse/ {
        proxy_pass https://nse-bse-api.example.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for potentially slow API responses
        proxy_connect_timeout 10s;
        proxy_read_timeout 30s;
    }

    # Proxy: Screener.in
    # Screener.in scraping goes through a server-side proxy to avoid CORS issues.
    # The actual scraping/parsing happens client-side via DOMParser.
    location /api/screener/ {
        proxy_pass https://www.screener.in/;
        proxy_set_header Host www.screener.in;
        proxy_set_header User-Agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Longer timeout for scraping (Screener.in can be slow)
        proxy_connect_timeout 10s;
        proxy_read_timeout 60s;

        # Strip response headers that could cause issues
        proxy_hide_header Set-Cookie;
        proxy_ignore_headers Cache-Control Expires Set-Cookie;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        return 404;
    }

    # gzip compression for all text-based assets
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
    gzip_vary on;
}
```

### Vite Proxy Configuration (`vite.config.ts`)

The Vite development server must mirror the same proxy routes that nginx uses in production:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/nse-bse': {
        target: 'https://nse-bse-api.example.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('nse-bse proxy error:', err.message)
          })
        },
      },
      '/api/screener': {
        target: 'https://www.screener.in',
        changeOrigin: true,
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('screener proxy error:', err.message)
          })
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Content hashes are added automatically by Vite for CSS/JS files
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
      },
    },
  },
})
```

### Cache Header Strategy

| Asset Type | Example | Cache-Control | Rationale |
|---|---|---|---|
| Hashed JS/CSS | `main.a1b2c3d4.js` | `public, max-age=31536000, immutable` | Hash changes on content change — never needs revalidation |
| Hashed fonts/images | `Inter.woff2` | `public, max-age=31536000, immutable` | Same as above |
| index.html | `index.html` | `no-cache, must-revalidate` | Must always check for new service worker or app version |
| favicon.svg | `favicon.svg` | `no-cache, must-revalidate` | Rarely changes, but safe to revalidate |
| API responses | n/a | No cache (proxied) | API responses have their own caching (TTL in Dexie) |

The `.` before the hash extension in the regex (`\.(?:css|js|...)`) ensures only files with actual extensions match — not path segments containing dots.

### SPA try_files Pattern

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This nginx directive:
1. `$uri` — Try the exact path as a file (e.g., `/assets/main.a1b2.js`)
2. `$uri/` — Try the path as a directory (e.g., `/assets/`)
3. `/index.html` — Fall back to `index.html` for all unmatched routes (e.g., `/stocks/RELIANCE`)

This is the standard pattern for SPAs with client-side routing. Without it, navigating to `/stocks/RELIANCE` would return a 404.

### Security Headers

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer header |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter (defense in depth) |

### Acceptance Criteria Verification

| AC | Verification |
|---|---|
| #1-2 | Run `nginx -t` — config syntax OK. Then `curl http://localhost/stocks/RELIANCE` returns index.html content (SPA routing) |
| #3 | `curl http://localhost/api/nse-bse/quote/RELIANCE` proxies to nse-bse-api |
| #4 | `curl http://localhost/api/screener/company/RELIANCE/` proxies to Screener.in |
| #5 | `curl -I http://localhost/assets/main.a1b2.js` returns `Cache-Control: public, max-age=31536000, immutable` |
| #6 | `curl -I http://localhost/index.html` returns `Cache-Control: no-cache, must-revalidate` |
| #7 | Dev server proxy works: `curl http://localhost:5173/api/nse-bse/quote/RELIANCE` returns data |
| #8 | `curl -I http://localhost/` returns security headers |

### Docker / Deployment Notes

When deploying with Docker, the nginx config is typically copied into a Docker image:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The `server_name _;` directive catches all hostnames, making the config portable across environments.

### Differences Between Dev and Production Proxies

| Aspect | Vite Dev (server.proxy) | nginx Production |
|---|---|---|
| Target | Direct to nse-bse-api / Screener.in | Same |
| CORS handled by | Vite proxy (no browser CORS) | nginx proxy (no browser CORS) |
| Caching | None (dev) | Browsers cache assets |
| SSL termination | Vite dev server | nginx (or reverse proxy in front) |
| Asset serving | Vite dev server (HMR) | nginx (static files) |

Both proxies forward requests server-to-server, avoiding browser CORS restrictions entirely. The `/api/*` prefix is stripped by the proxy (not sent to the upstream).

### References

- [Source: epics-and-stories.md#L383-L398] — Story 1.11 acceptance criteria
- [Source: architecture.md#L142-L144] — CORS proxy decision
- [Source: architecture.md#L243-L371] — Project structure (nginx/ directory)
- [Source: 1-1-scaffold-vite-project-and-install-dependencies.md#L76] — nginx placeholder file

## Dev Agent Record

### Agent Model Used

BMad Create-Story workflow (v6.8.1-next.4)

### Debug Log References

### Completion Notes List

### File List
