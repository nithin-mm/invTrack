# InvTrack - Advanced Inventory Management System

InvTrack is a professional-grade, containerized inventory management platform built for speed, transparency, and ease of use. It features a modern Glassmorphism UI, a high-performance Redis caching layer, and a robust unified API gateway.

## 🌟 Key Features

### 📦 Optimized Stock Management
- **Manual & Bulk Entry**: Check in items individually or via an intelligent bulk import wizard.
- **Dynamic Field Mapping**: Upload any Excel/CSV file and map your own column headers (e.g., "Product Name" → "Name") in real-time.
- **Advanced Editing**: Admins can manually correct item details, SKU numbers, and warehouse locations.
- **Secure Deletion**: Remove items with confirmation while preserving their history in the audit trail.

### 🛡️ Enterprise-Grade Security
- **Role-Based Access Control (RBAC)**:
    - **Admins**: Full control over inventory, user management, and bulk imports.
    - **Users**: Restricted to stock viewing and Check-Out operations only.
- **Unified Gateway (Nginx)**: Consolidates Frontend and API onto a single port (3333). Compatible with Cloudflare Tunnels and SSL out of the box.
- **Persistent Audit Logs**: Transaction logs save permanent snapshots of item names and SKUs. History remains readable even if the source item is deleted.

### ⚡ Performance & Analytics
- **Redis Caching**: Sub-millisecond data fetching for inventory and dashboard stats.
- **Modern Analytics**: Real-time visualization of stock distribution, low-stock alerts, and 45-day activity trends.
- **Server-Side Pagination**: Handles thousands of items smoothly with optimized database queries.

---

## 🚀 Tech Stack
- **Frontend**: React (Vite), Framer Motion, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, Prisma ORM, Ioredis.
- **Database**: PostgreSQL (Primary Storage) & Redis (Caching Layer).
- **Infra**: Docker, Nginx Reverse Proxy.

---

## 🛠️ Getting Started

### Prerequisites
- Docker and Docker Compose installed.

### Installation & Launch
1. Clone the repository and navigate to the root directory.
2. Run the deployment command:
   ```bash
   docker-compose up --build
   ```
3. **Initialize the Database**:
   ```bash
   docker-compose exec server npx prisma db push
   ```
4. Access the system at: **[http://localhost:3333](http://localhost:3333)**

### Default Credentials
- **Username**: `admin`
- **Password**: `admin`

---

## 📂 Infrastructure Overview
- **Port 3333**: Unified Access (Frontend + API via Nginx Proxy).
- **Internal Only**: Redis (6379) and Backend (4000) are protected within the Docker network.
- **Database**: PostgreSQL (Port 5433 exposed for maintenance).

---

## 🔧 Maintenance Commands

**Emergency Admin Reset**:
```bash
docker-compose exec server node scripts/reset-admin.js
```

**Clear Performance Cache**:
If you need to manually clear the Redis cache:
```bash
docker-compose exec redis redis-cli flushall
```

**Manual Database Sync**:
```bash
docker-compose exec server npx prisma db push
```

---
*Developed for professional warehouse and inventory environments.*
