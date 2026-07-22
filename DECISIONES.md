# 🏗️ ESPECIFICACIÓN DE ARQUITECTURA Y REQUISITOS: MICROSERVICIOS DESDE CERO
**Proyecto:** Catering PYME (Fase III - Desarrollo Greenfield)

Este documento sirve como la **única fuente de verdad** (Single Source of Truth) para diseñar e implementar la aplicación de Catering y Gestión de Pedidos ("Dark Kitchens") utilizando una arquitectura de microservicios desde cero. Está diseñado para que cualquier agente de desarrollo de software o programador sin contexto del monolito original pueda construir la aplicación en su totalidad.

---

## 🎯 1. Dominio y Alcance del Sistema

La aplicación es una plataforma para la gestión de catering (Dark Kitchens) orientada a PYMEs y clientes finales. Ofrece:
1. **Autenticación y Perfilería segura (Roles: ADMIN y CLIENT).**
2. **Catálogo de Productos** (platos, bebidas, menús) con búsquedas, filtrado y paginación.
3. **Gestión de Pedidos (Órdenes):** Creación, seguimiento y actualización del estado de entrega.
4. **Chat en Tiempo Real:** Soporte interactivo entre clientes y administradores con persistencia en base de datos.
5. **Auditoría de Seguridad:** Loggear todas las operaciones sensibles (altas, bajas, accesos incorrectos).

---

## 👥 2. Roles de Usuario y Flujos de Trabajo (Contexto de Negocio)

Para que el agente comprenda el comportamiento funcional de la aplicación, los flujos de negocio principales se estructuran de la siguiente manera:

### A. Flujo del Cliente (CLIENT)
1. **Registro e Ingreso:** El cliente se registra proporcionando su correo y contraseña. El sistema envía de forma asíncrona un correo de verificación (mediante SMTP/Resend) con un token único. El usuario no puede iniciar sesión hasta haber hecho clic en el enlace de su correo. Si olvida su contraseña, ingresa su email para recibir un enlace de recuperación con un token de 30 minutos.
2. **Exploración:** Navega por el catálogo de productos, filtra por categorías (ej. "Entradas", "Platos Fuertes", "Bebidas") y busca por texto. Solo puede ver productos con la marca `available: true`.
3. **Carrito y Pedido:** Añade productos a su carrito (estado local de Zustand en el frontend). Al confirmar, crea un pedido ingresando notas especiales (ej. "sin cebolla"). El pedido inicia con estado `PENDING`.
4. **Soporte y Chat:** Si tiene dudas sobre su pedido, abre la ventana de chat de soporte. El cliente entra a una sala exclusiva para su conversación (`room_client_<userId>`) y puede enviar mensajes que quedan guardados históricamente.

### B. Flujo del Administrador (ADMIN)
1. **Gestión de Menú (Catálogo):** Puede agregar nuevos productos (con nombre, precio, descripción, imagen y categoría), editarlos o eliminarlos. Estos cambios disparan eventos asíncronos de auditoría.
2. **Control de Pedidos:** Visualiza una lista maestra de todos los pedidos realizados en el sistema. Puede actualizar el estado de los pedidos siguiendo este flujo de estados:
   $$\text{PENDING} \rightarrow \text{CONFIRMED} \rightarrow \text{PREPARING} \rightarrow \text{READY} \rightarrow \text{DELIVERED}$$
   *(o cambiarlo a $\text{CANCELLED}$ si ocurre un problema).*
3. **Atención a Clientes:** Accede a una consola de chat donde ve la lista de todas las salas de chat activas de los clientes (`GET /api/messages/user/conversations`). El administrador puede seleccionar cualquier sala de la lista, unirse a ella y responder directamente al cliente correspondiente.

### C. Ciclo de Vida del Pedido (Consistencia y Precios Históricos)
* Cuando se procesa un pedido (`POST /api/orders` en `order-service`):
  1. El servicio de órdenes llama síncronamente al servicio de catálogo (`catalog-service`) para verificar la existencia del producto y validar que el precio enviado coincide con el precio real.
  2. Si el precio cambia o el producto no está disponible, el pedido se rechaza.
  3. En la base de datos de órdenes (`OrderItem`), se guarda una **copia histórica** del `productName` y el `price` de compra en ese momento. Esto evita que cambios futuros en el menú alteren los reportes financieros e históricos del cliente y del administrador.

