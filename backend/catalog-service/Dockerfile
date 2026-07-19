FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY backend/catalog-service ./backend/catalog-service
RUN npm ci --workspace=shared --workspace=backend/catalog-service
RUN cd backend/catalog-service && npx prisma generate
RUN npm run build --workspace=backend/catalog-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/catalog-service/package.json ./backend/catalog-service/
COPY --from=builder /app/backend/catalog-service/dist ./backend/catalog-service/dist
COPY --from=builder /app/backend/catalog-service/prisma ./backend/catalog-service/prisma

WORKDIR /app/backend/catalog-service
EXPOSE 4002
CMD ["npm", "run", "start:prod"]
