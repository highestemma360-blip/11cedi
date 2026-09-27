FROM node:20-alpine AS ui
ENV NODE_ENV=development
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm install --include=dev --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt
COPY backend/ ./
COPY --from=ui /ui/dist ./dist
RUN mkdir -p /app/data /app/uploads /var/data /var/data/uploads \
 && printf '%s\n' '#!/bin/sh' \
  'set -e' \
  'mkdir -p /var/data/uploads /app/data' \
  '# One-time migrate from ephemeral paths onto the persistent disk when empty' \
  'if [ -d /var/data ]; then' \
  '  if [ ! -f /var/data/cedigain.db ] && [ -f /app/cedigain.db ]; then cp -n /app/cedigain.db /var/data/cedigain.db || true; fi' \
  '  if [ ! -f /var/data/cedigain.db ] && [ -f /app/data/cedigain.db ]; then cp -n /app/data/cedigain.db /var/data/cedigain.db || true; fi' \
  'fi' \
  'export DATABASE_URL="${DATABASE_URL:-sqlite:////var/data/cedigain.db}"' \
  'export UPLOAD_DIR="${UPLOAD_DIR:-/var/data/uploads}"' \
  'exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}' \
  > /app/entrypoint.sh \
 && chmod +x /app/entrypoint.sh
EXPOSE 8000
CMD ["/app/entrypoint.sh"]
