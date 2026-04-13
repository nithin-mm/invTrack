# Base image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Install dependencies (openssl and netcat for health checks)
RUN apt-get update && apt-get install -y openssl netcat-traditional && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source
COPY . .

# Expose port
EXPOSE 4000

# Improved startup script with retry logic
RUN echo '#!/bin/sh\n\
echo "Waiting for database (db:5432)..."\n\
while ! nc -z db 5432; do\n\
  sleep 1\n\
done\n\
echo "Database is up! Syncing schema..."\n\
npx prisma db push\n\
if [ $? -eq 0 ]; then\n\
  echo "✅ Schema synced. Starting server..."\n\
  node src/index.js\n\
else\n\
  echo "❌ Schema sync failed. Retrying in 5s..."\n\
  sleep 5\n\
  exit 1\n\
fi' > start.sh

RUN chmod +x start.sh

# Start command
CMD ["./start.sh"]
