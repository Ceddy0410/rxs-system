import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbMode = 'sqlite'; // 'mysql' or 'sqlite'
let mysqlPool = null;
let sqliteDb = null;

// Initial Seeds matching Ceddy's Fiddle v3.4 menu
export const INITIAL_MENU = [
  // RAMEN
  { 
    name: 'Kuro Ramen', category: 'Ramen', price: 250, image: '/images/Ramen/Kuro.png', isBestSeller: 1, stock: 25, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 5, productName: 'Black Garlic Oil', qty: 20, uom: 'ml' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' },
      { productId: 7, productName: 'Nori Sheets', qty: 1, uom: 'sheets' }
    ]
  },
  { 
    name: 'Aka Ramen', category: 'Ramen', price: 260, image: '/images/Ramen/Aka.png', isBestSeller: 1, stock: 20, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 4, productName: 'Miso Paste', qty: 30, uom: 'g' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    name: 'Kaisen Ramen', category: 'Ramen', price: 280, image: '/images/Ramen/Kaisen.png', isBestSeller: 0, stock: 15, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 30, uom: 'ml' },
      { productId: 7, productName: 'Nori Sheets', qty: 1, uom: 'sheets' }
    ]
  },
  { 
    name: 'TanTan Ramen', category: 'Ramen', price: 270, image: '/images/Ramen/TanTan.png', isBestSeller: 1, stock: 18, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 6, productName: 'Sesame Oil', qty: 20, uom: 'ml' },
      { productId: 9, productName: 'Bean Sprouts', qty: 50, uom: 'g' }
    ]
  },
  { 
    name: 'Tonkotsu Hakata', category: 'Ramen', price: 265, image: '/images/Ramen/TonkotsuHakata.png', isBestSeller: 0, stock: 22, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 25, uom: 'ml' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    name: 'Tonkotsu Shoyu', category: 'Ramen', price: 255, image: '/images/Ramen/TonkotsuShoyu.png', isBestSeller: 0, stock: 19, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 150, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 80, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 30, uom: 'ml' }
    ]
  },
  
  // RICE MEALS
  { 
    name: 'Pork Katsu', category: 'Rice Meals', price: 180, image: '/images/Rice Meals/Pork Katsu.png', isBestSeller: 1, stock: 20, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 150, uom: 'g' },
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    name: 'Beef Gyudon', category: 'Rice Meals', price: 210, image: '/images/Rice Meals/BeefGyudon.png', isBestSeller: 1, stock: 15, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 30, uom: 'ml' },
      { productId: 8, productName: 'Fresh Eggs', qty: 1, uom: 'pcs' }
    ]
  },
  { 
    name: 'Beef Teriyaki', category: 'Rice Meals', price: 220, image: '/images/Rice Meals/BeefTeriyaki.png', isBestSeller: 0, stock: 14, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 25, uom: 'ml' }
    ]
  },
  { 
    name: 'Chicken Karaage', category: 'Rice Meals', price: 175, image: '/images/Rice Meals/ChickenKaraage.png', isBestSeller: 0, stock: 18, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 6, productName: 'Sesame Oil', qty: 15, uom: 'ml' }
    ]
  },
  { 
    name: 'Chicken Teriyaki', category: 'Rice Meals', price: 185, image: '/images/Rice Meals/ChickenTeriyaki.png', isBestSeller: 0, stock: 16, size: 'Regular', uom: 'serving',
    recipe: [
      { productId: 10, productName: 'Japanese Rice', qty: 200, uom: 'g' },
      { productId: 3, productName: 'Soy Sauce', qty: 20, uom: 'ml' }
    ]
  },

  // DRINKS
  { name: 'Coca-Cola', category: 'Drinks', price: 45, image: '/images/Drinks/CocaCola.png', isBestSeller: 1, stock: 40, size: '330ml', uom: 'can', recipe: [] },
  { name: 'Sprite', category: 'Drinks', price: 45, image: '/images/Drinks/Sprite.png', isBestSeller: 0, stock: 35, size: '330ml', uom: 'can', recipe: [] },
  { name: 'Matcha Frappe', category: 'Drinks', price: 95, image: '/images/Drinks/MatchFrappe.png', isBestSeller: 1, stock: 25, size: '16oz', uom: 'cup', recipe: [] },
  { name: 'Strawberry Float', category: 'Drinks', price: 85, image: '/images/Drinks/Strawberry.png', isBestSeller: 0, stock: 20, size: '16oz', uom: 'cup', recipe: [] },
  { name: 'Mango Smoothie', category: 'Drinks', price: 85, image: '/images/Drinks/Mango.png', isBestSeller: 0, stock: 20, size: '16oz', uom: 'cup', recipe: [] },
  { name: 'Green Apple Soda', category: 'Drinks', price: 75, image: '/images/Drinks/GreenApple.png', isBestSeller: 0, stock: 25, size: '16oz', uom: 'cup', recipe: [] },
  { name: 'Blueberry Cooler', category: 'Drinks', price: 80, image: '/images/Drinks/Blueberry.png', isBestSeller: 0, stock: 20, size: '16oz', uom: 'cup', recipe: [] },
  { name: 'Lychee Iced Tea', category: 'Drinks', price: 70, image: '/images/Drinks/Lychee.png', isBestSeller: 0, stock: 30, size: '16oz', uom: 'cup', recipe: [] },

  // BUNDLE
  { 
    name: 'Ramen Duo Combo', category: 'Bundle', price: 480, image: '/images/Bundle/RamenDuo.png', isBestSeller: 1, stock: 12, size: 'Bundle for 2', uom: 'set',
    recipe: [
      { productId: 1, productName: 'Ramen Noodles', qty: 300, uom: 'g' },
      { productId: 2, productName: 'Pork Belly (Chashu)', qty: 160, uom: 'g' },
      { productId: 8, productName: 'Fresh Eggs', qty: 2, uom: 'pcs' }
    ]
  },
];

