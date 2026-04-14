# InvTrack - High-Performance Inventory Management

InvTrack is a professional-grade, containerized inventory management platform optimized for speed, security, and long-term accountability. It combines a modern Glassmorphism UI with a high-performance Redis caching layer and an advanced auditing engine.

## 🌟 Key Features

### 📦 Precision Stock Control
- **Intelligent Check-In**: Manual entry or a dynamic bulk-mapping wizard that adapts to any Excel/CSV layout.
- **Advanced Stock Editing**: Correct stock details, adjust quantities, and relocate items across racks instantly.
- **Admin-Only Management**: Powerful administrative tools for stock corrections and deletion, secured by role-based access.

### 🛡️ Unified Account & Security
- **Anti-Lockout Protection**: System-level safeguards prevent Admins from deleting themselves or downgrading their own access.
- **Protected Master Admin**: The default `admin` account is protected from deletion or renaming for guaranteed system recovery.
- **Simplified User Profile**: Users can safely manage their own passwords without seeing complex administrative tools.

### 🕵️ High-Performance Audit Engine
- **Searchable History**: A global search bar allows you to filter logs by Item, SKU, Username, or Transaction Notes.
- **180-Day Retention**: Tracks system activity for 6 months with sub-millisecond page turns powered by **Redis Caching**.
- **Indestructible Logs**: Uses "Snapshot Persistence" for both Items and Users. Your logs remain 100% readable even if the source item or user account is permanently deleted.

### ⚡ Technical Excellence
- **Unified Gateway (Nginx)**: Consolidates Frontend and API onto a single port (3333). Compatible with Cloudflare Tunnels and SSL.
- **Redis Acceleration**: Cache-aside patterns for sub-millisecond dashboard stats, inventory views, and audit searches.
- **Dockerized Architecture**: Deploy the entire stack (Postgres, Redis, Backend, Frontend) with one command.

---

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose installed.

### Installation & Launch
1. Clone the repository and navigate to the root directory.
2. Run the deployment command:
   ```bash
   docker-compose up --build
   ```
3. **Synchronize the Database**:
   ```bash
   docker-compose exec server npx prisma db push
   ```
4. Access the system at: **[http://localhost:3333](http://localhost:3333)**

### Default Credentials
- **Username**: `admin`
- **Password**: `admin`

---

## 🔧 Maintenance Commands

**Emergency Admin Reset**:
```bash
docker-compose exec server node scripts/reset-admin.js
```

**Clear Performance Cache**:
```bash
docker-compose exec redis redis-cli flushall
```

**Manual Database Sync**:
```bash
docker-compose exec server npx prisma db push
```

---
*Developed for professional high-volume warehouse environments.*
