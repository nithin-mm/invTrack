# InvTrack - Modern Inventory Management System

A full-stack, containerized inventory management system with secure authentication, warehouse location tracking, and bulk data import.

## Features
- **Secure Authentication**: JWT-based login system with role management.
- **Modern Dashboard**: Real-time stats, inventory distribution charts, and low-stock alerts.
- **Warehouse Location**: Track items specifically by **Rack Number** and **Rack Row**.
- **Check-In**: 
    - Manual entry with auto-focus barcode field.
    - Bulk upload support for CSV and Excel files.
- **Check-Out**: Search-and-select workflow with stock validation.
- **Rich UI**: Built with React, Framer Motion for animations, and a Glassmorphism design system.
- **Dockerized**: Easy deployment with Docker Compose.

## Tech Stack
- **Frontend**: React (Vite), Framer Motion, Lucide Icons, Recharts, Axios.
- **Backend**: Node.js, Express, Prisma ORM, Bcrypt, JWT.
- **Database**: PostgreSQL.
- **Infrastructure**: Docker, Docker Compose, Nginx.

## Getting Started

### Prerequisites
- Docker and Docker Compose installed on your machine.

### Installation & Launch
1. Clone the repository or copy the files to your directory.
2. Open a terminal in the project root.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
4. Access the UI at: [http://localhost:3333](http://localhost:3333)
5. **Default Login**: 
   - Username: `admin`
   - Password: `admin`

## Emergency Admin Reset
If you lose your admin password, you can reset it to the default (`admin`) by running this command on your Docker host:
```bash
docker exec -it <server_container_id> node scripts/reset-admin.js
```

## Bulk Upload Format
When uploading via CSV or Excel, ensure your file has the following columns:
- `name` (required)
- `quantity` (required)
- `partNumber` (unique identification)
- `make`
- `model`
- `rackNumber`
- `rackRowNumber`
- `minQuantity` (threshold for low stock warning)

## Infrastructure Details
- **UI Port**: 3333 (Served via Nginx)
- **API Port**: 4000
- **Database Port**: 5433 (Exposed to Host) / 5432 (Internal)
