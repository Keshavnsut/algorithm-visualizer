FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY public ./public
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /app/data

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 5000

CMD ["node", "dist/index.js"]