### D. Datos de Prueba Iniciales (Seeds)
Para validar el sistema tras su despliegue, el script de seed de las bases de datos debe crear obligatoriamente:
* **Usuarios Demo:**
  * **Administrador:** `admin@catering.com` / contraseña `Admin123!` (Rol: `ADMIN`).
  * **Cliente de Prueba:** `cliente@example.com` / contraseña `Client123!` (Rol: `CLIENT`).
* **Productos Demo:**
  * Al menos 5 productos en el catálogo inicial (ej. "Menú Ejecutivo de Asado", "Ensalada César", "Jugo Natural de Maracuyá"), con precios variados y categorías definidas.

---

## 🛠️ 3. Stack Tecnológico Seleccionado

* **Frontend:** React + Zustand (Gestión de estado) + Socket.io-client.
* **Backend:** NestJS (TypeScript).
* **ORM:** Prisma ORM.
* **Base de Datos:** PostgreSQL (base de datos independiente por servicio).
* **API Gateway:** Servidor NestJS (o Express) como proxy reverso o Nginx.
* **Message Broker / Real-time:** Redis (Pub/Sub para comunicación asíncrona interservicio y Adapter para Socket.IO).
* **Contenedores:** Docker & Docker Compose para empaquetado de servicios y bases de datos.

---

## 🎨 4. Patrones de Diseño de Microservicios Seleccionados

Para garantizar que el sistema sea escalable, resiliente y fácil de mantener, implementaremos los siguientes tres patrones de diseño:

### 1. API Gateway (Puerta de Enlace de API)
* **Propósito:** Actúa como el único punto de entrada para el frontend React. Resuelve los problemas de CORS y evita exponer los puertos internos de los microservicios al exterior.
* **Implementación:** Un microservicio ligero en NestJS (o Express) (`apps/api-gateway`) que intercepta todas las solicitudes, valida el JWT token de forma centralizada y enruta los requests a los microservicios internos (`auth`, `catalog`, `order`, `chat`) basándose en la URL.

### 2. Database per Service (Base de Datos por Servicio)
* **Propósito:** Asegura que los microservicios estén desacoplados a nivel de datos. Un cambio de esquema o una caída en la base de datos de un servicio (ej. chat) no afectará a los demás (ej. órdenes).
* **Implementación:** Cada servicio backend tiene su propia base de datos PostgreSQL y su propio archivo de configuración de Prisma (`schema.prisma`). Las consultas y transacciones distribuidas se coordinan a nivel de código y mediante eventos, nunca compartiendo la base de datos de forma directa.

### 3. Circuit Breaker (Disyuntor)
* **Propósito:** Previene fallos en cascada. Si el `order-service` necesita llamar síncronamente al `catalog-service` para verificar precios y el servicio de catálogo está lento o fuera de servicio, el disyuntor se activa (se abre) y devuelve inmediatamente un error controlado o datos en caché en lugar de colgar el servicio de órdenes consumiendo hilos y memoria.
* **Implementación:** Utilizaremos la librería `opossum` en las llamadas HTTP internas del `order-service` hacia el `catalog-service`. Cuando el disyuntor esté abierto, el usuario recibirá una respuesta rápida indicando que el catálogo no está disponible temporalmente.

---

## 📂 5. Estructura del Proyecto (Monorepo)

Se implementará utilizando **npm workspaces** en la raíz para compartir dependencias y tipos.
La estructura separa claramente el frontend, el backend y el código compartido.

