# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Only production deps at runtime (drizzle-kit etc. are dev-only)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
# Built server + client, and the SQL migrations applied on boot
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
