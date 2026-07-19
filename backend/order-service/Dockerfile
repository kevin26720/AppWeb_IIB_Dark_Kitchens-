FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY backend/order-service ./backend/order-service
RUN npm ci --workspace=shared --workspace=backend/order-service
RUN cd backend/order-service && npx prisma generate
RUN npm run build --workspace=backend/order-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/order-service/package.json ./backend/order-service/
COPY --from=builder /app/backend/order-service/node_modules ./backend/order-service/node_modules
COPY --from=builder /app/backend/order-service/dist ./backend/order-service/dist
COPY --from=builder /app/backend/order-service/prisma ./backend/order-service/prisma

WORKDIR /app/backend/order-service
EXPOSE 4003
CMD ["npm", "run", "start:prod"]
