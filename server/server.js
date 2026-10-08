import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase, query, getDbMode } from './db.js';
import { printer } from './printer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Database on startup
await initDatabase();

// ======================== API ROUTES ========================

// 1. System & DB Health
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    system: 'Fiddle POS v3.4 Color Splash',
    dbEngine: getDbMode() === 'mysql' ? 'XAMPP MySQL (fiddledb)' : 'Offline Local SQLite',
    printer: printer.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// 2. Menu Items & Recipe Management
app.get('/api/menu', async (req, res) => {
  try {
    const items = await query('SELECT * FROM menu_tbl ORDER BY category, name');
    const parsed = items.map(it => ({
      ...it,
      recipe: typeof it.recipeJson === 'string' ? JSON.parse(it.recipeJson || '[]') : (it.recipeJson || [])
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new food / menu item
app.post('/api/menu', async (req, res) => {
  try {
    const { 
      name, 
      category = 'Ramen', 
      price, 
      image = '/images/Ramen/Kuro.png', 
      size = 'Regular', 
      uom = 'serving', 
      isBestSeller = 0, 
      stock = 20, 
      status = 'Active', 
      recipe = [] 
    } = req.body;

    if (!name || isNaN(Number(price))) {
      return res.status(400).json({ error: 'Valid dish name and price are required.' });
    }

    const recipeJson = JSON.stringify(recipe || []);
    const result = await query(
      'INSERT INTO menu_tbl (name, category, price, image, size, uom, isBestSeller, stock, status, recipeJson) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), category.trim(), Number(price), image, size, uom, isBestSeller ? 1 : 0, Number(stock), status, recipeJson]
    );

    const [newItem] = await query('SELECT * FROM menu_tbl WHERE id = ?', [result.insertId]);
    const formatted = {
      ...newItem,
      recipe: typeof newItem.recipeJson === 'string' ? JSON.parse(newItem.recipeJson || '[]') : (newItem.recipeJson || [])
    };

    io.emit('menu:new', formatted);
    res.json({ success: true, item: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update food / menu item and its recipe
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      category, 
      price, 
      image, 
      size, 
      uom, 
      isBestSeller, 
      stock, 
      status, 
      recipe 
    } = req.body;

    const recipeJson = JSON.stringify(recipe || []);
    await query(
      'UPDATE menu_tbl SET name = ?, category = ?, price = ?, image = ?, size = ?, uom = ?, isBestSeller = ?, stock = ?, status = ?, recipeJson = ? WHERE id = ?',
      [name.trim(), category.trim(), Number(price), image, size, uom, isBestSeller ? 1 : 0, Number(stock), status, recipeJson, id]
    );

    const [updated] = await query('SELECT * FROM menu_tbl WHERE id = ?', [id]);
    const formatted = {
      ...updated,
      recipe: typeof updated.recipeJson === 'string' ? JSON.parse(updated.recipeJson || '[]') : (updated.recipeJson || [])
    };

    io.emit('menu:updated', formatted);
    res.json({ success: true, item: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete food item from menu
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM menu_tbl WHERE id = ?', [id]);
    io.emit('menu:deleted', { id: Number(id) });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch Prep / Restock Portions (Cooks portions & deducts required raw ingredients)
app.post('/api/menu/:id/prep', async (req, res) => {
  try {
    const { id } = req.params;
    const { portions, user = 'Kitchen Staff' } = req.body;
    const numPortions = Number(portions);

    if (isNaN(numPortions) || numPortions <= 0) {
      return res.status(400).json({ error: 'Valid portion count is required.' });
    }

    const [menuItem] = await query('SELECT * FROM menu_tbl WHERE id = ?', [id]);
    if (!menuItem) return res.status(404).json({ error: 'Menu item not found.' });

    const recipe = typeof menuItem.recipeJson === 'string'
      ? JSON.parse(menuItem.recipeJson || '[]')
      : (menuItem.recipeJson || []);
    const deductedIngredients = [];

    // 1. Deduct raw ingredients
    for (const ing of recipe) {
      if (ing.productId && ing.qty) {
        const totalDeduct = Number(ing.qty) * numPortions;
        await query('UPDATE product_tbl SET quantity = MAX(0, quantity - ?) WHERE id = ?', [totalDeduct, ing.productId]);
        await query(
          'INSERT INTO restocking_tbl (productId, processType, qty, notes, user) VALUES (?, ?, ?, ?, ?)',
          [ing.productId, 'Minus', totalDeduct, `Batch prep: +${numPortions}x ${menuItem.name}`, user]
        );
        const [updatedProd] = await query('SELECT * FROM product_tbl WHERE id = ?', [ing.productId]);
        if (updatedProd) {
          deductedIngredients.push(updatedProd);
          io.emit('inventory:updated', updatedProd);
        }
      }
    }

    // 2. Increment menu portions
    await query('UPDATE menu_tbl SET stock = stock + ? WHERE id = ?', [numPortions, id]);
    const [updatedMenu] = await query('SELECT * FROM menu_tbl WHERE id = ?', [id]);
    io.emit('stock:updated', { id: Number(id), stock: updatedMenu.stock });

    res.json({
      success: true,
      menuItem: {
        ...updatedMenu,
        recipe
      },
      deductedIngredients
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update item stock directly
app.patch('/api/menu/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    await query('UPDATE menu_tbl SET stock = ? WHERE id = ?', [stock, id]);
    
    // Broadcast stock update to all connected screens (iPad, Mac, KDS)
    io.emit('stock:updated', { id: Number(id), stock: Number(stock) });
    res.json({ success: true, id, stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Raw Products & Ingredients (Inventory)
app.get('/api/products', async (req, res) => {
  try {
    const products = await query('SELECT * FROM product_tbl ORDER BY category, name');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restock / Stock Adjustment
app.post('/api/inventory/adjust', async (req, res) => {
  try {
    const { productId, processType, qty, notes, user = 'CeddyAdmin' } = req.body;
    const delta = processType === 'Add' ? Number(qty) : -Number(qty);

    await query('UPDATE product_tbl SET quantity = quantity + ? WHERE id = ?', [delta, productId]);
    await query(
      'INSERT INTO restocking_tbl (productId, processType, qty, notes, user) VALUES (?, ?, ?, ?, ?)',
      [productId, processType, qty, notes || 'Manual adjustment', user]
    );

    const [updated] = await query('SELECT * FROM product_tbl WHERE id = ?', [productId]);
    io.emit('inventory:updated', updated);

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create New Raw Ingredient / Supply
app.post('/api/products', async (req, res) => {
  try {
    const { 
      name, 
      brand = 'General', 
      category = 'Ingredient', 
      unitPrice = 0, 
      quantity = 0, 
      uom = 'g', 
      minStock = 100 
    } = req.body;

    const result = await query(
      'INSERT INTO product_tbl (name, brand, category, unitPrice, quantity, uom, minStock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), brand.trim(), category.trim(), Number(unitPrice), Number(quantity), uom.trim(), Number(minStock), 'Active']
    );

    const [newProduct] = await query('SELECT * FROM product_tbl WHERE id = ?', [result.insertId]);
    io.emit('inventory:new', newProduct);
    io.emit('inventory:updated', newProduct);

    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Raw Ingredient / Supply
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      brand = 'General', 
      category = 'Ingredient', 
      unitPrice = 0, 
      quantity = 0, 
      uom = 'g', 
      minStock = 100, 
      status = 'Active' 
    } = req.body;

    await query(
      'UPDATE product_tbl SET name = ?, brand = ?, category = ?, unitPrice = ?, quantity = ?, uom = ?, minStock = ?, status = ? WHERE id = ?',
      [name.trim(), brand.trim(), category.trim(), Number(unitPrice), Number(quantity), uom.trim(), Number(minStock), status, id]
    );

    const [updated] = await query('SELECT * FROM product_tbl WHERE id = ?', [id]);
    io.emit('inventory:updated', updated);

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Raw Ingredient / Supply
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM product_tbl WHERE id = ?', [id]);
    io.emit('inventory:deleted', { id: Number(id) });
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 3.5. Users & Staff Management (CRUD) ====================
app.get('/api/users', async (req, res) => {
  try {
    const users = await query('SELECT id, username, name, role, status, createdAt FROM users_tbl ORDER BY role, name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password = '123', name, role = 'Cashier', status = 'Active' } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: 'Username and display name are required.' });
    }
    const result = await query(
      'INSERT INTO users_tbl (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)',
      [username.trim().toLowerCase(), password, name.trim(), role, status]
    );
    const [newUser] = await query('SELECT id, username, name, role, status, createdAt FROM users_tbl WHERE id = ?', [result.insertId]);
    io.emit('users:updated');
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, role, status } = req.body;
    
    if (password) {
      await query(
        'UPDATE users_tbl SET username = ?, password = ?, name = ?, role = ?, status = ? WHERE id = ?',
        [username.trim().toLowerCase(), password, name.trim(), role, status, id]
      );
    } else {
      await query(
        'UPDATE users_tbl SET username = ?, name = ?, role = ?, status = ? WHERE id = ?',
        [username.trim().toLowerCase(), name.trim(), role, status, id]
      );
    }
    
    const [updated] = await query('SELECT id, username, name, role, status, createdAt FROM users_tbl WHERE id = ?', [id]);
    io.emit('users:updated');
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users_tbl WHERE id = ?', [id]);
    io.emit('users:updated');
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await query(
      'SELECT id, username, name, role, status FROM users_tbl WHERE LOWER(username) = ? AND password = ?',
      [username.trim().toLowerCase(), password]
    );
    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password/PIN.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Orders / Transactions (Cashier Checkout)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await query('SELECT * FROM orders_tbl ORDER BY id DESC LIMIT 50');
    const parsed = orders.map(o => ({
      ...o,
      items: typeof o.itemsJson === 'string' ? JSON.parse(o.itemsJson) : o.itemsJson
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place new order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discountType = 'None',
      discountAmount = 0,
      totalAmount,
      paymentMethod,
      amountPaid,
      changeAmount,
      cashier = 'CeddyAdmin'
    } = req.body;

    const transactionId = String(Math.floor(1000000 + Math.random() * 9000000));
    const itemsJson = JSON.stringify(items);

    // 1. Insert order
    const result = await query(
      `INSERT INTO orders_tbl 
      (transactionId, itemsJson, subtotal, discountType, discountAmount, totalAmount, paymentMethod, amountPaid, changeAmount, status, cashier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [transactionId, itemsJson, subtotal, discountType, discountAmount, totalAmount, paymentMethod, amountPaid, changeAmount, cashier]
    );

    // 2. Decrement menu stock & auto-deduct raw ingredients from recipe
    for (const item of items) {
      if (item.id) {
        await query('UPDATE menu_tbl SET stock = MAX(0, stock - ?) WHERE id = ?', [item.qty, item.id]);
        const [updatedItem] = await query('SELECT * FROM menu_tbl WHERE id = ?', [item.id]);
        if (updatedItem) {
          io.emit('stock:updated', { id: updatedItem.id, stock: updatedItem.stock });

          // Deduct ingredients according to recipe
          const recipe = typeof updatedItem.recipeJson === 'string'
            ? JSON.parse(updatedItem.recipeJson || '[]')
            : (updatedItem.recipeJson || []);

          for (const ing of recipe) {
            if (ing.productId && ing.qty) {
              const deduct = Number(ing.qty) * Number(item.qty);
              await query('UPDATE product_tbl SET quantity = MAX(0, quantity - ?) WHERE id = ?', [deduct, ing.productId]);
              await query(
                'INSERT INTO restocking_tbl (productId, processType, qty, notes, user) VALUES (?, ?, ?, ?, ?)',
                [ing.productId, 'Minus', deduct, `Order #${transactionId}: ${item.qty}x ${updatedItem.name}`, cashier]
              );
              const [updatedProd] = await query('SELECT * FROM product_tbl WHERE id = ?', [ing.productId]);
              if (updatedProd) {
                io.emit('inventory:updated', updatedProd);
              }
            }
          }
        }
      }
    }

    const newOrder = {
      id: result.insertId,
      transactionId,
      items,
      subtotal,
      discountType,
      discountAmount,
      totalAmount,
      paymentMethod,
      amountPaid,
      changeAmount,
      status: 'Pending',
      cashier,
      createdAt: new Date().toISOString()
    };

    // 3. Broadcast new order to Kitchen Display & All Cashier Screens
    io.emit('order:new', newOrder);

    // 4. Trigger Receipt Print (with error safety)
    let printResult = null;
    try {
      printResult = await printer.printReceipt(newOrder);
    } catch (printErr) {
      console.warn('⚠️ [Printer Warning]:', printErr.message);
      printResult = { success: false, error: printErr.message };
    }

    res.json({
      success: true,
      order: newOrder,
      printResult
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update order status (Kitchen Display flow: Pending -> Preparing -> Ready -> Completed)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await query('UPDATE orders_tbl SET status = ? WHERE id = ?', [status, id]);
    io.emit('order:status', { id: Number(id), status });

    res.json({ success: true, id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Reports & Sales Summary
app.get('/api/reports/summary', async (req, res) => {
  try {
    const orders = await query('SELECT * FROM orders_tbl ORDER BY id DESC');
    const totalSales = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const totalTransactions = orders.length;

    // Calculate item sales breakdown
    const itemMap = {};
    orders.forEach(o => {
      try {
        const items = typeof o.itemsJson === 'string' ? JSON.parse(o.itemsJson) : o.itemsJson;
        items.forEach(it => {
          if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, count: 0, revenue: 0 };
          itemMap[it.name].count += it.qty;
          itemMap[it.name].revenue += it.qty * it.price;
        });
      } catch (e) {}
    });

    const topItems = Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);

    res.json({
      totalSales,
      totalTransactions,
      topItems,
      recentOrders: orders.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Printer Management & Hardware Testing
app.get('/api/printer/status', (req, res) => {
  res.json(printer.getStatus());
});

app.post('/api/printer/test', async (req, res) => {
  try {
    const result = await printer.testPrint();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/printer/toggle-paper', (req, res) => {
  const current = printer.getStatus().paperReady;
  printer.setPaperStatus(!current);
  res.json({ paperReady: !current, message: !current ? 'Paper loaded' : 'Simulated Paper Out' });
});

app.post('/api/printer/toggle-connection', (req, res) => {
  const current = printer.getStatus().connected;
  printer.setConnectionStatus(!current);
  res.json({ connected: !current, message: !current ? 'Printer online' : 'Simulated Printer Disconnected' });
});

// WebSockets connection
io.on('connection', (socket) => {
  console.log('⚡ [Real-time] Terminal connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 [Real-time] Terminal disconnected:', socket.id);
  });
});

// Serve Built Frontend (SPA)
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('/download-apk', (req, res) => {
  const rxsApkPath = path.join(__dirname, '../RXS_Restaurant_Xiaomi.apk');
  const legacyApkPath = path.join(__dirname, '../Fiddle_v3.4_Xiaomi.apk');
  if (fs.existsSync(rxsApkPath)) {
    return res.download(rxsApkPath, 'RXS_Restaurant_Xiaomi.apk');
  }
  res.download(legacyApkPath, 'RXS_Restaurant_Xiaomi.apk');
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/download-apk') return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [RXS Restaurant POS Backend] Running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Available on Tablet/iPad via IP: http://192.168.1.66:${PORT}`);
  console.log(`📱 Available on Tablet/iPad via Bonjour: http://Cedricks-MacBook-Pro.local:${PORT}`);
});

// Also create fallback listener on port 3000 for maximum compatibility
const server3000 = http.createServer(app);
server3000.listen(3000, '0.0.0.0', () => {
  console.log(`🚀 [Secondary Port 3000] Running on http://0.0.0.0:3000`);
});