```text
/dark-kitchens-app
├── package.json                        # Workspaces root (npm workspaces)
├── docker-compose.yml                  # Orquestación de toda la infraestructura local
├── DECISIONES.md                       # Este documento de referencia
│
├── frontend/                           # Aplicación React (Vite + Zustand + Socket.io-client)
│   ├── src/
│   │   ├── pages/                      # Vistas principales (Login, Dashboard, Chat, Órdenes)
│   │   ├── components/                 # Componentes reutilizables
│   │   ├── store/                      # Zustand stores (authStore, cartStore, etc.)
│   │   └── api/                        # Axios instances + Socket.IO client
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── api-gateway/                    # NestJS: Punto de entrada único, valida JWT y enruta
│   │   ├── src/
│   │   └── package.json
│   ├── auth-service/                   # NestJS: Registro, Login, Recuperación, AuditLog
│   │   ├── src/
│   │   ├── prisma/
│   │   │   └── schema.prisma           # Modelos: User, AuditLog
│   │   └── package.json
│   ├── catalog-service/                # NestJS: CRUD de Productos y Categorías
│   │   ├── src/
│   │   ├── prisma/
│   │   │   └── schema.prisma           # Modelo: Product
│   │   └── package.json
│   ├── order-service/                  # NestJS: Gestión de Órdenes y sus Items
│   │   ├── src/
│   │   ├── prisma/
│   │   │   └── schema.prisma           # Modelos: Order, OrderItem
│   │   └── package.json
│   └── chat-service/                   # NestJS: Socket.IO, mensajes persistentes
│       ├── src/
│       ├── prisma/
│       │   └── schema.prisma           # Modelo: Message
│       └── package.json
│
└── shared/                             # Código TypeScript compartido entre servicios
    ├── types/                          # DTOs, Enums e interfaces (User, OrderStatus, etc.)
    └── package.json
```

---

## 🗄️ 6. Base de Datos por Servicio (Database-per-Service)

Cada microservicio gestiona su propio esquema de base de datos. **No hay llaves foráneas físicas a nivel de base de datos entre distintos microservicios.** La consistencia e identidad se maneja mediante identificadores lógicos.

### A. Auth Service (`auth-db`)
Almacena las credenciales de usuarios y los logs de auditoría generales del sistema.

```prisma
// apps/auth-service/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // Contraseña encriptada con bcryptjs (12 rounds)
  name      String
  role              Role     @default(CLIENT)
  isVerified        Boolean  @default(false)
  verificationToken String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([email])
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?     // Referencia lógica
  action    String   // "LOGIN_SUCCESS", "REGISTER", "PASSWORD_RESET", etc.
  resource  String   // "User", "Product", "Order"
  details   String?  // Formato JSON String
  ipAddress String?
  status    String   // "SUCCESS", "FAILURE"
  createdAt DateTime @default(now())

  @@index([action])
  @@index([createdAt])
}

enum Role {
  ADMIN
  CLIENT
}
```

### B. Catalog Service (`catalog-db`)
Almacena el menú de catering ofrecido a los clientes.

```prisma
// apps/catalog-service/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  category    String
  imageUrl    String?
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([available])
}
```

### C. Order Service (`order-db`)
Gestiona el carrito y los pedidos. Almacena las relaciones lógicas de productos y clientes.

```prisma
// apps/order-service/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Order {
  id        Int         @id @default(autoincrement())
  userId    Int         // Referencia lógica (sin constraint FK física)
  status    OrderStatus @default(PENDING)
  total     Decimal     @db.Decimal(12, 2)
  notes     String?
  items     OrderItem[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id          Int      @id @default(autoincrement())
  orderId     Int
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   Int      // Referencia lógica (sin constraint FK física)
  productName String   // Copia histórica para reportes
  quantity    Int
  price       Decimal  @db.Decimal(10, 2)
  subtotal    Decimal  @db.Decimal(12, 2)
  createdAt   DateTime @default(now())

  @@index([orderId])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERED
  CANCELLED
}
```

### D. Chat Service (`chat-db`)
Persistencia del historial de chat.

```prisma
// apps/chat-service/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Message {
  id        Int      @id @default(autoincrement())
  content   String
  userId    Int      // Referencia lógica del emisor
  room      String   @default("general") // Canal de soporte
  createdAt DateTime @default(now())

  @@index([room])
  @@index([createdAt])
}
```

