FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY shared ./shared
COPY frontend ./frontend
RUN npm ci --workspace=shared --workspace=frontend
RUN npm run build --workspace=frontend

FROM nginx:alpine
# Copiamos la compilación generada por Vite
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# Copiamos una configuración de Nginx básica si la hubiese (opcional)
COPY --from=builder /app/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
