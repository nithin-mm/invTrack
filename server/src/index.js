const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cache = require('./redis');

const prisma = new PrismaClient();
const app = express();
const upload = multer({ dest: 'uploads/' });

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-secret-key-2026';

app.use(cors({ origin: '*', methods: '*' }));
app.use(express.json());

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    
    // Verify user still exists in DB (prevents staleness after db push)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'User no longer exists. Please log in again.' });
    
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Permission denied. Admin access required.' });
  next();
};

// --- Auth & User Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log(`❌ Auth failure: User "${username}" not found in DB`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`❌ Auth failure: Password mismatch for user "${username}"`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    console.log(`✅ User "${username}" logged in successfully`);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('🔥 Server Error during login:', error.message);
    res.status(500).json({ error: 'Internal server error. Check logs.' });
  }
});

app.post('/api/auth/reset-password', authenticateToken, async (req, res) => {
  const { newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Admin: User Management ---
app.get('/api/auth/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/users/:id/reset-password', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    res.json({ message: 'User password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/users', authenticateToken, isAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role: role || 'USER' }
    });
    res.json({ message: 'User created', user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// --- Inventory Endpoints (with Pagination & Caching) ---
app.get('/api/inventory', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const cacheKey = `inventory:page:${page}:limit:${limit}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const totalItems = await prisma.item.count();
    const items = await prisma.item.findMany({
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    });

    const response = {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    };

    await cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Audit Logs (Last 45 Days) ---
app.get('/api/audit', authenticateToken, async (req, res) => {
  const fortyFiveDaysAgo = new Date();
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

  try {
    const logs = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: fortyFiveDaysAgo }
      },
      include: {
        item: { select: { name: true, partNumber: true } },
        user: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Dashboard Stats (with Caching) ---
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const cacheKey = 'dashboard:stats';
  try {
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const totalItems = await prisma.item.count();
    const stockStats = await prisma.item.aggregate({
      _sum: { quantity: true }
    });
    
    const items = await prisma.item.findMany();
    const lowStockItems = items.filter(item => item.quantity <= item.minQuantity);

    const itemsByMake = await prisma.item.groupBy({
      by: ['make'],
      _count: { _all: true },
      _sum: { quantity: true }
    });

    const response = {
      totalItems,
      totalQuantity: stockStats._sum.quantity || 0,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      itemsByMake
    };

    await cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Check-In (Manual) - ADMIN ONLY ---
app.post('/api/check-in', authenticateToken, isAdmin, async (req, res) => {
  const { name, quantity, partNumber, make, model, description, minQuantity, rackNumber, rackRowNumber } = req.body;
  try {
    const item = await prisma.item.upsert({
      where: { partNumber: partNumber || 'TEMP-' + Date.now() },
      update: {
        quantity: { increment: parseInt(quantity) },
        name,
        make,
        model,
        description,
        rackNumber,
        rackRowNumber,
        minQuantity: parseInt(minQuantity) || 5
      },
      create: {
        name,
        quantity: parseInt(quantity),
        partNumber,
        make,
        model,
        description,
        rackNumber,
        rackRowNumber,
        minQuantity: parseInt(minQuantity) || 5
      }
    });

    await prisma.transaction.create({
      data: {
        itemId: item.id,
        userId: req.user.id,
        type: 'CHECK_IN',
        quantity: parseInt(quantity),
        itemName: item.name,
        itemPartNumber: item.partNumber,
        note: `Manual Check-In`
      }
    });

    await cache.clearInventory();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Check-In (Bulk JSON) - ADMIN ONLY ---
app.post('/api/check-in/bulk', authenticateToken, isAdmin, async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items array' });

  try {
    for (const row of items) {
      const { name, quantity, partNumber, make, model, minQuantity, rackNumber, rackRowNumber, description } = row;
      
      const item = await prisma.item.upsert({
        where: { partNumber: String(partNumber) },
        update: { 
          quantity: { increment: parseInt(quantity) },
          name, make, model, description,
          rackNumber: rackNumber ? String(rackNumber) : undefined,
          rackRowNumber: rackRowNumber ? String(rackRowNumber) : undefined,
          minQuantity: parseInt(minQuantity) || 5
        },
        create: {
          name, quantity: parseInt(quantity), partNumber: String(partNumber),
          make, model, description,
          rackNumber: rackNumber ? String(rackNumber) : undefined,
          rackRowNumber: rackRowNumber ? String(rackRowNumber) : undefined,
          minQuantity: parseInt(minQuantity) || 5
        }
      });

      await prisma.transaction.create({
        data: {
          itemId: item.id,
          userId: req.user.id,
          type: 'CHECK_IN',
          quantity: parseInt(quantity),
          itemName: item.name,
          itemPartNumber: item.partNumber,
          note: `Bulk Import (Mapped)`
        }
      });
    }
    await cache.clearInventory();
    res.json({ message: 'Bulk check-in successful', count: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Edit Stock - ADMIN ONLY ---
app.put('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, quantity, partNumber, make, model, description, minQuantity, rackNumber, rackRowNumber } = req.body;
  try {
    const oldItem = await prisma.item.findUnique({ where: { id } });
    if (!oldItem) return res.status(404).json({ error: 'Item not found' });

    const item = await prisma.item.update({
      where: { id },
      data: {
        name,
        quantity: parseInt(quantity),
        partNumber,
        make,
        model,
        description,
        rackNumber,
        rackRowNumber,
        minQuantity: parseInt(minQuantity)
      }
    });

    await prisma.transaction.create({
      data: {
        itemId: item.id,
        userId: req.user.id,
        type: 'MANUAL_EDIT',
        quantity: parseInt(quantity) - oldItem.quantity, // Relative change
        itemName: item.name,
        itemPartNumber: item.partNumber,
        note: `Manual Correction: Name(${oldItem.name}->${item.name}), Qty(${oldItem.quantity}->${item.quantity})`
      }
    });

    await cache.clearInventory();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Delete Stock - ADMIN ONLY ---
app.delete('/api/inventory/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Record deletion in audit BEFORE deleting the item
    await prisma.transaction.create({
      data: {
        itemId: null, // item is going away
        userId: req.user.id,
        type: 'MANUAL_DELETE',
        quantity: -item.quantity,
        itemName: item.name,
        itemPartNumber: item.partNumber,
        note: `Permanently deleted from inventory`
      }
    });

    await prisma.item.delete({ where: { id } });
    await cache.clearInventory();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Check-Out (USER/ADMIN ALLOWED) ---
app.post('/api/check-out', authenticateToken, async (req, res) => {
  const { partNumber, quantity } = req.body;
  try {
    const item = await prisma.item.findUnique({ where: { partNumber } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.quantity < quantity) return res.status(400).json({ error: 'Insufficient quantity' });

    const updatedItem = await prisma.item.update({
      where: { partNumber },
      data: { quantity: { decrement: parseInt(quantity) } }
    });

    await prisma.transaction.create({
      data: {
        itemId: item.id,
        userId: req.user.id,
        type: 'CHECK_OUT',
        quantity: parseInt(quantity),
        itemName: item.name,
        itemPartNumber: item.partNumber,
        note: `Manual Check-Out`
      }
    });

    await cache.clearInventory();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 4000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize Admin User
  try {
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await prisma.user.create({
        data: { username: 'admin', password: hashedPassword, role: 'ADMIN' }
      });
      console.log('🌟 Admin user initialized automatically (admin/admin)');
    } else {
      console.log('✅ Admin user already exists.');
    }
  } catch (err) {
    console.error('🛑 Database initialization error:', err.message);
  }
});