---

## 🔒 7. Flujo de Autenticación y API Gateway

Para evitar que todos los microservicios verifiquen y parseen la base de datos de usuarios constantemente, la validación se delega al **API Gateway**:

1. **Cliente a Gateway:** El frontend hace un request enviando el header: `Authorization: Bearer <TOKEN>`.
2. **Gateway valida:** El Gateway intercepta el request, valida la firma del JWT (usando una firma JWT compartida) y decodifica el token.
3. **Gateway decora el request:** El Gateway redirige la llamada al microservicio correspondiente, inyectando cabeceras HTTP específicas para asegurar el contexto:
   - `X-User-Id`: El ID numérico del usuario.
   - `X-User-Role`: El rol del usuario (`CLIENT` o `ADMIN`).
4. **Microservicio interno confía:** El microservicio interno recibe la llamada del Gateway e implementa los controles de autorización correspondientes basados directamente en los headers `X-User-Id` y `X-User-Role`.

---

## 🌐 8. Contrato de API Endpoints

El API Gateway escucha en el puerto central **`4000`** localmente y distribuye el tráfico.

### 🔐 A. Auth Service (Puerto Interno `4001`)
Ruta pública del gateway: `/api/auth/*`

* **`POST /api/auth/register`** (Público)
  * *Request Body:* `{ "email": "x@x.com", "password": "Strong123!", "name": "Nombre" }`
  * *Comportamiento:* Valida contraseñas fuertes (8+ caracteres, número, minúscula, mayúscula y carácter especial). Genera un token, envía el correo de verificación vía SMTP y retorna el usuario creado con `token: ''` (pendiente de verificación).
* **`POST /api/auth/verify-email`** (Público)
  * *Request Body:* `{ "token": "UUID_TOKEN" }`
  * *Comportamiento:* Valida el token, marca al usuario como `isVerified: true` y elimina el token de verificación.
* **`POST /api/auth/login`** (Público)
  * *Request Body:* `{ "email": "x@x.com", "password": "Strong123!" }`
  * *Response:* `{ "token": "JWT_TOKEN", "user": { "id", "email", "name", "role" } }`
* **`GET /api/auth/profile`** (Privado)
  * *Comportamiento:* Utiliza la identidad del header `X-User-Id` provisto por el Gateway para retornar el objeto usuario actual (sin password).
* **`POST /api/auth/change-password`** (Privado)
  * *Request Body:* `{ "oldPassword": "x", "newPassword": "y" }`
* **`POST /api/auth/forgot-password`** (Público)
  * *Request Body:* `{ "email": "x@x.com" }`
  * *Comportamiento:* Genera un JWT de corta duración (30 min) y envía un correo (SMTP a través de nodemailer) con el enlace de restauración.
* **`POST /api/auth/reset-password`** (Público)
  * *Request Body:* `{ "token": "JWT_SHORT_TOKEN", "newPassword": "y" }`

### 📦 B. Catalog Service (Puerto Interno `4002`)
Ruta pública del gateway: `/api/products/*`

* **`GET /api/products`** (Público)
  * *Query params:* `limit` (default 10), `offset` (default 0), `category` (opcional), `available` (opcional).
* **`GET /api/products/:id`** (Público)
* **`GET /api/products/search`** (Público)
  * *Query params:* `q` (texto a buscar en nombre o descripción).
* **`GET /api/products/categories/list`** (Público)
* **`POST /api/products`** (Sólo ADMIN)
  * *Request Body:* `{ "name", "description", "price", "category", "imageUrl", "available" }`
* **`PUT /api/products/:id`** (Sólo ADMIN)
* **`DELETE /api/products/:id`** (Sólo ADMIN)

### 🛒 C. Order Service (Puerto Interno `4003`)
Ruta pública del gateway: `/api/orders/*`

* **`POST /api/orders`** (Privado - Clientes)
  * *Request Body:*
    ```json
    {
      "items": [
        { "productId": 1, "productName": "Nombre Plato", "quantity": 2, "price": 15.50 }
      ],
      "total": 31.00,
      "notes": "Sin cebolla"
    }
    ```
