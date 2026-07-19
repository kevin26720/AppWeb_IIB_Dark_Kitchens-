FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY backend/chat-service ./backend/chat-service
RUN npm ci --workspace=shared --workspace=backend/chat-service
RUN cd backend/chat-service && npx prisma generate
RUN npm run build --workspace=backend/chat-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/chat-service/package.json ./backend/chat-service/
COPY --from=builder /app/backend/chat-service/node_modules ./backend/chat-service/node_modules
COPY --from=builder /app/backend/chat-service/dist ./backend/chat-service/dist
COPY --from=builder /app/backend/chat-service/prisma ./backend/chat-service/prisma

WORKDIR /app/backend/chat-service
EXPOSE 4004
EXPOSE 4005
CMD ["npm", "run", "start:prod"]
