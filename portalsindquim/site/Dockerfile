FROM node:24.13.0-alpine3.23@sha256:cd6fb7efa6490f039f3471a189214d5f548c11df1ff9e5b181aa49e22c14383e AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild esbuild

COPY . .
ARG PUBLIC_SITE_URL=http://localhost:4421
ARG PUBLIC_DIRECTUS_URL=http://localhost:8155
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL \
    PUBLIC_DIRECTUS_URL=$PUBLIC_DIRECTUS_URL
RUN npm run check && npm run test:docker && npm run build && npm prune --omit=dev && npm cache clean --force

FROM node:24.13.0-alpine3.23@sha256:cd6fb7efa6490f039f3471a189214d5f548c11df1ff9e5b181aa49e22c14383e AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node
EXPOSE 4321
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4321/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "./dist/server/entry.mjs"]