* **`GET /api/orders/my-orders`** (Privado - Clientes)
  * *Comportamiento:* Retorna los pedidos filtrados por el `X-User-Id` del cliente.
* **`GET /api/orders/:orderId`** (Privado - Propietario de la orden o ADMIN)
* **`PUT /api/orders/:orderId/status`** (Privado - ADMIN)
  * *Request Body:* `{ "status": "CONFIRMED" }` (Estados válidos: `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`)
* **`GET /api/orders`** (Sólo ADMIN)
  * *Comportamiento:* Retorna todos los pedidos registrados en el sistema.

### 💬 D. Chat Service (Puerto Interno `4004` HTTP / `4005` WebSockets)
Ruta pública del gateway para API fallback: `/api/messages/*`

El Chat opera mediante WebSockets (Socket.IO). La autenticación del socket se realiza validando el JWT del cliente durante la conexión inicial (`connection handshake`).

#### Eventos WebSocket:
* **Cliente $\rightarrow$ Servidor:**
  * `chat:join-room` $\rightarrow$ Payload: `{ "room": "room_name" }`
  * `chat:leave-room` $\rightarrow$ Payload: `{ "room": "room_name" }`
  * `chat:message` $\rightarrow$ Payload: `{ "content": "Hola", "room": "room_name" }` (Guarda en Base de Datos y difunde al room).
  * `chat:typing` $\rightarrow$ Payload: `{ "room": "room_name" }`
  * `chat:stop-typing` $\rightarrow$ Payload: `{ "room": "room_name" }`
* **Servidor $\rightarrow$ Cliente:**
  * `chat:message` $\rightarrow$ Emite el mensaje recibido.
  * `chat:history` $\rightarrow$ Envía los últimos 50 mensajes de la sala al entrar.
  * `chat:user-joined` $\rightarrow$ Notifica entrada de usuario.
  * `chat:user-left` $\rightarrow$ Notifica salida de usuario.
  * `chat:user-typing` $\rightarrow$ Notifica quién está escribiendo.

#### Endpoints REST (Fallback):
* **`GET /api/messages`** (Privado) - Mensajes recientes del usuario.
* **`GET /api/messages/:room`** (Privado) - Mensajes de una sala de soporte.
* **`POST /api/messages`** (Privado) - Guardar mensaje manualmente.
* **`GET /api/messages/user/conversations`** (Sólo ADMIN) - Lista salas activas para soporte técnico.

---

## 📢 9. Comunicación entre Microservicios

### 1. HTTP Síncrono
Para peticiones puntuales e inmediatas. Ejemplo:
* El `order-service` necesita asegurar que los precios de los ítems son correctos $\rightarrow$ Hace una consulta HTTP `GET /api/products/:id` interna al `catalog-service` antes de persistir la orden.

### 2. Eventos Asíncronos (Redis Pub/Sub)
Para operaciones no bloqueantes y desacopladas:
* **Auditoría:** Cada vez que ocurra un evento crítico en cualquier servicio (ej: Login, OrderCreated, ProductCreated), el microservicio publica un evento en Redis con el canal `audit-log-events`. El `auth-service` (donde reside el modelo de Auditoría) escucha este canal y guarda el log de forma asíncrona.
* **Notificaciones de Pedidos:** Al actualizar un pedido en `order-service` a `READY` o `CANCELLED`, se envía un mensaje a Redis. El `chat-service` lo escucha y emite una alerta WebSocket en tiempo real al cliente final de manera transparente.

---

## 🐳 10. Configuración e Infraestructura con Docker

Se debe proveer un archivo `docker-compose.yml` en la raíz que unifique los contenedores:

1. **`db-auth`**, **`db-catalog`**, **`db-orders`**, **`db-chat`**: Contenedores PostgreSQL expuestos en puertos internos diferentes.
2. **`redis-broker`**: Contenedor Redis básico para bus de eventos y adaptadores socket.
3. **`api-gateway`**: Expuesto en el puerto host `4000`.
4. **Microservicios backend**: Corriendo internamente en la red de docker sin exponer sus puertos al exterior de forma directa.
5. **`frontend`**: Servidor de desarrollo Vite expuesto en puerto host `5173`.

