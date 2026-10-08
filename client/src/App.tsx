import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Sidebar, USERS_LIST } from './components/Sidebar';
import { Header } from './components/Header';
import { TransactionPOS } from './components/TransactionPOS';
import { CartPanel } from './components/CartPanel';
import { PromptPayment } from './components/PromptPayment';
import { ReceiptModal } from './components/ReceiptModal';
import { KitchenDisplay } from './components/KitchenDisplay';
import { InventoryManager } from './components/InventoryManager';
import { ReportsViewer } from './components/ReportsViewer';
import { DashboardView } from './components/DashboardView';
import { PrinterMaintenance } from './components/PrinterMaintenance';
import { UserManagementModal } from './components/UserManagementModal';
import { ServerConnectionModal } from './components/ServerConnectionModal';
import { CashDrawerModal } from './components/CashDrawerModal';
import { apiFetch, getServerUrl } from './apiConfig';
import type { MenuItem, CartItem, RawProduct, Order, User } from './types';
import { FALLBACK_MENU, FALLBACK_PRODUCTS } from './initialData';

export const App: React.FC = () => {
  // Current Logged-in Staff User
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('rxs_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return USERS_LIST[1]; // Default: Maria (Cashier)
  });

  const [tvMode, setTvMode] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const saved = localStorage.getItem('rxs_active_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u.role === 'Kitchen') return 'kitchen';
        if (u.role === 'Admin') return 'dashboard';
      } catch (e) {}
    }
    return 'pos';
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rawProducts, setRawProducts] = useState<RawProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentTransactionId, setCurrentTransactionId] = useState<string>(() =>
    String(Math.floor(1000000 + Math.random() * 9000000))
  );

  const [dbEngine, setDbEngine] = useState<string>('XAMPP MySQL');
  const [printerStatus, setPrinterStatus] = useState<{ connected: boolean; paperReady: boolean }>({
    connected: true,
    paperReady: true
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [isCashDrawerModalOpen, setIsCashDrawerModalOpen] = useState<boolean>(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Tactile sound effect
  const playBeep = useCallback((freq = 800, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }, [soundEnabled]);

  // High-fidelity Dual-Tone Kitchen Bell Chime (Ding-Dong!)
  const playKitchenChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(587.33, now, 0.45);        // D5
      playTone(880.00, now + 0.18, 0.75); // A5
    } catch (e) {}
  }, [soundEnabled]);

  // Initial Fetch (Server or Offline Tablet Storage)
  const fetchData = async () => {
    try {
      const [menuRes, prodRes, ordRes, statusRes] = await Promise.all([
        apiFetch('/api/menu').then((r) => r.json()),
        apiFetch('/api/products').then((r) => r.json()),
        apiFetch('/api/orders').then((r) => r.json()),
        apiFetch('/api/status').then((r) => r.json())
      ]);

      if (Array.isArray(menuRes) && menuRes.length > 0) {
        setMenuItems(menuRes);
        localStorage.setItem('fiddle_menu', JSON.stringify(menuRes));
      }
      if (Array.isArray(prodRes) && prodRes.length > 0) {
        setRawProducts(prodRes);
        localStorage.setItem('fiddle_products', JSON.stringify(prodRes));
      }
      if (Array.isArray(ordRes)) {
        setOrders(ordRes);
        localStorage.setItem('fiddle_orders', JSON.stringify(ordRes));
      }
      if (statusRes.dbEngine) setDbEngine(statusRes.dbEngine);
      if (statusRes.printer) setPrinterStatus(statusRes.printer);
    } catch (err) {
      console.warn('Backend API offline - using internal offline tablet storage');
      const cachedMenu = localStorage.getItem('fiddle_menu');
      const cachedProd = localStorage.getItem('fiddle_products');
      const cachedOrders = localStorage.getItem('fiddle_orders');

      setMenuItems(cachedMenu ? JSON.parse(cachedMenu) : FALLBACK_MENU);
      setRawProducts(cachedProd ? JSON.parse(cachedProd) : FALLBACK_PRODUCTS);
      setOrders(cachedOrders ? JSON.parse(cachedOrders) : []);
      setDbEngine('Tablet Offline Storage');
    }
  };

  useEffect(() => {
    fetchData();

    // Setup WebSockets for Real-time Multi-Screen Sync
    const serverUrl = getServerUrl();
    const socket: Socket = io(serverUrl || undefined, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setIsSocketConnected(true);
      fetchData(); // Sync up on reconnect
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Real-time Event 1: Dish stock updated (order placed or admin edited)
    socket.on('stock:updated', ({ id, stock }) => {
      setMenuItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, stock } : item))
      );
    });

    // Real-time Event 2: New order punched by cashier -> Kitchen chimes, Admin updates
    socket.on('order:new', (newOrder: Order) => {
      setOrders((prev) => [newOrder, ...prev]);
      playKitchenChime(); // Audibly notify kitchen station
    });

    // Real-time Event 3: Kitchen updates status -> Cashier and Admin see progress live
    socket.on('order:status', ({ id, status }) => {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === id ? { ...ord, status } : ord))
      );
      playBeep(950, 'sine', 0.06);
    });

    // Real-time Event 4: Raw inventory updated
    socket.on('inventory:updated', (updated) => {
      setRawProducts((prev) => {
        const next = prev.map((p) => (p.id === updated.id ? updated : p));
        try {
          localStorage.setItem('fiddle_products', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    });

    // Real-time Event 4b: New Raw Product Added
    socket.on('inventory:new', (newProd: RawProduct) => {
      setRawProducts((prev) => {
        const exists = prev.some((p) => p.id === newProd.id);
        const next = exists ? prev.map((p) => (p.id === newProd.id ? newProd : p)) : [...prev, newProd];
        try {
          localStorage.setItem('fiddle_products', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    });

    // Real-time Event 4c: Raw Product Deleted
    socket.on('inventory:deleted', ({ id }: { id: number }) => {
      setRawProducts((prev) => {
        const next = prev.filter((p) => p.id !== id);
        try {
          localStorage.setItem('fiddle_products', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    });

    // Real-time Event 5: New menu item added
    socket.on('menu:new', (newItem: MenuItem) => {
      setMenuItems((prev) => {
        const exists = prev.some((i) => i.id === newItem.id);
        const next = exists ? prev.map((i) => (i.id === newItem.id ? newItem : i)) : [...prev, newItem];
        try {
          localStorage.setItem('fiddle_menu', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    });

    // Real-time Event 6: Menu item updated
    socket.on('menu:updated', (updatedItem: MenuItem) => {
      setMenuItems((prev) => {
        const next = prev.map((i) => (i.id === updatedItem.id ? updatedItem : i));
        try {
          localStorage.setItem('fiddle_menu', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    });

    // Real-time Event 7: Menu item deleted
    socket.on('menu:deleted', ({ id }: { id: number }) => {
      setMenuItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        try {
          localStorage.setItem('fiddle_menu', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [playKitchenChime, playBeep]);

  // Cart actions
  const handleAddToCart = (item: CartItem) => {
    playBeep(900, 'sine', 0.05);
    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === item.id &&
          i.spiceLevel === item.spiceLevel &&
          JSON.stringify(i.addons) === JSON.stringify(item.addons)
      );
      if (existing) {
        return prev.map((i) =>
          i.cartId === existing.cartId ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const handleUpdateQty = (cartId: string, delta: number) => {
    playBeep(700, 'sine', 0.04);
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.cartId === cartId) {
            const newQty = it.qty + delta;
            return newQty > 0 ? { ...it, qty: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (cartId: string) => {
    playBeep(400, 'triangle', 0.08);
    setCart((prev) => prev.filter((it) => it.cartId !== cartId));
  };

  const handleClearCart = () => {
    playBeep(300, 'triangle', 0.1);
    setCart([]);
  };

  // Payment Execution (Server or 100% Offline Tablet)
  const handleCompletePayment = async (details: any) => {
    const newOrder: Order = {
      id: Date.now(),
      transactionId: currentTransactionId,
      items: cart,
      subtotal: details.subtotal,
      discountType: details.discountType,
      discountAmount: details.discountAmount,
      totalAmount: details.totalAmount,
      paymentMethod: details.paymentMethod,
      amountPaid: details.amountPaid,
      changeAmount: details.changeAmount,
      status: 'Pending',
      cashier: currentUser.name,
      createdAt: new Date().toISOString()
    };

    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...details,
          items: cart,
          cashier: currentUser.name
        })
      });
      const data = await res.json();
      if (data.success) {
        playBeep(1100, 'sine', 0.2);
        setCompletedOrder(data.order);
        setIsPaymentOpen(false);
        setCart([]);
        setCurrentTransactionId(String(Math.floor(1000000 + Math.random() * 9000000)));
        return;
      }
    } catch (err) {
      console.log('Processing order in standalone tablet offline mode');
    }

    // Standalone fallback inside APK on tablet:
    playBeep(1100, 'sine', 0.2);
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      localStorage.setItem('fiddle_orders', JSON.stringify(updated));
      return updated;
    });

    // Deduct stock locally
    setMenuItems((prev) => {
      const updated = prev.map((item) => {
        const inCart = cart.find((c) => c.id === item.id);
        return inCart ? { ...item, stock: Math.max(0, item.stock - inCart.qty) } : item;
      });
      localStorage.setItem('fiddle_menu', JSON.stringify(updated));
      return updated;
    });

    // Deduct raw ingredients locally based on dish recipe (Bill of Materials)
    setRawProducts((prev) => {
      let updated = [...prev];
      cart.forEach((cartItem) => {
        const menuItem = menuItems.find((m) => m.id === cartItem.id);
        if (menuItem && Array.isArray(menuItem.recipe)) {
          menuItem.recipe.forEach((ing) => {
            const deductTotal = Number(ing.qty) * Number(cartItem.qty);
            updated = updated.map((raw) => {
              if (raw.id === ing.productId) {
                return { ...raw, quantity: Math.max(0, raw.quantity - deductTotal) };
              }
              return raw;
            });
          });
        }
      });
      localStorage.setItem('fiddle_products', JSON.stringify(updated));
      return updated;
    });

    setCompletedOrder(newOrder);
    setIsPaymentOpen(false);
    setCart([]);
    setCurrentTransactionId(String(Math.floor(1000000 + Math.random() * 9000000)));
  };

  // Order status update (Kitchen)
  const handleUpdateOrderStatus = async (
    orderId: number,
    status: 'Preparing' | 'Ready' | 'Completed'
  ) => {
    playBeep(1000, 'sine', 0.08);

    // 1. OPTIMISTIC INSTANT UPDATE (0ms delay for offline tablet & APK)
    setOrders((prev) => {
      const updated = prev.map((ord) => {
        const isMatch =
          (ord.id && String(ord.id) === String(orderId)) ||
          (ord.transactionId && String(ord.transactionId) === String(orderId));
        return isMatch ? { ...ord, status } : ord;
      });
      try {
        localStorage.setItem('fiddle_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Notify backend server if reachable
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {}
  };

  // Menu Stock inline update (Optimistic + Offline Tablet Persistent)
  const handleUpdateMenuStock = async (id: number, stock: number) => {
    playBeep(850, 'sine', 0.04);
    const newStock = Math.max(0, stock);

    setMenuItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, stock: newStock } : item));
      try {
        localStorage.setItem('fiddle_menu', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await apiFetch(`/api/menu/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
    } catch (e) {}
  };

  // Raw Stock adjust (Optimistic + Offline Tablet Persistent)
  const handleAdjustRawStock = async (
    productId: number,
    processType: 'Add' | 'Minus',
    qty: number,
    notes: string
  ) => {
    playBeep(900, 'sine', 0.05);
    const delta = processType === 'Add' ? Number(qty) : -Number(qty);

    setRawProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const newQty = Math.max(0, p.quantity + delta);
          return { ...p, quantity: newQty };
        }
        return p;
      });
      try {
        localStorage.setItem('fiddle_products', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await apiFetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, processType, qty, notes, user: currentUser.name })
      });
    } catch (e) {}
  };

  // Create New Food / Menu Item with Recipe (Optimistic + Offline Tablet Persistent)
  const handleCreateMenuItem = async (item: Partial<MenuItem>) => {
    playBeep(1000, 'sine', 0.08);
    const tempId = Date.now();
    const newItem: MenuItem = {
      id: tempId,
      name: item.name || 'New Dish',
      category: item.category || 'Ramen',
      price: Number(item.price) || 0,
      image: item.image || '/images/icons/NoPicture.png',
      size: item.size || 'Regular',
      uom: item.uom || 'serving',
      isBestSeller: item.isBestSeller ? 1 : 0,
      stock: Number(item.stock) || 0,
      status: item.status || 'Active',
      recipe: item.recipe || []
    };

    setMenuItems((prev) => {
      const updated = [...prev, newItem];
      try {
        localStorage.setItem('fiddle_menu', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const res = await apiFetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (data.success && data.item) {
        setMenuItems((prev) => {
          const updated = prev.map((it) => (it.id === tempId ? data.item : it));
          try {
            localStorage.setItem('fiddle_menu', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (e) {}
  };

  // Update Food Item & Recipe (Optimistic + Offline Tablet Persistent)
  const handleUpdateMenuItem = async (item: MenuItem) => {
    playBeep(1000, 'sine', 0.08);
    setMenuItems((prev) => {
      const updated = prev.map((it) => (it.id === item.id ? item : it));
      try {
        localStorage.setItem('fiddle_menu', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      const res = await apiFetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      const data = await res.json();
      if (data.success && data.item) {
        setMenuItems((prev) => {
          const updated = prev.map((it) => (it.id === item.id ? data.item : it));
          try {
            localStorage.setItem('fiddle_menu', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    } catch (e) {}
  };

  // Delete Food Item (Optimistic + Offline Tablet Persistent)
  const handleDeleteMenuItem = async (id: number) => {
    playBeep(750, 'sine', 0.08);
    setMenuItems((prev) => {
      const updated = prev.filter((it) => it.id !== id);
      try {
        localStorage.setItem('fiddle_menu', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await apiFetch(`/api/menu/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {}
  };

  // Batch Prep / Cooking: Cooks portions & deducts required ingredients
  const handleBatchPrep = async (menuId: number, portions: number) => {
    playBeep(1100, 'sine', 0.1);
    const numPortions = Number(portions);
    if (isNaN(numPortions) || numPortions <= 0) return;

    // 1. Locally increment menu stock
    setMenuItems((prev) => {
      const updated = prev.map((m) => {
        if (m.id === menuId) {
          return { ...m, stock: m.stock + numPortions };
        }
        return m;
      });
      try {
        localStorage.setItem('fiddle_menu', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Locally deduct raw ingredients based on recipe
    const targetMenu = menuItems.find((m) => m.id === menuId);
    if (targetMenu && Array.isArray(targetMenu.recipe)) {
      setRawProducts((prev) => {
        let updated = [...prev];
        targetMenu.recipe!.forEach((ing) => {
          const totalDeduct = Number(ing.qty) * numPortions;
          updated = updated.map((raw) => {
            if (raw.id === ing.productId) {
              return { ...raw, quantity: Math.max(0, raw.quantity - totalDeduct) };
            }
            return raw;
          });
        });
        try {
          localStorage.setItem('fiddle_products', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    try {
      const res = await apiFetch(`/api/menu/${menuId}/prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portions: numPortions, user: currentUser.name })
      });
      const data = await res.json();
      if (data.success) {
        if (data.menuItem) {
          setMenuItems((prev) => prev.map((m) => (m.id === menuId ? data.menuItem : m)));
        }
        if (Array.isArray(data.deductedIngredients)) {
          setRawProducts((prev) => {
            let updated = [...prev];
            data.deductedIngredients.forEach((d: RawProduct) => {
              updated = updated.map((r) => (r.id === d.id ? d : r));
            });
            return updated;
          });
        }
      }
    } catch (e) {}
  };

  // Create New Raw Ingredient / Supply (Optimistic + Offline Tablet Persistent)
  const handleCreateRawProduct = async (prod: Partial<RawProduct>) => {
    playBeep(1000, 'sine', 0.08);
    const tempId = Date.now();
    const newProd: RawProduct = {
      id: tempId,
      name: prod.name || 'New Ingredient',
      brand: prod.brand || 'General',
      category: prod.category || 'Ingredient',
      unitPrice: Number(prod.unitPrice) || 0,
      quantity: Number(prod.quantity) || 0,
      uom: prod.uom || 'g',
      minStock: Number(prod.minStock) || 100,
      status: 'Active'
    };

    setRawProducts((prev) => {
      const updated = [...prev, newProd];
      try { localStorage.setItem('fiddle_products', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      const data = await res.json();
      if (data.success && data.product) {
        setRawProducts((prev) => {
          const updated = prev.map((p) => (p.id === tempId ? data.product : p));
          try { localStorage.setItem('fiddle_products', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
    } catch (e) {}
  };

  // Update Raw Ingredient (Optimistic + Offline Tablet Persistent)
  const handleUpdateRawProduct = async (prod: RawProduct) => {
    playBeep(900, 'sine', 0.06);
    setRawProducts((prev) => {
      const updated = prev.map((p) => (p.id === prod.id ? prod : p));
      try { localStorage.setItem('fiddle_products', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      const res = await apiFetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod)
      });
      const data = await res.json();
      if (data.success && data.product) {
        setRawProducts((prev) => {
          const updated = prev.map((p) => (p.id === prod.id ? data.product : p));
          try { localStorage.setItem('fiddle_products', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
      }
    } catch (e) {}
  };

  // Delete Raw Ingredient (Optimistic + Offline Tablet Persistent)
  const handleDeleteRawProduct = async (id: number) => {
    playBeep(750, 'sine', 0.08);
    setRawProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try { localStorage.setItem('fiddle_products', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    try {
      await apiFetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {}
  };

  // Handle Switching User Account (Seamless shift change without reloading)
  const handleSwitchUser = (user: User) => {
    playBeep(900, 'sine', 0.08);
    setCurrentUser(user);
    localStorage.setItem('rxs_active_user', JSON.stringify(user));

    if (user.role === 'Kitchen') {
      setCurrentTab('kitchen');
    } else if (user.role === 'Cashier') {
      setCurrentTab('pos');
      setTvMode(false);
    } else if (user.role === 'Admin') {
      // Admin keeps full navigation
    }
  };

  const pendingKitchenCount = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing'
  ).length;

  // TV Screen Mode (Dedicated Full Screen Kitchen Display)
  if (tvMode) {
    return (
      <div className="h-screen w-screen bg-[#080a0d] text-white flex flex-col overflow-hidden relative font-sans">
        <div className="absolute top-4 right-6 z-50 flex items-center gap-3">
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            KITCHEN TV SCREEN • ACTIVE
          </span>
          <button
            onClick={() => setTvMode(false)}
            className="px-3.5 py-1.5 rounded-xl bg-[#151a21] hover:bg-[#202733] border border-[#2b3543] text-gray-300 hover:text-white text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            Exit TV Mode
          </button>
        </div>

        <KitchenDisplay
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onPlayChime={playKitchenChime}
        />
      </div>
    );
  }

  const lowStockIngredients = rawProducts.filter((p) => p.quantity <= p.minStock);

  return (
    <div className="flex h-screen w-screen bg-[#0c0e11] text-white overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          playBeep(600, 'sine', 0.03);
          setCurrentTab(tab);
        }}
        pendingKitchenCount={pendingKitchenCount}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        tvMode={tvMode}
        setTvMode={setTvMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          dbEngine={dbEngine}
          printerStatus={printerStatus}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          currentUser={currentUser}
          onOpenUserModal={() => setIsUserModalOpen(true)}
          isSocketConnected={isSocketConnected}
          lowStockIngredients={lowStockIngredients}
          onOpenServerModal={() => setIsServerModalOpen(true)}
          onOpenCashDrawerModal={() => setIsCashDrawerModalOpen(true)}
        />

        {/* Tab Views */}
        <div className="flex-1 flex overflow-hidden">
          {currentTab === 'pos' && (
            <>
              <TransactionPOS menuItems={menuItems} onAddToCart={handleAddToCart} />
              <CartPanel
                cart={cart}
                transactionId={currentTransactionId}
                onUpdateQty={handleUpdateQty}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onOpenPayment={() => {
                  playBeep(850, 'sine', 0.05);
                  setIsPaymentOpen(true);
                }}
              />
            </>
          )}

          {currentTab === 'kitchen' && (
            <KitchenDisplay
              orders={orders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onPlayChime={playKitchenChime}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryManager
              menuItems={menuItems}
              rawProducts={rawProducts}
              onUpdateMenuStock={handleUpdateMenuStock}
              onAdjustRawStock={handleAdjustRawStock}
              onCreateMenuItem={handleCreateMenuItem}
              onUpdateMenuItem={handleUpdateMenuItem}
              onDeleteMenuItem={handleDeleteMenuItem}
              onBatchPrep={handleBatchPrep}
              onCreateRawProduct={handleCreateRawProduct}
              onUpdateRawProduct={handleUpdateRawProduct}
              onDeleteRawProduct={handleDeleteRawProduct}
              onRefresh={fetchData}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              orders={orders}
              menuItems={menuItems}
              rawProducts={rawProducts}
              onRefresh={fetchData}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsViewer
              orders={orders}
              onRefresh={fetchData}
              onOpenCashDrawer={() => setIsCashDrawerModalOpen(true)}
            />
          )}

          {currentTab === 'printer' && (
            <PrinterMaintenance
              printerStatus={printerStatus}
              onRefreshStatus={fetchData}
            />
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PromptPayment
          cart={cart}
          transactionId={currentTransactionId}
          onClose={() => setIsPaymentOpen(false)}
          onCompletePayment={handleCompletePayment}
        />
      )}

      {/* Printable Receipt Modal */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      {/* User Management & Shift Switcher Modal */}
      {isUserModalOpen && (
        <UserManagementModal
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}

      {/* Server & LAN Sync Modal */}
      <ServerConnectionModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        isSocketConnected={isSocketConnected}
        onServerChanged={() => {
          fetchData();
          window.location.reload();
        }}
      />

      {/* Cash Drawer Balancing & Shift Audit (X-Reading) Modal */}
      <CashDrawerModal
        isOpen={isCashDrawerModalOpen}
        onClose={() => setIsCashDrawerModalOpen(false)}
        currentUser={currentUser}
        orders={orders}
      />
    </div>
  );
};

export default App;
