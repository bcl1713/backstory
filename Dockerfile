# syntax=docker/dockerfile:1
FROM node:22.23.4-bookworm-slim AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --strict-ssl=true
COPY assets ./assets
COPY scripts/build-assets.mjs ./scripts/build-assets.mjs
RUN npm run build && mkdir /node-libs && cp /usr/lib/*-linux-gnu/libstdc++.so.6 /node-libs/

FROM ghcr.io/astral-sh/uv:0.12.19 AS uv
FROM python:3.14.9-slim-bookworm AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"
WORKDIR /app
COPY --from=uv /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export SSL_CERT_FILE=/run/secrets/proxy_ca; fi; \
    uv sync --frozen --no-dev --no-cache
COPY --from=assets /usr/local/bin/node /usr/local/bin/node
COPY --from=assets /node-libs/ /usr/local/lib/
COPY --from=assets /app/node_modules ./node_modules
COPY . .
COPY --from=assets /app/static ./static
RUN ldconfig && BACKSTORY_WIKI_ROOT=/tmp/backstory-build/wiki \
    BACKSTORY_DATA_DIR=/tmp/backstory-build/data \
    BACKSTORY_IDENTITY_PATH=identity.txt \
    BACKSTORY_IDENTITY_SHA256=0000000000000000000000000000000000000000000000000000000000000000 \
    BACKSTORY_ALLOWED_HOSTS=localhost \
    python manage.py collectstatic --noinput \
    && rm -rf /tmp/backstory-build \
    && groupadd --gid 10001 backstory \
    && useradd --uid 10001 --gid 10001 --no-create-home backstory \
    && mkdir -p /var/lib/backstory \
    && chown backstory:backstory /var/lib/backstory
USER 10001:10001
EXPOSE 8000
CMD ["gunicorn", "backstory.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--timeout", "30", "--access-logfile", "/dev/null"]
