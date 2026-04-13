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
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// --- Auth & User Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log(`❌ Login failed: User "${username}" not found`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`❌ Login failed: Invalid password for user "${username}"`);
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

// --- Inventory Endpoints (with Pagination) ---
app.get('/api/inventory', authenticateToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const totalItems = await prisma.item.count();
    const items = await prisma.item.findMany({
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    });
    res.json({
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    });
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

// --- Dashboard Stats ---
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
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

    res.json({
      totalItems,
      totalQuantity: stockStats._sum.quantity || 0,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      itemsByMake
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Check-In (Manual) ---
app.post('/api/check-in', authenticateToken, async (req, res) => {
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
        note: `Manual Check-In`
      }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Check-In (Bulk Upload) ---
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const results = [];
  const filePath = req.file.path;

  try {
    if (req.file.originalname.endsWith('.csv')) {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => processBulk(results, res, filePath, req.user.id));
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      processBulk(data, res, filePath, req.user.id);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function processBulk(data, res, filePath, userId) {
  try {
    for (const row of data) {
      const { name, quantity, partNumber, make, model, minQuantity, rackNumber, rackRowNumber } = row;
      if (!name || !quantity) continue;

      const item = await prisma.item.upsert({
        where: { partNumber: String(partNumber) },
        update: { 
          quantity: { increment: parseInt(quantity) },
          rackNumber: rackNumber ? String(rackNumber) : undefined,
          rackRowNumber: rackRowNumber ? String(rackRowNumber) : undefined
        },
        create: {
          name,
          quantity: parseInt(quantity),
          partNumber: String(partNumber),
          make,
          model,
          rackNumber: rackNumber ? String(rackNumber) : undefined,
          rackRowNumber: rackRowNumber ? String(rackRowNumber) : undefined,
          minQuantity: parseInt(minQuantity) || 5
        }
      });

      await prisma.transaction.create({
        data: {
          itemId: item.id,
          userId,
          type: 'CHECK_IN',
          quantity: parseInt(quantity),
          note: `Bulk Upload`
        }
      });
    }
    fs.unlinkSync(filePath);
    res.json({ message: 'Bulk upload successful', count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// --- Check-Out ---
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
        note: `Manual Check-Out`
      }
    });

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