---

## 🔐 11. Consideraciones de Seguridad del Sistema

Para garantizar la integridad, confidencialidad y resiliencia del sistema distribuido, se implementarán los siguientes controles de seguridad de nivel de producción:

### 1. JSON Web Tokens (JWT) y Gestión de Sesión
* **Esquema de Firma:** 
  * Para desarrollo inicial, se utilizará firma simétrica **HS256** con una clave secreta (`JWT_SECRET`) de al menos 32 caracteres alfanuméricos.
  * Para entornos de producción, se recomienda migrar a firma asimétrica **RS256** (donde `auth-service` firma usando una llave privada y el `api-gateway` valida usando la llave pública correspondiente).
* **Estrategia de Tokens de Corta/Larga Duración:**
  * **Access Token:** Corta duración (15 minutos), transmitido en el header `Authorization: Bearer <token>`.
  * **Refresh Token:** Larga duración (7 días), guardado en la base de datos de usuarios y enviado al cliente exclusivamente en una cookie **HttpOnly, Secure y SameSite=Strict** para mitigar ataques XSS y Cross-Site Request Forgery (CSRF).
* **Flujo de Refresco:** Cuando el access token expira, el cliente llama a `POST /api/auth/refresh` enviando la cookie segura para obtener un nuevo access token.

### 2. Integración de OAuth 2.0 y OpenID Connect (OIDC)
* **Arquitectura de Autenticación Externa:** Para permitir el inicio de sesión con proveedores de identidad (como Google o GitHub):
  1. El frontend inicia el flujo redirigiendo a la pantalla de consentimiento del proveedor externo.
  2. El proveedor externo redirecciona al API Gateway con un `authorization code`.
  3. El API Gateway redirige esta petición al `auth-service`.
  4. El `auth-service` realiza la petición en segundo plano al proveedor externo para intercambiar el código por el `Id Token` / `Access Token`.
  5. El `auth-service` valida la información (verificando la firma de las llaves públicas del proveedor), crea el registro del usuario local si no existe y genera el JWT interno final de la aplicación.

### 3. Red Interna de Sockets y Microservicios (Zero Trust)
* **Aislamiento de Puertos:** En el archivo `docker-compose.yml`, los servicios `auth`, `catalog`, `orders` y `chat` no tendrán configurada la directiva `ports` externa. Únicamente el `api-gateway` y el `frontend` estarán expuestos al host.
* **Firewalling / Redes Docker:** Todos los servicios compartirán una red privada virtual de Docker (`backend-network`).
* **Verificación de Origen:** Los microservicios internos validarán opcionalmente que las peticiones entrantes provengan del rango de IPs del Gateway interno, denegando llamadas directas no autorizadas.