export const INITIAL_USERS = [
  { username: 'admin', password: '123', name: 'Ceddy (Super Admin)', role: 'Admin', status: 'Active' },
  { username: 'cashier1', password: '123', name: 'Maria (Cashier)', role: 'Cashier', status: 'Active' },
  { username: 'cashier2', password: '123', name: 'John (Cashier)', role: 'Cashier', status: 'Active' },
  { username: 'chef', password: '123', name: 'Chief Ken (Kitchen)', role: 'Kitchen', status: 'Active' }
];

export const INITIAL_RAW_PRODUCTS = [
  { name: 'Ramen Noodles', brand: 'Fiddle Fresh', category: 'Ingredient', unitPrice: 25, quantity: 5000, uom: 'g', minStock: 1000 },
  { name: 'Pork Belly (Chashu)', brand: 'Local Farm', category: 'Meat', unitPrice: 320, quantity: 8000, uom: 'g', minStock: 2000 },
  { name: 'Soy Sauce', brand: 'Kikkoman', category: 'Seasoning', unitPrice: 180, quantity: 5000, uom: 'ml', minStock: 1000 },
  { name: 'Miso Paste', brand: 'Marukome', category: 'Seasoning', unitPrice: 220, quantity: 3000, uom: 'g', minStock: 500 },
  { name: 'Black Garlic Oil', brand: 'House Special', category: 'Oil', unitPrice: 350, quantity: 2000, uom: 'ml', minStock: 500 },
  { name: 'Sesame Oil', brand: 'Kadoya', category: 'Oil', unitPrice: 280, quantity: 2500, uom: 'ml', minStock: 500 },
  { name: 'Nori Sheets', brand: 'Yamamotoyama', category: 'Garnish', unitPrice: 120, quantity: 200, uom: 'sheets', minStock: 50 },
  { name: 'Fresh Eggs', brand: 'Magnolia', category: 'Ingredient', unitPrice: 10, quantity: 150, uom: 'pcs', minStock: 30 },
  { name: 'Bean Sprouts', brand: 'Fresh Market', category: 'Vegetable', unitPrice: 50, quantity: 3000, uom: 'g', minStock: 500 },
  { name: 'Japanese Rice', brand: 'Haru', category: 'Grain', unitPrice: 75, quantity: 10000, uom: 'g', minStock: 2500 }
];

