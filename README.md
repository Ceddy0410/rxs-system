# Fiddle v3.4 — Real-Time Sales & Inventory POS System

Modern, 100% offline-capable Point of Sale and Inventory Management System designed with the **original Fiddle v3.4 Color Splash UI**, responsive for **MacBook and iPad**.

---

## 🚀 How to Run

### Option 1: Quick Start (Single Command)
```bash
npm start
```
This runs the full POS server and serves the complete Fiddle interface at:
* **MacBook / Laptop**: [`http://localhost:3001`](http://localhost:3001)
* **iPad / Tablets (Local Wi-Fi)**: `http://192.168.1.66:3001`

*(Tip for iPad: In Safari, tap the Share button and select **"Add to Home Screen"** to run it in full-screen mode like a dedicated POS terminal!)*

---

## 🗄️ Database & XAMPP Integration
* **Primary**: **MySQL via XAMPP** (`127.0.0.1:3306`, user: `root`, password: `""`, database: `fiddledb`).
* **Zero-Friction Offline Fallback**: If XAMPP MySQL is turned off or not running, the system automatically runs on an embedded local SQLite engine (`server/fiddledb.sqlite`). The POS never crashes, ensuring 100% store uptime!
* When you launch MySQL in the XAMPP Control Panel, it connects automatically.

---

## 🍔 Features Replicated from Fiddle v3.4
1. **Transaction / POS Module**:
   * Exact Fiddle dark charcoal (`#0c0e11`), vibrant yellow (`#fed428`), and cyan (`#0ca1e1`) Color Splash design.
   * Categories: `All`, `Ramen`, `Rice Meals`, `Drinks`, `Bundle`.
   * Real food photography and circular dishes (`Kuro Ramen`, `Aka Ramen`, `Beef Gyudon`, `Pork Katsu`, etc.).
   * ★ Best Seller badges and real-time live stock counters.
   * Ramen Spice Level selector (`Mild`, `Hot`, `Extra Hot`) & Addons modal (`Pork Chashu`, `Tamago`, `Nori`).
   * Live Cart ticket with quantity steppers (`[-]` / `[+]`), Void buttons, subtotal, and ticket numbers.
2. **Prompt Payment & Tender (`PromptPayment.cs`)**:
   * `Cash` and `GCash / Card` tender options.
   * Discounts: `Senior Citizen` (20%), `PWD` (20%), `Special Promo` (10%) with Senior/PWD ID input.
   * Quick bills preset buttons (`Exact`, `₱200`, `₱500`, `₱1,000`).
   * Real-time change calculation.
3. **Receipt Printing (`Receipt.cs`)**:
   * Formatted for 80mm & 58mm thermal receipt printers.
   * ESC/POS driverless engine with live receipt preview.
4. **Kitchen Order Display (`KitchenFRM.cs`)**:
   * Live incoming orders from cashiers with sound alerts.
   * Cook workflow: `Start Preparing` ➔ `Mark as Ready` ➔ `Serve & Complete`.
5. **Inventory & Restocking (`PromptStock` / `ProductMNT`)**:
   * Menu portion tracking and raw ingredient inventory (`product_tbl`).
   * Restocking logs with reasons and audit history.
   * Low stock warnings.
6. **Printer Maintenance & Hardware Diagnostics**:
   * Physical cable / LAN status detector.
   * Thermal paper roll status detector.
   * Diagnostic test print button and error simulation toggles.