### 4. Control de Tasa (Rate Limiting) y DDoS Protection
* **Rate Limiter en Gateway:** Se configurará el middleware global `@nestjs/throttler` (o equivalente) en el `api-gateway` para evitar ataques de fuerza bruta y denegación de servicio (DoS).
* **Límites Configurables:**
  * Rutas críticas (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`): Máximo 5 peticiones por minuto por dirección IP.
  * Rutas de consulta generales (`/api/products`, `/api/orders`): Máximo 100 peticiones por minuto por dirección IP.

### 5. Encabezados de Seguridad (Helmet) y CORS
* **Políticas CORS Strict:** El API Gateway tendrá habilitado CORS configurado explícitamente para permitir únicamente peticiones procedentes del dominio del `frontend` (ej. `http://localhost:5173` en desarrollo). Los microservicios internos no requieren configurar CORS.
* **Helmet.js:** Se aplicará el paquete `helmet` en el API Gateway para inyectar cabeceras HTTP estándar de protección, tales como `X-Frame-Options: DENY` (evita Clickjacking) e inhabilitar la cabecera `X-Powered-By`.

### 6. Sanitización y Validación Estricta de Datos (ValidationPipe)
* **Filtros globales en NestJS:** Se habilitará un validador de datos estricto en cada microservicio usando `class-validator` y `class-transformer`:
  ```typescript
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Remueve cualquier propiedad en el body que no esté definida en el DTO
    forbidNonWhitelisted: true, // Lanza un error HTTP 400 si el cliente envía propiedades no declaradas
    transform: true,            // Convierte automáticamente tipos de datos en la entrada (ej. strings a números en Query params)
  }));
  ```

---

## 🚀 12. Estrategia de DevOps y CI/CD (GitHub Actions)

Para automatizar la verificación de código, pruebas y despliegue del monorepo distribuido, se implementará un pipeline de **CI/CD** usando **GitHub Actions**.

### 1. Pipeline de Integración Continua (CI)
El workflow se ejecuta ante cualquier `Pull Request` hacia la rama `main` o `develop`, y en cada `Push` a `develop`.

```yaml
# .github/workflows/ci.yml
name: Integración Continua (CI)

on:
  push:
    branches: [develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm' # Habilita caché automático de node_modules

      - name: Instalar dependencias globales del Monorepo
        run: npm ci

      - name: Generar Clientes Prisma
        run: |
          npm run prisma:generate --workspace=backend/auth-service
          npm run prisma:generate --workspace=backend/catalog-service
          npm run prisma:generate --workspace=backend/order-service
          npm run prisma:generate --workspace=backend/chat-service

      - name: Linter y Formato
        run: |
          npm run lint
          npm run format:check

      - name: Chequeo de Tipos (TypeScript Compile)
        run: npm run typecheck

      - name: Ejecutar Pruebas Unitarias y de Integración
        run: npm test
```

### 2. Pipeline de Despliegue Continuo (CD) y Construcción Optimizada
Para optimizar el uso de recursos y evitar reconstruir imágenes de Docker innecesariamente, se implementará un **Filtro de Rutas** (`dorny/paths-filter`). Así, solo se compilará y subirá la imagen del microservicio que haya sufrido cambios reales.

Se ejecuta automáticamente al hacer `Push` a `main` (Producción).

```yaml
# .github/workflows/cd.yml
name: Despliegue Continuo (CD)

on:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      auth: ${{ steps.filter.outputs.auth }}
      catalog: ${{ steps.filter.outputs.catalog }}
      order: ${{ steps.filter.outputs.order }}
      chat: ${{ steps.filter.outputs.chat }}
      gateway: ${{ steps.filter.outputs.gateway }}
      frontend: ${{ steps.filter.outputs.frontend }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            auth:
              - 'backend/auth-service/**'
            catalog:
              - 'backend/catalog-service/**'
            order:
              - 'backend/order-service/**'
            chat:
              - 'backend/chat-service/**'
            gateway:
              - 'backend/api-gateway/**'
            frontend:
              - 'frontend/**'

  build-and-deploy:
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Login en GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # Ejemplo de construcción condicional para Auth Service
      - name: Build & Push Auth Service
        if: needs.detect-changes.outputs.auth == 'true'
        uses: docker/build-push-action@v5
        with:
          context: ./backend/auth-service
          push: true
          tags: ghcr.io/${{ github.repository }}/auth-service:latest

      # (Se repite el mismo bloque condicional para catalog, order, chat, gateway y frontend)

      - name: Despliegue en Servidor de Producción (Vía SSH)
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_SERVER_IP }}
          username: ${{ secrets.PROD_SERVER_USER }}
          key: ${{ secrets.PROD_SSH_PRIVATE_KEY }}
          script: |
            cd /app/dark-kitchens
            docker compose pull
            docker compose up -d
            # Ejecutar migraciones automáticas de base de datos post-despliegue
            docker compose exec -T auth-service npx prisma migrate deploy
            docker compose exec -T catalog-service npx prisma migrate deploy
            docker compose exec -T order-service npx prisma migrate deploy
            docker compose exec -T chat-service npx prisma migrate deploy
```

