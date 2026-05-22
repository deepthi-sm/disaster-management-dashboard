# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /fe
COPY dmd-frontend/package*.json ./
RUN npm ci
COPY dmd-frontend/ ./
# vite.config.js sets outDir to ../frontend (great for local dev, but that would
# escape this build context). Override to a local dist/ so the output stays here.
RUN npm run build -- --outDir dist --emptyOutDir

# ---- Stage 2: node runtime serving API + built frontend ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
# Drop in the compiled SPA; server.js serves it from STATIC_DIR.
COPY --from=frontend-build /fe/dist ./frontend
ENV STATIC_DIR=/app/frontend
EXPOSE 3001
CMD ["node", "server.js"]