export async function initDatabase() {
  console.log('[Database] Initializing connection...');

  // 1. Try MySQL via XAMPP
  try {
    const rawConnection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: ''
    });

    await rawConnection.query('CREATE DATABASE IF NOT EXISTS fiddledb');
    await rawConnection.end();

    mysqlPool = mysql.createPool({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'fiddledb',
      waitForConnections: true,
      connectionLimit: 10
    });

    // Test ping
    await mysqlPool.query('SELECT 1');
    dbMode = 'mysql';
    console.log('✅ [Database] Successfully connected to XAMPP MySQL database (fiddledb)!');
    await setupMySqlTables();
    return dbMode;
  } catch (err) {
    console.warn('⚠️ [Database] XAMPP MySQL not available or offline (' + err.message + ').');
    console.log('🔄 [Database] Falling back to embedded local SQLite engine for 100% offline uptime.');

    // 2. Fallback to SQLite
    const sqlitePath = path.join(__dirname, 'fiddledb.sqlite');
    sqliteDb = new Database(sqlitePath);
    sqliteDb.pragma('journal_mode = WAL');
    dbMode = 'sqlite';
    setupSqliteTables();
    console.log('✅ [Database] Offline SQLite database initialized at', sqlitePath);
    return dbMode;
  }
}

async function setupMySqlTables() {
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS menu_tbl (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(50) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      image VARCHAR(255),
      size VARCHAR(50) DEFAULT 'Regular',
      uom VARCHAR(50) DEFAULT 'serving',
      isBestSeller TINYINT(1) DEFAULT 0,
      stock INT DEFAULT 20,
      status VARCHAR(20) DEFAULT 'Active',
      recipeJson TEXT DEFAULT '[]'
    )
  `);

  try {
    await mysqlPool.query("ALTER TABLE menu_tbl ADD COLUMN recipeJson TEXT DEFAULT '[]'");
  } catch(e) {}

  for (const item of INITIAL_MENU) {
    if (item.recipe && item.recipe.length > 0) {
      try {
        await mysqlPool.query("UPDATE menu_tbl SET recipeJson = ? WHERE name = ? AND (recipeJson IS NULL OR recipeJson = '[]')", [
          JSON.stringify(item.recipe),
          item.name
        ]);
      } catch (e) {}
    }
  }

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS product_tbl (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      brand VARCHAR(100),
      category VARCHAR(50),
      unitPrice DECIMAL(10,2),
      quantity DECIMAL(10,2),
      uom VARCHAR(50),
      minStock DECIMAL(10,2),
      status VARCHAR(20) DEFAULT 'Active'
    )
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS orders_tbl (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transactionId VARCHAR(50) NOT NULL,
      itemsJson TEXT NOT NULL,
      subtotal DECIMAL(10, 2) NOT NULL,
      discountType VARCHAR(50) DEFAULT 'None',
      discountAmount DECIMAL(10, 2) DEFAULT 0,
      totalAmount DECIMAL(10, 2) NOT NULL,
      paymentMethod VARCHAR(50) NOT NULL,
      amountPaid DECIMAL(10, 2) NOT NULL,
      changeAmount DECIMAL(10, 2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Pending',
      cashier VARCHAR(100) DEFAULT 'CeddyAdmin',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS restocking_tbl (
      id INT AUTO_INCREMENT PRIMARY KEY,
      productId INT,
      processType VARCHAR(20),
      qty DECIMAL(10,2),
      expiryDate VARCHAR(50),
      notes TEXT,
      user VARCHAR(100),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS users_tbl (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'Cashier',
      status VARCHAR(20) DEFAULT 'Active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check if users need seeding in MySQL
  const [userRows] = await mysqlPool.query('SELECT COUNT(*) as cnt FROM users_tbl');
  if (userRows[0].cnt === 0) {
    for (const u of INITIAL_USERS) {
      await mysqlPool.query(
        'INSERT INTO users_tbl (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)',
        [u.username, u.password, u.name, u.role, u.status]
      );
    }
  }

  // Check if menu needs seeding
  const [rows] = await mysqlPool.query('SELECT COUNT(*) as cnt FROM menu_tbl');
  if (rows[0].cnt === 0) {
    console.log('[Database] Seeding initial Fiddle v3.4 menu into MySQL...');
    for (const item of INITIAL_MENU) {
      await mysqlPool.query(
        'INSERT INTO menu_tbl (name, category, price, image, size, uom, isBestSeller, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [item.name, item.category, item.price, item.image, item.size, item.uom, item.isBestSeller, item.stock]
      );
    }
    for (const prod of INITIAL_RAW_PRODUCTS) {
      await mysqlPool.query(
        'INSERT INTO product_tbl (name, brand, category, unitPrice, quantity, uom, minStock) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [prod.name, prod.brand, prod.category, prod.unitPrice, prod.quantity, prod.uom, prod.minStock]
      );
    }
  }
}

function setupSqliteTables() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS menu_tbl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      size TEXT DEFAULT 'Regular',
      uom TEXT DEFAULT 'serving',
      isBestSeller INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 20,
      status TEXT DEFAULT 'Active',
      recipeJson TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS product_tbl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      category TEXT,
      unitPrice REAL,
      quantity REAL,
      uom TEXT,
      minStock REAL,
      status TEXT DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS orders_tbl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transactionId TEXT NOT NULL,
      itemsJson TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discountType TEXT DEFAULT 'None',
      discountAmount REAL DEFAULT 0,
      totalAmount REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      amountPaid REAL NOT NULL,
      changeAmount REAL DEFAULT 0,
      status TEXT DEFAULT 'Pending',
      cashier TEXT DEFAULT 'CeddyAdmin',
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS restocking_tbl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER,
      processType TEXT,
      qty REAL,
      expiryDate TEXT,
      notes TEXT,
      user TEXT,
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS users_tbl (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Cashier',
      status TEXT DEFAULT 'Active',
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  try {
    sqliteDb.exec("ALTER TABLE menu_tbl ADD COLUMN recipeJson TEXT DEFAULT '[]'");
  } catch (e) {}

  // Backfill recipes for known default dishes if empty
  for (const item of INITIAL_MENU) {
    if (item.recipe && item.recipe.length > 0) {
      try {
        sqliteDb.prepare("UPDATE menu_tbl SET recipeJson = ? WHERE name = ? AND (recipeJson IS NULL OR recipeJson = '[]')").run(
          JSON.stringify(item.recipe),
          item.name
        );
      } catch (e) {}
    }
  }

  const userCount = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM users_tbl').get().cnt;
  if (userCount === 0) {
    const insertUser = sqliteDb.prepare(
      'INSERT INTO users_tbl (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)'
    );
    for (const u of INITIAL_USERS) {
      insertUser.run(u.username, u.password, u.name, u.role, u.status);
    }
  }

  const count = sqliteDb.prepare('SELECT COUNT(*) as cnt FROM menu_tbl').get().cnt;
  if (count === 0) {
    console.log('[Database] Seeding initial Fiddle v3.4 menu into SQLite...');
    const insertMenu = sqliteDb.prepare(
      'INSERT INTO menu_tbl (name, category, price, image, size, uom, isBestSeller, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertProd = sqliteDb.prepare(
      'INSERT INTO product_tbl (name, brand, category, unitPrice, quantity, uom, minStock) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    for (const item of INITIAL_MENU) {
      insertMenu.run(item.name, item.category, item.price, item.image, item.size, item.uom, item.isBestSeller, item.stock);
    }
    for (const prod of INITIAL_RAW_PRODUCTS) {
      insertProd.run(prod.name, prod.brand, prod.category, prod.unitPrice, prod.quantity, prod.uom, prod.minStock);
    }
  }
}

// Unified Query Helper
export async function query(sql, params = []) {
  if (dbMode === 'mysql') {
    const [results] = await mysqlPool.query(sql, params);
    return results;
  } else {
    // SQLite format
    const statement = sqliteDb.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return statement.all(params);
    } else {
      const info = statement.run(params);
      return { insertId: info.lastInsertRowid, affectedRows: info.changes };
    }
  }
}

export function getDbMode() {
  return dbMode;
}
