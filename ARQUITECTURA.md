# Arquitectura de Dark Kitchens

Este diagrama ilustra la arquitectura de microservicios descrita en el documento `DECISIONES.md`.

```mermaid
flowchart TD
    %% Styling
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef gateway fill:#2a2a2a,stroke:#333,stroke-width:2px,color:#fff
    classDef backend fill:#ea2845,stroke:#333,stroke-width:2px,color:#fff
    classDef database fill:#336791,stroke:#333,stroke-width:2px,color:#fff
    classDef redis fill:#dc382d,stroke:#333,stroke-width:2px,color:#fff
    classDef prisma fill:#0c344b,stroke:#333,stroke-width:2px,color:#fff

    %% Nodes
    Client["Frontend\n(React, Zustand, Socket.IO)"]:::frontend
    
    Gateway["API Gateway\n(NestJS / Puerto 4000)"]:::gateway

    subgraph Microservices ["Microservicios (Backend)"]
        Auth["Auth Service\n(Puerto 4001)"]:::backend
        Catalog["Catalog Service\n(Puerto 4002)"]:::backend
        Order["Order Service\n(Puerto 4003)"]:::backend
        Chat["Chat Service\n(Puerto 4004/4005)"]:::backend
    end

    subgraph ORMLayer ["Capa ORM"]
        PrismaAuth{"Prisma"}:::prisma
        PrismaCatalog{"Prisma"}:::prisma
        PrismaOrder{"Prisma"}:::prisma
        PrismaChat{"Prisma"}:::prisma
    end

    subgraph Databases ["Bases de Datos"]
        AuthDB[("Auth DB\n(PostgreSQL)")]:::database
        CatalogDB[("Catalog DB\n(PostgreSQL)")]:::database
        OrderDB[("Order DB\n(PostgreSQL)")]:::database
        ChatDB[("Chat DB\n(PostgreSQL)")]:::database
    end

    Redis[("Redis Broker\n(Pub/Sub & Adapters)")]:::redis

    %% Edges
    Client -- "REST (JWT) / WS" --> Gateway
    
    Gateway -- "/api/auth/*" --> Auth
    Gateway -- "/api/products/*" --> Catalog
    Gateway -- "/api/orders/*" --> Order
    Gateway -- "/api/messages/*\nWS" --> Chat

    Auth --> PrismaAuth
    Catalog --> PrismaCatalog
    Order --> PrismaOrder
    Chat --> PrismaChat

    PrismaAuth ==> AuthDB
    PrismaCatalog ==> CatalogDB
    PrismaOrder ==> OrderDB
    PrismaChat ==> ChatDB

    Order -- "HTTP Síncrono\n(Valida Precios)" --> Catalog

    Auth -- "Eventos (Audit)" --> Redis
    Catalog -- "Eventos" --> Redis
    Order -- "Eventos (Estado de orden)" --> Redis
    Chat -- "Eventos (Mensajes)" --> Redis

    Redis -- "Escucha Eventos\n(Pub/Sub)" --> Auth
    Redis -- "WS Broadcast" --> Chat
```

## Patrones Destacados en el Diagrama

1. **API Gateway:** Único punto de entrada. Se encarga de validar el JWT y enrutar las peticiones al microservicio correspondiente inyectando `X-User-Id` y `X-User-Role`.
2. **Database per Service:** Cada microservicio gestiona su propia base de datos (PostgreSQL), promoviendo la autonomía y evitando problemas de consistencia en caso de fallos individuales.
3. **ORM (Prisma):** Se utiliza Prisma como mapeador objeto-relacional (ORM) para interactuar con las bases de datos de forma tipada, facilitando el esquema y las migraciones.
4. **Comunicación Síncrona (Circuit Breaker):** El `Order Service` valida los precios y la disponibilidad con una llamada HTTP directa hacia el `Catalog Service`. 
5. **Comunicación Asíncrona (Eventos):** Un servidor Redis centralizado permite notificar eventos entre servicios sin acoplarlos (como la generación asíncrona de registros de auditoría o eventos de notificación en tiempo real).
