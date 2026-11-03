# ==============================================================
# DOCKERFILE: Preventive Maintenance System
# Multi-Stage Build untuk Ubuntu 26.04 LTS / Linux (x86_64 / arm64)
# ==============================================================

# --------------------------------------------------------------
# STAGE 1: Dependency Builder
# --------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies jika dibutuhkan modul native
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Install dependensi produksi
RUN npm ci --only=production

# --------------------------------------------------------------
# STAGE 2: Production Runner (Image ringan, aman & non-root)
# --------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    DB_PATH=/app/data/database.sqlite

# Buat folder data untuk database SQLite dan berikan hak akses ke user 'node'
RUN mkdir -p /app/data && chown -R node:node /app

# Salin dependensi terkompilasi dari builder stage
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Salin source code aplikasi
COPY --chown=node:node . .

# Jalankan container dengan user non-root demi keamanan server produksi
USER node

# Expose port aplikasi
EXPOSE 3001

# Healthcheck otomatis setiap 30 detik untuk memastikan container aktif
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Jalankan server Express
CMD ["node", "server.js"]

