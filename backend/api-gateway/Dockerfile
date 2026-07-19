FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY backend/api-gateway ./backend/api-gateway
RUN npm ci --workspace=shared --workspace=backend/api-gateway
RUN npm run build --workspace=backend/api-gateway

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/api-gateway/package.json ./backend/api-gateway/
COPY --from=builder /app/backend/api-gateway/dist ./backend/api-gateway/dist

WORKDIR /app/backend/api-gateway
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
