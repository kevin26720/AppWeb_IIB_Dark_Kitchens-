FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY backend/auth-service ./backend/auth-service
RUN npm ci --workspace=shared --workspace=backend/auth-service
RUN cd backend/auth-service && npx prisma generate
RUN npm run build --workspace=backend/auth-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/auth-service/package.json ./backend/auth-service/
COPY --from=builder /app/backend/auth-service/dist ./backend/auth-service/dist
COPY --from=builder /app/backend/auth-service/prisma ./backend/auth-service/prisma

WORKDIR /app/backend/auth-service
EXPOSE 4001
CMD ["npm", "run", "start:prod"]
